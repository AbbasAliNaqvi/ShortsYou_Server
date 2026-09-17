package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/config"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/llm"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/models"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/repository"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/scoring"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/response"
	"github.com/rs/zerolog"
)

type InternalHandler struct {
	clipRepo       *repository.ClipRepository
	videoRepo      *repository.VideoRepository
	fmRepo         *repository.FeatureMatrixRepository
	dnaRepo        *repository.CreatorDNARepository
	personaRepo    *repository.PersonaRepository
	trendRepo      *repository.TrendForecastRepository
	transcriptRepo *repository.TranscriptRepository
	jobRepo        *repository.JobRepository
	llmRotator     *llm.Rotator
	cfg            *config.Config
	log            zerolog.Logger
}

func NewInternalHandler(
	clipRepo *repository.ClipRepository,
	videoRepo *repository.VideoRepository,
	fmRepo *repository.FeatureMatrixRepository,
	dnaRepo *repository.CreatorDNARepository,
	personaRepo *repository.PersonaRepository,
	trendRepo *repository.TrendForecastRepository,
	transcriptRepo *repository.TranscriptRepository,
	jobRepo *repository.JobRepository,
	llmRotator *llm.Rotator,
	cfg *config.Config,
	log zerolog.Logger,
) *InternalHandler {
	return &InternalHandler{
		clipRepo:       clipRepo,
		videoRepo:      videoRepo,
		fmRepo:         fmRepo,
		dnaRepo:        dnaRepo,
		personaRepo:    personaRepo,
		trendRepo:      trendRepo,
		transcriptRepo: transcriptRepo,
		jobRepo:        jobRepo,
		llmRotator:     llmRotator,
		cfg:            cfg,
		log:            log,
	}
}

// ── Transcription Done ────────────────────────────────────────────────────────

type transcriptionDoneRequest struct {
	VideoID     string                        `json:"videoId"     binding:"required"`
	UserID      string                        `json:"userId"`
	Segments    []repository.StoredSegment    `json:"segments"`
	FillerWords []repository.StoredFillerWord `json:"fillerWords"`
	SilenceGaps []repository.StoredSilenceGap `json:"silenceGaps"`
	Language    string                        `json:"language"`
	Error       string                        `json:"error"`
}

// TranscriptionDone receives Whisper results from Mayank.
// Stores segments then fires async /analyze call.
// POST /api/internal/transcription/done
func (h *InternalHandler) TranscriptionDone(c *gin.Context) {
	var req transcriptionDoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid body: "+err.Error())
		return
	}

	log := h.log.With().Str("videoId", req.VideoID).Logger()

	if req.Error != "" {
		log.Error().Str("error", req.Error).Msg("transcription failed — marking video as failed")
		videoID, _ := primitive.ObjectIDFromHex(req.VideoID)
		_ = h.videoRepo.UpdateFields(c.Request.Context(), videoID, map[string]any{
			"processingStatus": "failed",
			"errorLog":         req.Error,
			"updatedAt":        time.Now(),
		})
		_ = h.jobRepo.UpdateByVideoID(c.Request.Context(), req.VideoID, models.JobStatusFailed, "transcription_failed", 1, 0, req.Error)
		response.OK(c, gin.H{"status": "error recorded"})
		return
	}

	if len(req.Segments) == 0 {
		log.Warn().Msg("transcription returned 0 segments — marking completed with no clips")
		videoID, _ := primitive.ObjectIDFromHex(req.VideoID)
		_ = h.videoRepo.UpdateFields(c.Request.Context(), videoID, map[string]any{
			"processingStatus": "completed",
			"clipsDetected":    0,
			"updatedAt":        time.Now(),
		})
		_ = h.jobRepo.UpdateByVideoID(c.Request.Context(), req.VideoID, models.JobStatusCompleted, "completed", 1, 0, "")
		response.OK(c, gin.H{"status": "completed", "clips": 0})
		return
	}

	// Store transcript for later use in analysis callback
	if err := h.transcriptRepo.Save(c.Request.Context(), repository.StoredTranscript{
		VideoID:     req.VideoID,
		UserID:      req.UserID,
		Segments:    req.Segments,
		FillerWords: req.FillerWords,
		SilenceGaps: req.SilenceGaps,
		Language:    req.Language,
	}); err != nil {
		log.Error().Err(err).Msg("failed to store transcript")
		response.InternalError(c)
		return
	}

	log.Info().Int("segments", len(req.Segments)).Msg("transcript stored — firing analyze")

	// Update video status to analyzing
	videoID, _ := primitive.ObjectIDFromHex(req.VideoID)
	_ = h.videoRepo.UpdateFields(c.Request.Context(), videoID, map[string]any{
		"processingStatus": "analyzing",
		"updatedAt":        time.Now(),
	})
	_ = h.jobRepo.UpdateByVideoID(c.Request.Context(), req.VideoID, models.JobStatusAnalyzing, "analyzing", 0.6, 0, "")

	// Fire async /analyze call — do not block the response
	go h.fireAnalyze(req.VideoID, req.UserID, req.Language, req.Segments, req.FillerWords, req.SilenceGaps)

	response.OK(c, gin.H{
		"status":   "received",
		"videoId":  req.VideoID,
		"segments": len(req.Segments),
	})
}

