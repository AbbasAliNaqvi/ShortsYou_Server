package handler

import (
	"time"
	"fmt"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/models"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/repository"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/response"
)

type InternalHandler struct {
	clipRepo    *repository.ClipRepository
	videoRepo   *repository.VideoRepository
	fmRepo      *repository.FeatureMatrixRepository 
	dnaRepo     *repository.CreatorDNARepository
	personaRepo *repository.PersonaRepository
	trendRepo   *repository.TrendForecastRepository
}

func NewInternalHandler(
	clipRepo *repository.ClipRepository,
	videoRepo *repository.VideoRepository,
	fmRepo *repository.FeatureMatrixRepository,
	dnaRepo *repository.CreatorDNARepository,
	personaRepo *repository.PersonaRepository,
	trendRepo *repository.TrendForecastRepository,
) *InternalHandler {
	return &InternalHandler{
		clipRepo:    clipRepo,
		videoRepo:   videoRepo,
		fmRepo:      fmRepo,
		dnaRepo:     dnaRepo,
		personaRepo: personaRepo,
		trendRepo:   trendRepo,
	}
}

type transcriptionDoneRequest struct {
	VideoID     string                   `json:"videoId"     binding:"required"`
	UserID      string                   `json:"userId"`
	Segments    []models.TranscriptSegment `json:"segments"`
	FillerWords []models.FillerWord      `json:"fillerWords"`
	SilenceGaps []models.SilenceGap      `json:"silenceGaps"`
	Language    string                   `json:"language"`
	Error       string                   `json:"error"`
}


type shortDoneRequest struct {
	JobID         string  `json:"job_id"`
	ClipID        string  `json:"clipId"`
	OutputURL     string  `json:"outputUrl"`
	ThumbnailURL  string  `json:"thumbnailUrl"`
	Duration      float64 `json:"duration"`
	FileSizeBytes int64   `json:"fileSizeBytes"`
	Resolution    string  `json:"resolution"`
	StyleApplied  string  `json:"styleApplied"`
	Error         string  `json:"error"`
}

// POST /api/internal/short/done
func (h *InternalHandler) ShortDone(c *gin.Context) {
	var req shortDoneRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body: "+err.Error())
		return
	}

	if req.ClipID == "" {
		response.BadRequest(c, "clipId is required")
		return
	}

	id, err := primitive.ObjectIDFromHex(req.ClipID)
	if err != nil {
		response.BadRequest(c, "invalid clip id")
		return
	}

	clip, err := h.clipRepo.FindByID(
		c.Request.Context(),
		id,
	)
	if err != nil {
		response.NotFound(c, "clip")
		return
	}

	// Ignore duplicate callbacks after successful completion.
	if clip.Status == models.ClipStatusExported &&
		req.Error == "" {
		response.OK(c, gin.H{
			"clipId": req.ClipID,
			"status": "exported",
		})
		return
	}

	// ---------------------------------------------------------
	// FAILURE CALLBACK
	// ---------------------------------------------------------

	if req.Error != "" {
		now := time.Now()

		err := h.clipRepo.UpdateFields(
			c.Request.Context(),
			id,
			map[string]any{
				"status":    models.ClipStatusFailed,
				"errorLog":  req.Error,
				"updatedAt": now,
			},
		)
		if err != nil {
			response.InternalError(c)
			return
		}

		response.OK(c, gin.H{
			"clipId": req.ClipID,
			"status": "failed",
			"error":  req.Error,
		})

		return
	}

	// ---------------------------------------------------------
	// SUCCESS CALLBACK
	// ---------------------------------------------------------

	if req.OutputURL == "" {
		response.BadRequest(
			c,
			"outputUrl is required for successful callback",
		)
		return
	}

	now := time.Now()

	fields := map[string]any{
		"supabaseShortUrl": req.OutputURL,
		"status":           models.ClipStatusExported,
		"exportedAt":       now,
		"updatedAt":        now,
	}

	if req.ThumbnailURL != "" {
		fields["selectedThumbnail"] = req.ThumbnailURL
	}

	if req.Duration > 0 {
		fields["durationSeconds"] = req.Duration
	}

	if err := h.clipRepo.UpdateFields(
		c.Request.Context(),
		id,
		fields,
	); err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{
		"clipId":    req.ClipID,
		"status":    "exported",
		"outputUrl": req.OutputURL,
	})
}

type cpepDoneRequest struct {
	UserID             string                     `json:"userId" binding:"required"`
	ModelVersion       string                     `json:"modelVersion" binding:"required"`
	PearsonR           float64                    `json:"pearsonR"`
	RMSE               float64                    `json:"rmse"`
	R2                 float64                    `json:"r2"`
	NSamples           int64                      `json:"nSamples"`
	FeatureImportances []models.FeatureImportance `json:"featureImportances"`
}

