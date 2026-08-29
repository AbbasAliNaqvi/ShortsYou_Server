package handler

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/models"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/queue"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/repository"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/storage"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/response"
)

type ClipHandler struct {
	clipRepo *repository.ClipRepository
	queue    *queue.Client
	supabase *storage.SupabaseClient
}

func NewClipHandler(
	clipRepo *repository.ClipRepository,
	queueClient *queue.Client,
	supabase *storage.SupabaseClient,
) *ClipHandler {
	return &ClipHandler{
		clipRepo: clipRepo,
		queue:    queueClient,
		supabase: supabase,
	}
}

func (h *ClipHandler) ListClips(c *gin.Context) {
	userID, ok := authenticatedUserID(c)
	if !ok {
		response.Unauthorized(c)
		return
	}

	clips, err := h.clipRepo.FindByUserID(
		c.Request.Context(),
		userID,
		50,
		0,
	)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, clips)
}

func (h *ClipHandler) GetClip(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
		response.Unauthorized(c)
		return
	}

	userID, ok := userIDStr.(string)
	if !ok || userID == "" {
		response.Unauthorized(c)
		return
	}

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

	if clip.UserID.Hex() != userID {
		response.NotFound(c, "clip")
		return
	}

	response.OK(c, clip)
}

type updateClipRequest struct {
	SelectedHook *string              `json:"selectedHook"`
	EditSettings *models.EditSettings `json:"editSettings"`
	Status       *string              `json:"status"`
}

func (h *ClipHandler) UpdateClip(c *gin.Context) {
	userID, ok := authenticatedUserID(c)
	if !ok {
		response.Unauthorized(c)
		return
	}

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
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

	if clip.UserID != userID {
		response.Forbidden(c)
		return
	}

	var req updateClipRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	if req.Status != nil {
		status := models.ClipStatus(*req.Status)

		if !isValidClipStatus(status) {
			response.BadRequest(c, "invalid clip status")
			return
		}

		if !isValidStatusTransition(clip.Status, status) {
			response.BadRequest(c, fmt.Sprintf(
				"invalid status transition: %s -> %s",
				clip.Status,
				status,
			))
			return
		}

		if err := h.clipRepo.UpdateStatus(
			c.Request.Context(),
			id,
			status,
		); err != nil {
			response.InternalError(c)
			return
		}
	}

	if req.EditSettings != nil || req.SelectedHook != nil {
		settings := clip.EditSettings

		if req.EditSettings != nil {
			settings = *req.EditSettings
		}

		selectedHook := clip.SelectedHook

		if req.SelectedHook != nil {
			selectedHook = *req.SelectedHook
		}

		if err := h.clipRepo.UpdateEditSettings(
			c.Request.Context(),
			id,
			settings,
			selectedHook,
		); err != nil {
			response.InternalError(c)
			return
		}
	}

	updatedClip, err := h.clipRepo.FindByID(
		c.Request.Context(),
		id,
	)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, updatedClip)
}