// GetTranscript exposes the completed transcript to its owner. The external
// transcription service is never contacted from the browser; the browser only
// reads the copy persisted after a verified internal callback.
func (h *InternalHandler) GetTranscript(c *gin.Context) {
	videoID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid video id")
		return
	}
	userIDValue, ok := c.Get("userID")
	if !ok {
		response.Unauthorized(c)
		return
	}
	userIDString, ok := userIDValue.(string)
	if !ok {
		response.Unauthorized(c)
		return
	}
	userID, err := primitive.ObjectIDFromHex(userIDString)
	if err != nil {
		response.Unauthorized(c)
		return
	}
	video, err := h.videoRepo.FindByID(c.Request.Context(), videoID)
	if err != nil || video == nil || video.UserID != userID {
		response.NotFound(c, "video")
		return
	}
	transcript, err := h.transcriptRepo.FindByVideoID(c.Request.Context(), videoID.Hex())
	if err != nil {
		h.log.Error().Err(err).Str("videoId", videoID.Hex()).Msg("failed to load transcript")
		response.InternalError(c)
		return
	}
	if transcript == nil {
		response.NotFound(c, "transcript")
		return
	}
	response.OK(c, transcript)
}

// fireAnalyze calls Mayank's /analyze endpoint in a goroutine.
func (h *InternalHandler) fireAnalyze(
	videoID, userID, language string,
	segments []repository.StoredSegment,
	fillerWords []repository.StoredFillerWord,
	silenceGaps []repository.StoredSilenceGap,
) {
	type analyzeSegment struct {
		Index int                     `json:"index"`
		Start float64                 `json:"start"`
		End   float64                 `json:"end"`
		Text  string                  `json:"text"`
		Words []repository.StoredWord `json:"words"`
	}

	segs := make([]analyzeSegment, len(segments))
	for i, s := range segments {
		segs[i] = analyzeSegment{
			Index: s.Index,
			Start: s.Start,
			End:   s.End,
			Text:  s.Text,
			Words: s.Words,
		}
	}

	body := map[string]any{
		"job_id":      videoID,
		"video_id":    videoID,
		"user_id":     userID,
		"language":    language,
		"segments":    segs,
		"fillerWords": fillerWords,
		"silenceGaps": silenceGaps,
		"callbackUrl": h.cfg.BaseURL + "/api/internal/analysis/done",
		"internalKey": h.cfg.InternalAPIKey,
	}

	data, err := json.Marshal(body)
	if err != nil {
		h.log.Error().Err(err).Str("videoId", videoID).Msg("failed to encode analyze request")
		h.markAnalysisSubmissionFailed(videoID, err)
		return
	}

	// The NLP endpoint accepts work asynchronously, but can still take more
	// than 30 seconds to send response headers under load.
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		h.cfg.MLNLPServiceURL+"/analyze",
		bytes.NewReader(data),
	)
	if err != nil {
		h.log.Error().Err(err).Str("videoId", videoID).Msg("failed to build analyze request")
		h.markAnalysisSubmissionFailed(videoID, err)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+h.cfg.MLAPIKey)

	client := &http.Client{Timeout: 2 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		h.log.Error().Err(err).Str("videoId", videoID).Msg("analyze call failed")
		h.markAnalysisSubmissionFailed(videoID, err)
		return
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	logEvent := h.log.Info()
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		logEvent = h.log.Error()
	}
	logEvent.
		Str("videoId", videoID).
		Int("status", resp.StatusCode).
		Int("responseBytes", len(raw)).
		Msg("analyze fired")
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		h.markAnalysisSubmissionFailed(videoID, fmt.Errorf("analysis service returned HTTP %d", resp.StatusCode))
	}
}

