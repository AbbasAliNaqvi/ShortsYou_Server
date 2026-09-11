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
	cfg        *config.Config
	videoRepo  *repository.VideoRepository
	clipRepo   *repository.ClipRepository
	fmRepo     *repository.FeatureMatrixRepository
	userRepo   *repository.UserRepository
	jobRepo    *repository.JobRepository
	mlClient   ml.Service
	storage    *storage.SupabaseClient
	llmRotator *llm.Rotator
	queue      *Client
}

func NewTaskHandlers(
	log zerolog.Logger,
	videoRepo *repository.VideoRepository,
	clipRepo *repository.ClipRepository,
	fmRepo *repository.FeatureMatrixRepository,
	userRepo *repository.UserRepository,
	jobRepo *repository.JobRepository,
	mlClient ml.Service,
	supabase *storage.SupabaseClient,
	llmRotator *llm.Rotator,
	queue *Client,
	cfg *config.Config,
) *TaskHandlers {
	return &TaskHandlers{
		log:        log,
		cfg:        cfg,
		videoRepo:  videoRepo,
		clipRepo:   clipRepo,
		fmRepo:     fmRepo,
		userRepo:   userRepo,
		jobRepo:    jobRepo,
		mlClient:   mlClient,
		storage:    supabase,
		llmRotator: llmRotator,
		queue:      queue,
	}
}

// HandleProcessVideo is the full AI pipeline for a single video.
func (h *TaskHandlers) HandleProcessVideo(ctx context.Context, t *asynq.Task) error {
	var p ProcessVideoPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("decode payload: %w", err)
	}

	videoID, err := primitive.ObjectIDFromHex(p.VideoID)
	if err != nil {
		return fmt.Errorf("invalid videoId: %w", err)
	}

	log := h.log.With().Str("videoId", p.VideoID).Str("userId", p.UserID).Logger()

	video, err := h.videoRepo.FindByID(ctx, videoID)
	if err != nil {
		return fmt.Errorf("find video: %w", err)
	}

	fail := func(stage string, err error) error {
		log.Error().Err(err).Str("stage", stage).Msg("processing failed")
		_ = h.videoRepo.UpdateStatus(ctx, videoID, models.StatusFailed, err.Error())
		return fmt.Errorf("%s: %w", stage, err)
	}

	// Stage 1 — Download and upload to Supabase
	log.Info().Msg("downloading video")
	_ = h.videoRepo.UpdateStatus(ctx, videoID, models.StatusDownloading, "")

	dl, err := downloader.Download(ctx, video.YouTubeVideoID)
	if err != nil {
		return fail("download", err)
	}
	defer dl.Cleanup()

	videoData, err := os.ReadFile(dl.FilePath)
	if err != nil {
		return fail("read file", err)
	}

	videoKey := downloader.VideoKey(p.UserID, p.VideoID)
	videoURL, err := h.storage.Upload(ctx, "raw-videos", videoKey, "video/mp4", videoData)
	if err != nil {
		return fail("upload", err)
	}
	log.Info().Str("url", videoURL).Msg("video uploaded")

	// Stage 2 — Fire async transcription
	// Results come back via /api/internal/transcription/done
	log.Info().Msg("requesting transcription from ML service")
	_ = h.videoRepo.UpdateStatus(ctx, videoID, models.StatusTranscribing, "")

	_, err = h.mlClient.Transcribe(ctx, ml.TranscribeRequest{
		VideoID:  p.VideoID,
		AudioURL: videoURL,
	})
	if err != nil {
		return fail("transcribe", err)
	}

	// Job hands off here — Mayank's service will callback when transcription is done
	log.Info().Msg("transcription job accepted — waiting for callback")
	return nil
}

