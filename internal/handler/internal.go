package handler

import (
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/models"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/repository"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/response"
)

type InternalHandler struct {
	clipRepo  *repository.ClipRepository
	videoRepo *repository.VideoRepository
	fmRepo    *repository.FeatureMatrixRepository
	dnaRepo   *repository.CreatorDNARepository
	personaRepo *repository.PersonaRepository
	trendRepo *repository.TrendForecastRepository
}

func NewInternalHandler(
	clipRepo    *repository.ClipRepository,
	videoRepo   *repository.VideoRepository,
	fmRepo      *repository.FeatureMatrixRepository,
	dnaRepo     *repository.CreatorDNARepository,
	personaRepo *repository.PersonaRepository,
	trendRepo   *repository.TrendForecastRepository,
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

type shortDoneRequest struct {
	ClipID    string  `json:"clipId"    binding:"required"`
	OutputURL string  `json:"outputUrl" binding:"required"`
	Duration  float64 `json:"duration"`
}

func (h *InternalHandler) ShortDone(c *gin.Context) {
	var req shortDoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	id, err := primitive.ObjectIDFromHex(req.ClipID)
	if err != nil {
		response.BadRequest(c, "invalid clip id")
		return
	}

	now := time.Now()
	if err := h.clipRepo.UpdateFields(c.Request.Context(), id, map[string]any{
		"supabaseShortUrl": req.OutputURL,
		"durationSeconds":  req.Duration,
		"status":           models.ClipStatusExported,
		"exportedAt":       now,
		"updatedAt":        now,
	}); err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{"clipId": req.ClipID, "status": "exported"})
}

type cpepDoneRequest struct {
	UserID             string                    `json:"userId"             binding:"required"`
	ModelVersion       string                    `json:"modelVersion"       binding:"required"`
	PearsonR           float64                   `json:"pearsonR"`
	RMSE               float64                   `json:"rmse"`
	R2                 float64                   `json:"r2"`
	NSamples           int64                     `json:"nSamples"`
	FeatureImportances []models.FeatureImportance `json:"featureImportances"`
}

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

	if err := h.dnaRepo.AppendModelAccuracy(c.Request.Context(), userID, point); err != nil {
		response.InternalError(c)
		return
	}

	if len(req.FeatureImportances) > 0 {
		if err := h.dnaRepo.UpdateFeatureImportances(c.Request.Context(), userID, req.FeatureImportances); err != nil {
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

// DNADone receives the full Creator DNA profile from the NLP service after LDA runs.
func (h *InternalHandler) DNADone(c *gin.Context) {
	var dna models.CreatorDNA
	if err := c.ShouldBindJSON(&dna); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	if err := h.dnaRepo.Upsert(c.Request.Context(), dna); err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{"userId": dna.UserID.Hex(), "status": "dna stored"})
}

// PersonasDone receives DBSCAN audience persona clusters from the NLP service.
func (h *InternalHandler) PersonasDone(c *gin.Context) {
	var persona models.AudiencePersona
	if err := c.ShouldBindJSON(&persona); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	if err := h.personaRepo.Upsert(c.Request.Context(), persona); err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{"userId": persona.UserID.Hex(), "personas": len(persona.Personas)})
}

// ForecastDone receives a Prophet time-series forecast from the NLP service.
func (h *InternalHandler) ForecastDone(c *gin.Context) {
	var forecast models.TrendForecast
	if err := c.ShouldBindJSON(&forecast); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	if err := h.trendRepo.Upsert(c.Request.Context(), forecast); err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{"userId": forecast.UserID.Hex(), "topic": forecast.Topic})
}