// markAnalysisSubmissionFailed prevents a failed handoff from leaving a video
// permanently in "analyzing". The user can then retry generation from the UI.
func (h *InternalHandler) markAnalysisSubmissionFailed(videoID string, cause error) {
	if id, err := primitive.ObjectIDFromHex(videoID); err == nil {
		_ = h.videoRepo.UpdateFields(context.Background(), id, map[string]any{
			"processingStatus": models.StatusFailed,
			"errorLog":         "analysis submission failed: " + cause.Error(),
			"updatedAt":        time.Now(),
		})
	}
	_ = h.jobRepo.UpdateByVideoID(context.Background(), videoID, models.JobStatusFailed, "analysis_submission_failed", 1, 0, cause.Error())
}

// ── Analysis Done ─────────────────────────────────────────────────────────────

type analysisSegmentResult struct {
	Index          int      `json:"index"`
	SemanticScore  float64  `json:"semanticScore"`
	NoveltyScore   float64  `json:"noveltyScore"`
	ClarityScore   float64  `json:"clarityScore"`
	HookScore      float64  `json:"hookScore"`
	SemanticLabels []string `json:"semanticLabels"`
	SuggestedHook  string   `json:"suggestedHook"`
}

type topicWeight struct {
	Topic  string  `json:"topic"`
	Label  string  `json:"label"`
	Weight float64 `json:"weight"`
}

type analysisDoneRequest struct {
	VideoID           string                  `json:"videoId"           binding:"required"`
	UserID            string                  `json:"userId"`
	Segments          []analysisSegmentResult `json:"segments"`
	TopicDistribution []topicWeight           `json:"topicDistribution"`
	Error             string                  `json:"error"`
}

