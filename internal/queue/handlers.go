package queue

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/hibiken/asynq"
	"github.com/rs/zerolog"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/config"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/downloader"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/llm"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/ml"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/models"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/repository"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/scoring"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/storage"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/youtube"
)

type TaskHandlers struct {
	log        zerolog.Logger
	videoRepo  *repository.VideoRepository
	clipRepo   *repository.ClipRepository
	fmRepo     *repository.FeatureMatrixRepository
	userRepo   *repository.UserRepository
	mlClient   ml.Service
	storage    *storage.SupabaseClient
	llmRotator *llm.Rotator
	queue      *Client
	cfg        *config.Config
}

func NewTaskHandlers(
	log zerolog.Logger,
	videoRepo *repository.VideoRepository,
	clipRepo *repository.ClipRepository,
	fmRepo *repository.FeatureMatrixRepository,
	userRepo *repository.UserRepository,
	mlClient ml.Service,
	supabase *storage.SupabaseClient,
	llmRotator *llm.Rotator,
	queue *Client,
	cfg *config.Config,
) *TaskHandlers {
	return &TaskHandlers{
		log:        log,
		videoRepo:  videoRepo,
		clipRepo:   clipRepo,
		fmRepo:     fmRepo,
		userRepo:   userRepo,
		mlClient:   mlClient,
		storage:    supabase,
		llmRotator: llmRotator,
		queue:      queue,
		cfg:        cfg,
	}
}

