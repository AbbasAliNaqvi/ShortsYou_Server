package handler

import (
	"net/http"
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
}

func NewInternalHandler(
	clipRepo *repository.ClipRepository,
	videoRepo *repository.VideoRepository,
	fmRepo *repository.FeatureMatrixRepository,
) *InternalHandler {
	return &InternalHandler{clipRepo: clipRepo, videoRepo: videoRepo, fmRepo: fmRepo}
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

	if err := h.clipRepo.UpdateFields(c.Request.Context(), id, map[string]any{
		"supabaseShortUrl": req.OutputURL,
		"durationSeconds":  req.Duration,
		"status":           models.ClipStatusExported,
		"exportedAt":       time.Now(),
		"updatedAt":        time.Now(),
	}); err != nil {
		response.InternalError(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

type cpepDoneRequest struct {
	UserID       string  `json:"userId"       binding:"required"`
	ModelVersion string  `json:"modelVersion" binding:"required"`
	PearsonR     float64 `json:"pearsonR"`
	RMSE         float64 `json:"rmse"`
	R2           float64 `json:"r2"`
}

func (h *InternalHandler) CPEPDone(c *gin.Context) {
	var req cpepDoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"userId":       req.UserID,
			"modelVersion": req.ModelVersion,
			"pearsonR":     req.PearsonR,
			"rmse":         req.RMSE,
			"r2":           req.R2,
		},
	})
}