// AnalysisDone receives NLP scores from Mayank.
// Combines with stored transcript, scores every segment, creates clips.
// POST /api/internal/analysis/done
func (h *InternalHandler) AnalysisDone(c *gin.Context) {
	var req analysisDoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid body: "+err.Error())
		return
	}

	log := h.log.With().Str("videoId", req.VideoID).Logger()

	videoID, err := primitive.ObjectIDFromHex(req.VideoID)
	if err != nil {
		response.BadRequest(c, "invalid videoId")
		return
	}

	if req.Error != "" {
		log.Error().Str("error", req.Error).Msg("analysis failed")
		_ = h.videoRepo.UpdateFields(c.Request.Context(), videoID, map[string]any{
			"processingStatus": "failed",
			"errorLog":         req.Error,
			"updatedAt":        time.Now(),
		})
		_ = h.jobRepo.UpdateByVideoID(c.Request.Context(), req.VideoID, models.JobStatusFailed, "analysis_failed", 1, 0, req.Error)
		response.OK(c, gin.H{"status": "error recorded"})
		return
	}

	// Load stored transcript
	stored, err := h.transcriptRepo.FindByVideoID(c.Request.Context(), req.VideoID)
	if err != nil || stored == nil {
		log.Error().Err(err).Msg("transcript not found for this video")
		response.OK(c, gin.H{"status": "error", "reason": "transcript not found"})
		return
	}

	// Build score lookup map by segment index
	type segScore struct {
		SemanticScore  float64
		NoveltyScore   float64
		ClarityScore   float64
		HookScore      float64
		SemanticLabels []string
		SuggestedHook  string
	}
	scoreMap := make(map[int]segScore, len(req.Segments))
	for _, s := range req.Segments {
		scoreMap[s.Index] = segScore{
			SemanticScore:  s.SemanticScore,
			NoveltyScore:   s.NoveltyScore,
			ClarityScore:   s.ClarityScore,
			HookScore:      s.HookScore,
			SemanticLabels: s.SemanticLabels,
			SuggestedHook:  s.SuggestedHook,
		}
	}

	var videoDuration float64 = 3600 // 1 hour default = effectively no clamping

	video, videoErr := h.videoRepo.FindByID(c.Request.Context(), videoID)
	if videoErr != nil || video == nil {
		log.Warn().Str("videoId", req.VideoID).Msg("video not in mongodb — creating clips without duration clamping")
	} else if video.DurationSeconds > 0 {
		videoDuration = float64(video.DurationSeconds)
	}

	userID, _ := primitive.ObjectIDFromHex(req.UserID)

	// Score every segment
	const clipThreshold = 0.65

	type scoredSegment struct {
		Index          int
		Start, End     float64
		Text           string
		ViralScore     float64
		EmotionType    string
		SemanticLabels []string
		HookScore      float64
		SuggestedHook  string
		NlpScores      segScore
	}

	var candidates []scoredSegment

	for _, seg := range stored.Segments {
		nlp := scoreMap[seg.Index]

		// Clamp timestamps to actual video duration
		end := seg.End
		if float64(videoDuration) > 0 && end > float64(videoDuration) {
			end = float64(videoDuration)
		}
		if seg.Start >= float64(videoDuration) {
			continue
		}
		if end-seg.Start < 1.0 {
			continue
		}

		// Viral score formula — emotion defaults to 0.7 until /emotion is integrated
		emotionDefault := 0.70
		viralScore := 0.25*emotionDefault +
			0.30*nlp.SemanticScore +
			0.20*nlp.HookScore +
			0.15*nlp.ClarityScore +
			0.10*nlp.NoveltyScore

		// Round to 4 decimal places
		viralScore = float64(int(viralScore*10000)) / 10000

		if viralScore < clipThreshold {
			continue
		}

		candidates = append(candidates, scoredSegment{
			Index:          seg.Index,
			Start:          seg.Start,
			End:            end,
			Text:           seg.Text,
			ViralScore:     viralScore,
			EmotionType:    "excited",
			SemanticLabels: nlp.SemanticLabels,
			HookScore:      nlp.HookScore,
			SuggestedHook:  nlp.SuggestedHook,
			NlpScores:      nlp,
		})
	}

	log.Info().
		Int("total", len(stored.Segments)).
		Int("candidates", len(candidates)).
		Msg("scoring complete")

	if len(candidates) == 0 {
		_ = h.videoRepo.UpdateFields(c.Request.Context(), videoID, map[string]any{
			"processingStatus": "completed",
			"clipsDetected":    0,
			"updatedAt":        time.Now(),
		})
		_ = h.jobRepo.UpdateByVideoID(c.Request.Context(), req.VideoID, models.JobStatusCompleted, "completed", 1, 0, "")
		response.OK(c, gin.H{"status": "completed", "clips": 0})
		return
	}

	// Generate hooks via Groq + create clip documents
	clips := make([]models.Clip, 0, len(candidates))
	fmRows := make([]models.FeatureMatrix, 0, len(candidates))

	for i, cs := range candidates {
		hookText := cs.SuggestedHook

		// If Mayank did not provide a hook, generate via Groq
		if hookText == "" {
			generated, err := h.llmRotator.Call(
				c.Request.Context(),
				fmt.Sprintf(
					"Write ONE viral hook for a YouTube Short under 12 words. "+
						"Create curiosity. No quotes. Transcript: %s",
					cs.Text,
				),
			)
			if err == nil && generated != "" {
				hookText = generated
			} else {
				hookText = truncateStr(cs.Text, 120)
			}
		}

		clipID := primitive.NewObjectID()
		posRatio := 0.0
		if videoDuration > 0 && videoDuration < 3600 {
			posRatio = cs.Start / videoDuration
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
				Emotion:        0.70,
				SemanticImpact: cs.NlpScores.SemanticScore,
				SpeechEmphasis: cs.NlpScores.HookScore,
				Clarity:        cs.NlpScores.ClarityScore,
				Novelty:        cs.NlpScores.NoveltyScore,
			},
			SemanticLabels: cs.SemanticLabels,
			EmotionType:    cs.EmotionType,
			OriginalHook:   truncateStr(cs.Text, 120),
			HookScore:      cs.HookScore,
			SelectedHook:   hookText,
			SuggestedHooks: []models.SuggestedHook{
				{Text: hookText, HookScore: cs.HookScore},
			},
			Status: models.ClipStatusDetected,
		})

		fmRows = append(fmRows, models.FeatureMatrix{
			ID:                  primitive.NewObjectID(),
			ClipID:              clipID,
			VideoID:             videoID,
			UserID:              userID,
			SemanticImpactScore: cs.NlpScores.SemanticScore,
			ClarityScore:        cs.NlpScores.ClarityScore,
			NoveltyScore:        cs.NlpScores.NoveltyScore,
			HookScore:           cs.HookScore,
			DurationSeconds:     cs.End - cs.Start,
			VideoPositionRatio:  posRatio,
		})

		log.Info().
			Int("clip", i+1).
			Float64("viralScore", cs.ViralScore).
			Str("hook", truncateStr(hookText, 60)).
			Msg("clip created")
	}

	if err := h.clipRepo.BulkInsert(c.Request.Context(), clips); err != nil {
		log.Error().Err(err).Msg("failed to insert clips")
		response.InternalError(c)
		return
	}

	if err := h.fmRepo.BulkInsert(c.Request.Context(), fmRows); err != nil {
		log.Warn().Err(err).Msg("failed to insert feature matrix — non-fatal")
	}

	_ = h.videoRepo.UpdateFields(c.Request.Context(), videoID, map[string]any{
		"processingStatus": "completed",
		"clipsDetected":    len(clips),
		"updatedAt":        time.Now(),
	})
	_ = h.jobRepo.UpdateByVideoID(c.Request.Context(), req.VideoID, models.JobStatusCompleted, "completed", 1, len(clips), "")

	log.Info().Int("clips", len(clips)).Msg("video processing completed with real ML data")

	response.OK(c, gin.H{
		"status":  "completed",
		"videoId": req.VideoID,
		"clips":   len(clips),
	})
}