func (h *TaskHandlers) HandleProcessVideo(ctx context.Context, t *asynq.Task) error {
	var p ProcessVideoPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("decode payload: %w", err)
	}

	videoID, err := primitive.ObjectIDFromHex(p.VideoID)
	if err != nil {
		return fmt.Errorf("invalid videoId: %w", err)
	}
	userID, err := primitive.ObjectIDFromHex(p.UserID)
	if err != nil {
		return fmt.Errorf("invalid userId: %w", err)
	}

	log := h.log.With().
		Str("videoId", p.VideoID).
		Str("userId", p.UserID).
		Logger()

	video, err := h.videoRepo.FindByID(ctx, videoID)
	if err != nil {
		return fmt.Errorf("find video: %w", err)
	}

	fail := func(stage string, err error) error {
		log.Error().Err(err).Str("stage", stage).Msg("video processing failed")
		_ = h.videoRepo.UpdateStatus(ctx, videoID, models.StatusFailed, err.Error())
		return fmt.Errorf("%s: %w", stage, err)
	}

	log.Info().Msg("video processing phase: downloading")
	_ = h.videoRepo.UpdateStatus(ctx, videoID, models.StatusDownloading, "")

	dl, err := downloader.Download(ctx, video.YouTubeVideoID)
	if err != nil {
		return fail("download", err)
	}
	defer dl.Cleanup()

	videoData, err := os.ReadFile(dl.FilePath)
	if err != nil {
		return fail("read downloaded file", err)
	}

	videoKey := downloader.VideoKey(p.UserID, p.VideoID)

	// Upload the raw video
	_, err = h.storage.Upload(
		ctx,
		"raw-videos",
		videoKey,
		"video/mp4",
		videoData,
	)
	if err != nil {
		return fail("upload video to storage", err)
	}

	log.Info().
		Str("bucket", "raw-videos").
		Str("objectKey", videoKey).
		Msg("video uploaded")

	// Create a temporary signed URL for the uploaded video.
	// This URL is passed to the ML service so it can access the private object.
	log.Info().
		Str("bucket", "raw-videos").
		Str("objectKey", videoKey).
		Msg("creating signed URL for raw video")

	videoURL, err := h.storage.SignedURL(
		ctx,
		"raw-videos",
		videoKey,
		3600,
	)
	if err != nil {
		log.Error().
			Err(err).
			Str("bucket", "raw-videos").
			Str("objectKey", videoKey).
			Msg("failed to create signed URL")

		return fail("get signed url", err)
	}

	log.Info().
		Str("videoURL", videoURL).
		Msg("raw video signed URL created")

	log.Info().Msg("video processing phase: transcribing")
	_ = h.videoRepo.UpdateStatus(ctx, videoID, models.StatusTranscribing, "")

	transcription, err := h.mlClient.Transcribe(ctx, ml.TranscribeRequest{
		VideoID:  p.VideoID,
		AudioURL: videoURL,
	})
	if err != nil {
		return fail("transcribe", err)
	}

	log.Info().
		Int("segments", len(transcription.Segments)).
		Msg("transcription complete")

	log.Info().Msg("video processing phase: analyzing")
	_ = h.videoRepo.UpdateStatus(ctx, videoID, models.StatusAnalyzing, "")

	analysis, err := h.mlClient.Analyze(ctx, ml.AnalyzeRequest{
		VideoID:  p.VideoID,
		UserID:   p.UserID,
		Segments: transcription.Segments,
	})
	if err != nil {
		return fail("analyze", err)
	}

	windows := make([]ml.SegmentWindow, len(transcription.Segments))
	for i, s := range transcription.Segments {
		windows[i] = ml.SegmentWindow{Start: s.Start, End: s.End}
	}

	emotion, err := h.mlClient.DetectEmotion(ctx, ml.EmotionRequest{
		VideoID:  p.VideoID,
		AudioURL: videoURL,
		Segments: windows,
	})
	if err != nil {
		return fail("detect emotion", err)
	}

	scores := scoring.Score(*transcription, *analysis, *emotion)
	for _, s := range scores {
		log.Info().
			Int("segment", s.Index).
			Float64("viralScore", s.ViralScore).
			Float64("start", s.Start).
			Float64("end", s.End).
			Str("text", s.Text).
			Msg("segment score")
	}

	const clipThreshold = 0.70

	var candidates []scoring.SegmentScore
	for _, s := range scores {
		if s.ViralScore >= clipThreshold {
			candidates = append(candidates, s)
		}
	}

	log.Info().
		Int("segments", len(scores)).
		Int("candidates", len(candidates)).
		Msg("clip detection complete")

	if len(candidates) == 0 {
		_ = h.videoRepo.UpdateStatus(ctx, videoID, models.StatusCompleted, "")
		log.Info().Msg("video processing completed — no clips above threshold")
		return nil
	}

	clips := make([]models.Clip, 0, len(candidates))
	fmRows := make([]models.FeatureMatrix, 0, len(candidates))

	for i, cs := range candidates {
		hookText, err := h.llmRotator.Call(ctx, hookPrompt(cs.Text))
		if err != nil {
			log.Warn().Err(err).Int("segment", cs.Index).Msg("hook generation failed — using transcript as hook")
			hookText = truncate(cs.Text, 120)
		}

		clipID := primitive.NewObjectID()

		posRatio := 0.0
		if video.DurationSeconds > 0 {
			posRatio = cs.Start / float64(video.DurationSeconds)
		}

		clips = append(clips, models.Clip{
			ID:               clipID,
			VideoID:          videoID,
			UserID:           userID,
			StartTime:        cs.Start,
			EndTime:          cs.End,
			DurationSeconds:  cs.End - cs.Start,
			TranscriptText:   cs.Text,
			Category:         models.CategoryViral,
			ViralScore:       cs.ViralScore,
			GenericPredScore: cs.ViralScore,
			Scores: models.ClipScores{
				Emotion:        cs.EmotionScore,
				SemanticImpact: cs.SemanticImpactScore,
				SpeechEmphasis: cs.SpeechEmphasisScore,
				Clarity:        cs.ClarityScore,
				Novelty:        cs.NoveltyScore,
			},
			SemanticLabels: cs.SemanticLabels,
			EmotionType:    cs.EmotionType,
			OriginalHook:   truncate(cs.Text, 120),
			HookScore:      cs.ViralScore,
			SelectedHook:   hookText,
			SuggestedHooks: []models.SuggestedHook{{Text: hookText, HookScore: cs.ViralScore}},
			Status:         models.ClipStatusDetected,
		})

		fmRows = append(fmRows, models.FeatureMatrix{
			ID:                  primitive.NewObjectID(),
			ClipID:              clipID,
			VideoID:             videoID,
			UserID:              userID,
			EmotionScore:        cs.EmotionScore,
			SemanticImpactScore: cs.SemanticImpactScore,
			SpeechEmphasisScore: cs.SpeechEmphasisScore,
			ClarityScore:        cs.ClarityScore,
			NoveltyScore:        cs.NoveltyScore,
			HookScore:           cs.ViralScore,
			DurationSeconds:     cs.End - cs.Start,
			VideoPositionRatio:  posRatio,
		})

		log.Info().
			Int("candidate", i+1).
			Float64("viralScore", cs.ViralScore).
			Str("emotionType", cs.EmotionType).
			Msg("clip scored")
	}

	if err := h.clipRepo.BulkInsert(ctx, clips); err != nil {
		return fail("persist clips", err)
	}
	if err := h.fmRepo.BulkInsert(ctx, fmRows); err != nil {
		return fail("persist feature matrix", err)
	}
	if err := h.videoRepo.SetClipsDetected(ctx, videoID, len(clips)); err != nil {
		log.Warn().Err(err).Msg("set clips detected count failed — non-fatal")
	}
	_ = h.videoRepo.UpdateStatus(ctx, videoID, models.StatusCompleted, "")

	log.Info().Int("clips", len(clips)).Msg("video processing completed")
	return nil
}