// POST /api/internal/cpep/done
func (h *InternalHandler) CPEPDone(c *gin.Context) {
	var req cpepDoneRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	userID, err := primitive.ObjectIDFromHex(req.UserID)
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	point := models.ModelAccuracyPoint{
		NSamples:  req.NSamples,
		PearsonR:  req.PearsonR,
		RMSE:      req.RMSE,
		R2:        req.R2,
		TrainedAt: time.Now(),
	}

	if err := h.dnaRepo.AppendModelAccuracy(
		c.Request.Context(),
		userID,
		point,
	); err != nil {
		response.InternalError(c)
		return
	}

	if len(req.FeatureImportances) > 0 {
		if err := h.dnaRepo.UpdateFeatureImportances(
			c.Request.Context(),
			userID,
			req.FeatureImportances,
		); err != nil {
			response.InternalError(c)
			return
		}
	}

	response.OK(c, gin.H{
		"userId":       req.UserID,
		"modelVersion": req.ModelVersion,
		"pearsonR":     req.PearsonR,
	})
}

// POST /api/internal/dna/done
func (h *InternalHandler) DNADone(c *gin.Context) {
	var dna models.CreatorDNA

	if err := c.ShouldBindJSON(&dna); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	if err := h.dnaRepo.Upsert(
		c.Request.Context(),
		dna,
	); err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{
		"userId": dna.UserID.Hex(),
		"status": "dna stored",
	})
}

// POST /api/internal/personas/done
func (h *InternalHandler) PersonasDone(c *gin.Context) {
	var persona models.AudiencePersona

	if err := c.ShouldBindJSON(&persona); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	if err := h.personaRepo.Upsert(
		c.Request.Context(),
		persona,
	); err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{
		"userId":   persona.UserID.Hex(),
		"personas": len(persona.Personas),
	})
}

// POST /api/internal/forecast/done
func (h *InternalHandler) ForecastDone(c *gin.Context) {
	var forecast models.TrendForecast

	if err := c.ShouldBindJSON(&forecast); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	if err := h.trendRepo.Upsert(
		c.Request.Context(),
		forecast,
	); err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{
		"userId": forecast.UserID.Hex(),
		"topic":  forecast.Topic,
	})
}

func (h *InternalHandler) TranscriptionDone(c *gin.Context) {
	var req transcriptionDoneRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid body: "+err.Error())
		return
	}

	videoID, err := primitive.ObjectIDFromHex(req.VideoID)
	if err != nil {
		response.BadRequest(c, "invalid video id: "+err.Error())
		return
	}

	// Handle ML transcription failure.
	if req.Error != "" {
		err := h.videoRepo.UpdateFields(
			c.Request.Context(),
			videoID,
			map[string]any{
				"processingStatus": "failed",
				"errorLog":         req.Error,
			},
		)
		if err != nil {
			fmt.Printf("TRANSCRIPTION ERROR UPDATE FAILED: %v\n", err)
			response.InternalError(c)
			return
		}

		response.OK(c, gin.H{
			"status": "error recorded",
		})
		return
	}

	// Store transcription status.
	err = h.videoRepo.UpdateFields(
		c.Request.Context(),
		videoID,
		map[string]any{
			"processingStatus": "analyzing",
		},
	)
	if err != nil {
		fmt.Printf("TRANSCRIPTION UPDATE FAILED: %v\n", err)
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{
		"status":   "received",
		"videoId":  req.VideoID,
		"segments": len(req.Segments),
	})
}




type analysisDoneRequest struct {
	VideoID           string                 `json:"videoId"           binding:"required"`
	UserID            string                 `json:"userId"`
	Segments          []AnalyzedSegmentResult `json:"segments"`
	TopicDistribution []TopicWeight          `json:"topicDistribution"`
	Error             string                 `json:"error"`
}

type AnalyzedSegmentResult struct {
	Index          int      `json:"index"`
	SemanticScore  float64  `json:"semanticScore"`
	NoveltyScore   float64  `json:"noveltyScore"`
	ClarityScore   float64  `json:"clarityScore"`
	HookScore      float64  `json:"hookScore"`
	SemanticLabels []string `json:"semanticLabels"`
	SuggestedHook  string   `json:"suggestedHook"`
}

type TopicWeight struct {
	Topic  string  `json:"topic"`
	Weight float64 `json:"weight"`
}

// POST /api/internal/analysis/done
func (h *InternalHandler) AnalysisDone(c *gin.Context) {
	var req analysisDoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid body")
		return
	}

	// scoring + clip creation goes here
	// For now confirm receipt
	response.OK(c, gin.H{
		"status":   "received",
		"segments": len(req.Segments),
	})
}