// ── Existing handlers ─────────────────────────────────────────────────────────

type shortDoneRequest struct {
	JobID              string  `json:"job_id"`
	ClipID             string  `json:"clipId"`
	SnakeCaseClipID    string  `json:"clip_id"`
	OutputURL          string  `json:"outputUrl"`
	SnakeCaseOutputURL string  `json:"output_url"`
	ThumbnailURL       string  `json:"thumbnailUrl"`
	SnakeCaseThumbnail string  `json:"thumbnail_url"`
	Duration           float64 `json:"duration"`
	FileSizeBytes      int64   `json:"fileSizeBytes"`
	StyleApplied       string  `json:"styleApplied"`
	Error              string  `json:"error"`
}

func (h *InternalHandler) ShortDone(c *gin.Context) {
	var req shortDoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if req.ClipID == "" {
		req.ClipID = req.SnakeCaseClipID
	}
	if req.OutputURL == "" {
		req.OutputURL = req.SnakeCaseOutputURL
	}
	if req.ThumbnailURL == "" {
		req.ThumbnailURL = req.SnakeCaseThumbnail
	}
	if req.ClipID == "" {
		response.BadRequest(c, "clipId or clip_id is required")
		return
	}

	id, err := primitive.ObjectIDFromHex(req.ClipID)
	if err != nil {
		response.BadRequest(c, "invalid clip id")
		return
	}

	if req.Error != "" {
		if err := h.clipRepo.UpdateFields(c.Request.Context(), id, map[string]any{
			"status":    string(models.ClipStatusFailed),
			"errorLog":  req.Error,
			"updatedAt": time.Now(),
		}); err != nil {
			response.InternalError(c)
			return
		}
		response.OK(c, gin.H{"clipId": req.ClipID, "status": "failed"})
		return
	}

	now := time.Now()
	fields := map[string]any{
		"supabaseShortUrl": req.OutputURL,
		"status":           string(models.ClipStatusExported),
		"exportedAt":       now,
		"updatedAt":        now,
	}
	if req.ThumbnailURL != "" {
		fields["selectedThumbnail"] = req.ThumbnailURL
	}
	if req.Duration > 0 {
		fields["durationSeconds"] = req.Duration
	}

	if err := h.clipRepo.UpdateFields(c.Request.Context(), id, fields); err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{"clipId": req.ClipID, "status": "exported", "outputUrl": req.OutputURL})
}