// Generates an AI hook via Groq then calls the Python edit service.
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
		log.Error().Err(err).Msg("invalid clip ID")
		return fmt.Errorf("invalid clipId: %w", err)
	}

	clip, err := h.clipRepo.FindByID(ctx, clipID)
	if err != nil {
		log.Error().Err(err).Msg("failed to find clip")
		return fmt.Errorf("find clip: %w", err)
	}

	log.Info().Msg("clip found")

	video, err := h.videoRepo.FindByID(ctx, clip.VideoID)
	if err != nil {
		log.Error().Err(err).Msg("failed to find video")
		return fmt.Errorf("find video: %w", err)
	}

	log.Info().
		Str("videoId", video.ID.Hex()).
		Msg("video found")

	// Generate a fresh AI hook if the selected hook is still the original transcript.
	hookText := clip.SelectedHook
	if hookText == "" || hookText == clip.OriginalHook {
		log.Info().Msg("generating ai hook via llm rotator")

		generated, err := h.llmRotator.Call(ctx, hookPrompt(clip.TranscriptText))
		if err == nil && generated != "" {
			hookText = generated

			_ = h.clipRepo.UpdateFields(ctx, clipID, map[string]any{
				"selectedHook": hookText,
				"updatedAt":    time.Now(),
			})

			log.Info().
				Str("hook", truncate(hookText, 80)).
				Msg("ai hook generated")
		} else {
			log.Warn().
				Err(err).
				Msg("hook generation failed — using original")
		}
	}

	// Get a signed URL so the Python service can download the raw video.
	videoKey := downloader.VideoKey(p.UserID, video.ID.Hex())

	log.Info().
		Str("videoKey", videoKey).
		Msg("generating signed video URL")

	videoURL, err := h.storage.SignedURL(ctx, "raw-videos", videoKey, 3600)
	if err != nil {
		log.Error().
			Err(err).
			Str("videoKey", videoKey).
			Msg("failed to generate signed video URL")

		return fmt.Errorf("get signed url: %w", err)
	}

	log.Info().Msg("signed video URL generated")

	style := styleFromEditSettings(clip.EditSettings)
	callbackURL := h.cfg.BaseURL + "/api/internal/short/done"

	editReq := map[string]any{
		"job_id":          p.ClipID,
		"clip_id":         p.ClipID,
		"user_id":         p.UserID,
		"video_url":       videoURL,
		"start_time":      clip.StartTime,
		"end_time":        clip.EndTime,
		"style":           style,
		"hook_text":       hookText,
		"music_mood":      moodFromSettings(clip.EditSettings),
		"remove_silences": clip.EditSettings.RemoveSilences,
		"remove_fillers":  clip.EditSettings.RemoveFillers,
		"callback_url":    callbackURL,
		"callback_key":    h.cfg.InternalAPIKey,
		"layout":          layoutFromSettings(clip.EditSettings),
		"emotion_type":    clip.EmotionType,
	}

	data, err := json.Marshal(editReq)
	if err != nil {
		log.Error().Err(err).Msg("failed to marshal edit request")
		return fmt.Errorf("marshal edit request: %w", err)
	}

	editURL := h.cfg.MLAudioServiceURL + "/create-short"

	log.Info().
		Str("url", editURL).
		Msg("calling edit service")

	httpResp, err := http.Post(
		editURL,
		"application/json",
		bytes.NewReader(data),
	)
	if err != nil {
		log.Error().
			Err(err).
			Str("url", editURL).
			Msg("call edit service failed")

		return fmt.Errorf("call edit service: %w", err)
	}

	defer httpResp.Body.Close()

	body, _ := io.ReadAll(httpResp.Body)

	if httpResp.StatusCode != http.StatusOK {
		log.Error().
			Int("status", httpResp.StatusCode).
			Str("body", string(body)).
			Msg("edit service returned error")

		return fmt.Errorf(
			"edit service returned %d: %s",
			httpResp.StatusCode,
			body,
		)
	}

	log.Info().
		Int("status", httpResp.StatusCode).
		Str("style", style).
		Str("hook", truncate(hookText, 60)).
		Msg("export job submitted to edit service")

	return nil
}

// HandleCollectAnalytics fires 48 hours after a clip is published.
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

	log.Info().
		Int64("views", metrics.Views).
		Int64("labeledRows", labeled).
		Msg("analytics collected")

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

// HandleRetrainCPEP calls the ML audio service to retrain the XGBoost model.
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
		Msg("cpep model retrained successfully")

	return nil
}

func hookPrompt(transcriptText string) string {
	return `You are a viral short-form video strategist.
Write ONE hook line for a YouTube Short based on this transcript.
Rules:
- Under 12 words
- Creates curiosity or delivers a strong statement
- No quotes, no explanation, just the hook
- Make it feel human, not AI-generated

Transcript: ` + truncate(transcriptText, 400)
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

func moodFromSettings(s models.EditSettings) string {
	if s.MusicMood != "" {
		return s.MusicMood
	}
	return "energetic"
}

func clampSegments(segments []scoring.SegmentScore, maxDuration float64) []scoring.SegmentScore {
	clamped := make([]scoring.SegmentScore, 0, len(segments))
	for _, s := range segments {
		if s.Start >= maxDuration {
			continue
		}
		if s.End > maxDuration {
			s.End = maxDuration
		}
		if s.End-s.Start < 1.0 {
			continue
		}
		clamped = append(clamped, s)
	}
	return clamped
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n]
}

func layoutFromSettings(s models.EditSettings) string {
	if s.BackgroundStyle == "two_frame" {
		return "two_frame"
	}
	return "standard"
}