func (h *ClipHandler) ExportClip(c *gin.Context) {
	userID, ok := authenticatedUserID(c)
	if !ok {
		response.Unauthorized(c)
		return
	}

	clipIDStr := c.Param("id")

	id, err := primitive.ObjectIDFromHex(clipIDStr)
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

	if clip.UserID != userID {
		response.Forbidden(c)
		return
	}

	// Don't enqueue duplicate exports.
	if clip.Status == models.ClipStatusEditing {
		response.OK(c, gin.H{
			"clipId":  clip.ID.Hex(),
			"status":  clip.Status,
			"message": "clip export is already in progress",
		})
		return
	}

	if clip.Status == models.ClipStatusExported {
		response.OK(c, gin.H{
			"clipId":  clip.ID.Hex(),
			"status":  clip.Status,
			"message": "clip has already been exported",
		})
		return
	}

	if clip.Status != models.ClipStatusDetected &&
		clip.Status != models.ClipStatusFailed {
		response.BadRequest(c, "clip cannot be exported in its current status")
		return
	}

	if err := h.clipRepo.UpdateStatus(
		c.Request.Context(),
		id,
		models.ClipStatusEditing,
	); err != nil {
		response.InternalError(c)
		return
	}

	task, err := queue.NewExportClipTask(
		clipIDStr,
		userID.Hex(),
	)
	if err != nil {
		// Best effort rollback.
		_ = h.clipRepo.UpdateStatus(
			c.Request.Context(),
			id,
			clip.Status,
		)

		response.InternalError(c)
		return
	}

	if err := h.queue.Enqueue(task); err != nil {
		// Best effort rollback.
		_ = h.clipRepo.UpdateStatus(
			c.Request.Context(),
			id,
			clip.Status,
		)

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

func (h *ClipHandler) MarkPublished(c *gin.Context) {
	userID, ok := authenticatedUserID(c)
	if !ok {
		response.Unauthorized(c)
		return
	}

	clipIDStr := c.Param("id")

	id, err := primitive.ObjectIDFromHex(clipIDStr)
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

	if clip.UserID != userID {
		response.Forbidden(c)
		return
	}

	if clip.Status != models.ClipStatusExported {
		response.BadRequest(c, "clip must be exported before publishing")
		return
	}

	if err := h.clipRepo.UpdateStatus(
		c.Request.Context(),
		id,
		models.ClipStatusPublished,
	); err != nil {
		response.InternalError(c)
		return
	}

	task, err := queue.NewCollectAnalyticsTask(
		clipIDStr,
		userID.Hex(),
		clip.VideoID.Hex(),
	)
	if err != nil {
		// Publishing succeeded, but analytics scheduling failed.
		response.InternalError(c)
		return
	}

	if err := h.queue.Enqueue(task); err != nil {
		// Publishing succeeded, but analytics scheduling failed.
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{
		"clipId":  clipIDStr,
		"status":  models.ClipStatusPublished,
		"message": "analytics collection scheduled for 48 hours from now",
	})
}

func (h *ClipHandler) GetDownloadURL(c *gin.Context) {
	userID, ok := authenticatedUserID(c)
	if !ok {
		response.Unauthorized(c)
		return
	}

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
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

	if clip.UserID != userID {
		response.Forbidden(c)
		return
	}

	if clip.Status != models.ClipStatusExported &&
		clip.Status != models.ClipStatusPublished {
		response.BadRequest(c, "clip has not been exported yet")
		return
	}

	if clip.SupabaseShortURL == "" {
		response.BadRequest(c, "clip has not been exported yet")
		return
	}

	objectKey := fmt.Sprintf(
		"%s/%s/%s.mp4",
		queue.ProcessedClipBucket,
		userID.Hex(),
		clip.ID.Hex(),
	)

	signedURL, err := h.supabase.SignedURL(
		c.Request.Context(),
		queue.ProcessedClipBucket,
		fmt.Sprintf(
			"%s/%s.mp4",
			userID.Hex(),
			clip.ID.Hex(),
		),
		900,
	)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{
		"downloadUrl": signedURL,
		"expiresIn":   900,
		"filename": fmt.Sprintf(
			"shortsyou-%s.mp4",
			clip.ID.Hex(),
		),
		"objectKey": objectKey,
	})
}

func authenticatedUserID(c *gin.Context) (primitive.ObjectID, bool) {
	value, exists := c.Get("userID")
	if !exists {
		return primitive.NilObjectID, false
	}

	userIDStr, ok := value.(string)
	if !ok || userIDStr == "" {
		return primitive.NilObjectID, false
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return primitive.NilObjectID, false
	}

	return userID, true
}

func isValidClipStatus(status models.ClipStatus) bool {
	switch status {
	case models.ClipStatusDetected,
		models.ClipStatusEditing,
		models.ClipStatusExported,
		models.ClipStatusPublished,
		models.ClipStatusRejected,
		models.ClipStatusFailed:
		return true
	default:
		return false
	}
}

func isValidStatusTransition(
	from models.ClipStatus,
	to models.ClipStatus,
) bool {
	if from == to {
		return true
	}

	switch from {
	case models.ClipStatusDetected:
		return to == models.ClipStatusEditing ||
			to == models.ClipStatusRejected

	case models.ClipStatusEditing:
		return to == models.ClipStatusFailed ||
			to == models.ClipStatusExported

	case models.ClipStatusExported:
		return to == models.ClipStatusPublished ||
			to == models.ClipStatusEditing

	case models.ClipStatusPublished:
		return false

	case models.ClipStatusFailed:
		return to == models.ClipStatusEditing

	case models.ClipStatusRejected:
		return false

	default:
		return false
	}
}