func (h *InternalHandler) CPEPDone(c *gin.Context) {
	var req struct {
		UserID             string                     `json:"userId"             binding:"required"`
		ModelVersion       string                     `json:"modelVersion"       binding:"required"`
		PearsonR           float64                    `json:"pearsonR"`
		RMSE               float64                    `json:"rmse"`
		R2                 float64                    `json:"r2"`
		NSamples           int64                      `json:"nSamples"`
		FeatureImportances []models.FeatureImportance `json:"featureImportances"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid body")
		return
	}
	userID, _ := primitive.ObjectIDFromHex(req.UserID)
	point := models.ModelAccuracyPoint{
		NSamples: req.NSamples, PearsonR: req.PearsonR,
		RMSE: req.RMSE, R2: req.R2, TrainedAt: time.Now(),
	}
	_ = h.dnaRepo.AppendModelAccuracy(c.Request.Context(), userID, point)
	if len(req.FeatureImportances) > 0 {
		_ = h.dnaRepo.UpdateFeatureImportances(c.Request.Context(), userID, req.FeatureImportances)
	}
	response.OK(c, gin.H{"userId": req.UserID, "modelVersion": req.ModelVersion})
}

func (h *InternalHandler) DNADone(c *gin.Context) {
	var dna models.CreatorDNA
	if err := c.ShouldBindJSON(&dna); err != nil {
		response.BadRequest(c, "invalid body")
		return
	}
	_ = h.dnaRepo.Upsert(c.Request.Context(), dna)
	response.OK(c, gin.H{"userId": dna.UserID.Hex(), "status": "stored"})
}

func (h *InternalHandler) PersonasDone(c *gin.Context) {
	var p models.AudiencePersona
	if err := c.ShouldBindJSON(&p); err != nil {
		response.BadRequest(c, "invalid body")
		return
	}
	_ = h.personaRepo.Upsert(c.Request.Context(), p)
	response.OK(c, gin.H{"userId": p.UserID.Hex(), "personas": len(p.Personas)})
}

func (h *InternalHandler) ForecastDone(c *gin.Context) {
	var f models.TrendForecast
	if err := c.ShouldBindJSON(&f); err != nil {
		response.BadRequest(c, "invalid body")
		return
	}
	_ = h.trendRepo.Upsert(c.Request.Context(), f)
	response.OK(c, gin.H{"userId": f.UserID.Hex(), "topic": f.Topic})
}

func truncateStr(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n]
}

var _ = scoring.PerformanceBand