func (h *TaskHandlers) HandleExportClip(ctx context.Context, t *asynq.Task) error {
	var p ExportClipPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("decode payload: %w", err)
	}

	log := h.log.With().
		Str("clipId", p.ClipID).
		Str("userId", p.UserID).
		Logger()

	log.Info().Msg("export job started")

	clipID, err := primitive.ObjectIDFromHex(p.ClipID)
	if err != nil {
		return fmt.Errorf("invalid clipId: %w", err)
	}

	clip, err := h.clipRepo.FindByID(ctx, clipID)
	if err != nil {
		return fmt.Errorf("find clip: %w", err)
	}

	video, err := h.videoRepo.FindByID(ctx, clip.VideoID)
	if err != nil {
		return fmt.Errorf("find video: %w", err)
	}

	// Get a signed URL so the Python service can download the raw video
	videoURL, err := h.storage.SignedURL(ctx, "raw-videos",
		downloader.VideoKey(p.UserID, video.ID.Hex()), 3600)
	if err != nil {
		return fmt.Errorf("get signed url: %w", err)
	}

	// Build callback URL pointing back to this Go server
	callbackURL := h.cfg.BaseURL + "/api/internal/short/done"

	editReq := map[string]any{
		"job_id":          p.ClipID,
		"clip_id":         p.ClipID,
		"user_id":         p.UserID,
		"video_url":       videoURL,
		"start_time":      clip.StartTime,
		"end_time":        clip.EndTime,
		"style":           styleFromEditSettings(clip.EditSettings),
		"hook_text":       clip.SelectedHook,
		"music_mood":      clip.EditSettings.MusicMood,
		"remove_silences": clip.EditSettings.RemoveSilences,
		"remove_fillers":  clip.EditSettings.RemoveFillers,
		"callback_url":    callbackURL,
		"callback_key":    h.cfg.InternalAPIKey,
	}

	data, _ := json.Marshal(editReq)

	httpResp, err := http.Post(
		h.cfg.MLAudioServiceURL+"/create-short",
		"application/json",
		bytes.NewReader(data),
	)
	if err != nil {
		return fmt.Errorf("call edit service: %w", err)
	}
	defer httpResp.Body.Close()

	if httpResp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(httpResp.Body)
		return fmt.Errorf("edit service returned %d: %s", httpResp.StatusCode, body)
	}

	log.Info().Msg("export job submitted to edit service")
	return nil
}

func styleFromEditSettings(s models.EditSettings) string {
	switch s.BackgroundStyle {
	case "dark_gradient":
		return "bold"
	case "original":
		return "minimal"
	default:
		return "clean"
	}
}

