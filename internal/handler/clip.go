package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/models"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/queue"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/repository"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/response"
)

type ClipHandler struct {
	clipRepo *repository.ClipRepository
	queue    *queue.Client
}

func NewClipHandler(clipRepo *repository.ClipRepository, queueClient *queue.Client) *ClipHandler {
	return &ClipHandler{clipRepo: clipRepo, queue: queueClient}
}

func (h *ClipHandler) ListClips(c *gin.Context) {
	userIDStr, _ := c.Get("userID")

	userID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	clips, err := h.clipRepo.FindByUserID(c.Request.Context(), userID, 50, 0)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, clips)
}

func (h *ClipHandler) GetClip(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid clip id")
		return
	}

	clip, err := h.clipRepo.FindByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "clip")
		return
	}

	response.OK(c, clip)
}

type updateClipRequest struct {
	SelectedHook string              `json:"selectedHook"`
	EditSettings models.EditSettings `json:"editSettings"`
	Status       string              `json:"status"`
}

func (h *ClipHandler) UpdateClip(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid clip id")
		return
	}

	var req updateClipRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	if req.Status != "" {
		if err := h.clipRepo.UpdateStatus(c.Request.Context(), id, models.ClipStatus(req.Status)); err != nil {
			response.InternalError(c)
			return
		}
	}

	if err := h.clipRepo.UpdateEditSettings(c.Request.Context(), id, req.EditSettings, req.SelectedHook); err != nil {
		response.InternalError(c)
		return
	}

	clip, err := h.clipRepo.FindByID(c.Request.Context(), id)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, clip)
}

func (h *ClipHandler) ExportClip(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	clipIDStr := c.Param("id")

	id, err := primitive.ObjectIDFromHex(clipIDStr)
	if err != nil {
		response.BadRequest(c, "invalid clip id")
		return
	}

	clip, err := h.clipRepo.FindByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "clip")
		return
	}

	if err := h.clipRepo.UpdateStatus(c.Request.Context(), id, models.ClipStatusEditing); err != nil {
		response.InternalError(c)
		return
	}

	task, err := queue.NewExportClipTask(clipIDStr, userIDStr.(string))
	if err != nil {
		response.InternalError(c)
		return
	}

	if err := h.queue.Enqueue(task); err != nil {
		response.InternalError(c)
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"success": true,
		"data": gin.H{
			"clipId":  clip.ID.Hex(),
			"status":  models.ClipStatusEditing,
			"message": "clip queued for export",
		},
	})
}