func hookPrompt(transcriptText string) string {
	return `You are a viral short-form video strategist.
Given this transcript, write ONE hook line for a YouTube Short.
The hook must create curiosity and stop the scroll.
Return ONLY the hook, no quotes, no explanation.

Transcript: ` + transcriptText
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n]
}

func (h *TaskHandlers) HandleCollectAnalytics(ctx context.Context, t *asynq.Task) error {
	var p CollectAnalyticsPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("decode payload: %w", err)
	}

	log := h.log.With().Str("clipId", p.ClipID).Str("userId", p.UserID).Logger()
	log.Info().Msg("collecting youtube analytics for clip")

	clipID, err := primitive.ObjectIDFromHex(p.ClipID)
	if err != nil {
		return fmt.Errorf("invalid clipId: %w", err)
	}
	userID, err := primitive.ObjectIDFromHex(p.UserID)
	if err != nil {
		return fmt.Errorf("invalid userId: %w", err)
	}

	user, err := h.userRepo.FindByID(ctx, p.UserID)
	if err != nil || user == nil {
		return fmt.Errorf("find user: %w", err)
	}

	clip, err := h.clipRepo.FindByID(ctx, clipID)
	if err != nil {
		return fmt.Errorf("find clip: %w", err)
	}

	video, err := h.videoRepo.FindByID(ctx, clip.VideoID)
	if err != nil {
		return fmt.Errorf("find video: %w", err)
	}

	ytClient, err := youtube.NewAnalyticsClient(ctx, user.AccessToken)
	if err != nil {
		return fmt.Errorf("create analytics client: %w", err)
	}

	metrics, err := ytClient.FetchClipMetrics(ctx, video.YouTubeVideoID, user.ChannelID, video.PublishedAt)
	if err != nil {
		log.Warn().Err(err).Msg("analytics fetch failed — storing zero values")
		metrics = &youtube.ClipMetrics{}
	}

	band := scoring.PerformanceBand(metrics.Views)

	if err := h.fmRepo.UpdatePerformanceLabels(ctx, clipID, metrics.Views, metrics.CTR, metrics.AvgWatchTime, band); err != nil {
		return fmt.Errorf("update performance labels: %w", err)
	}

	if err := h.clipRepo.UpdateFields(ctx, clipID, map[string]any{
		"performanceData": models.PerformanceData{
			Views48h:        metrics.Views,
			CTR48h:          metrics.CTR,
			AvgWatchTimeSec: metrics.AvgWatchTime,
			CollectedAt:     time.Now(),
		},
	}); err != nil {
		log.Warn().Err(err).Msg("update clip performance data failed — non-fatal")
	}

	labeled, err := h.fmRepo.CountLabeledForUser(ctx, userID)
	if err != nil {
		log.Warn().Err(err).Msg("count labeled failed — skipping retrain check")
		return nil
	}

	log.Info().Int64("views", metrics.Views).Int64("labeledRows", labeled).Msg("analytics collected")

	if labeled >= 10 {
		task, err := NewRetrainCPEPTask(p.UserID)
		if err == nil {
			if err := h.queue.Enqueue(task); err != nil {
				log.Warn().Err(err).Msg("enqueue retrain failed — non-fatal")
			} else {
				log.Info().Msg("cpep retraining job enqueued")
			}
		}
	}

	return nil
}

func (h *TaskHandlers) HandleRetrainCPEP(ctx context.Context, t *asynq.Task) error {
	var p RetrainCPEPPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("decode payload: %w", err)
	}

	log := h.log.With().Str("userId", p.UserID).Logger()
	log.Info().Msg("cpep retraining job started")

	result, err := h.mlClient.TrainCPEP(ctx, ml.TrainCPEPRequest{UserID: p.UserID})
	if err != nil {
		return fmt.Errorf("train cpep: %w", err)
	}

	log.Info().
		Str("modelVersion", result.ModelVersion).
		Float64("pearsonR", result.PearsonR).
		Float64("rmse", result.RMSE).
		Float64("r2", result.R2).
		Msg("cpep model retrained")

	return nil
}

func (h *TaskHandlers) enqueueRetrainTask(ctx context.Context, task *asynq.Task) error {
	_ = ctx
	return nil
}
