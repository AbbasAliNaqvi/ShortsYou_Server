package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/models"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/queue"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/repository"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/youtube"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/response"
)

type VideoHandler struct {
	videoRepo *repository.VideoRepository
	userRepo  *repository.UserRepository
	queue     *queue.Client
}

func NewVideoHandler(
	videoRepo *repository.VideoRepository,
	userRepo  *repository.UserRepository,
	queueClient *queue.Client,
) *VideoHandler {
	return &VideoHandler{
		videoRepo: videoRepo,
		userRepo:  userRepo,
		queue:     queueClient,
	}
}

func (h *VideoHandler) SyncChannel(c *gin.Context) {
	userIDStr, _ := c.Get("userID")

	userID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	// Retrieve stored OAuth access token to call YouTube on the user's behalf.
	user, err := h.userRepo.FindByID(c.Request.Context(), userIDStr.(string))
	if err != nil || user == nil {
		response.NotFound(c, "user")
		return
	}

	ytClient, err := youtube.NewClientWithToken(c.Request.Context(), user.AccessToken)
	if err != nil {
		response.InternalError(c)
		return
	}

	ytVideos, err := ytClient.FetchMyVideos(c.Request.Context())
	if err != nil {
		response.InternalError(c)
		return
	}

	// Map YouTube metadata to our Video model.
	videoModels := make([]models.Video, 0, len(ytVideos))
	for _, v := range ytVideos {
		videoModels = append(videoModels, models.Video{
			UserID:          userID,
			YouTubeVideoID:  v.YouTubeVideoID,
			Title:           v.Title,
			Description:     v.Description,
			DurationSeconds: v.DurationSeconds,
			ThumbnailURL:    v.ThumbnailURL,
			PublishedAt:     v.PublishedAt,
			ViewCount:       v.ViewCount,
			LikeCount:       v.LikeCount,
			CommentCount:    v.CommentCount,
		})
	}

	if err := h.videoRepo.BulkUpsert(c.Request.Context(), videoModels); err != nil {
		response.InternalError(c)
		return
	}

	// Find every video still pending processing and queue it.
	pending, err := h.videoRepo.FindByStatus(c.Request.Context(), userID, models.StatusPending)
	if err != nil {
		response.InternalError(c)
		return
	}

	queued := 0
	for _, v := range pending {
		task, err := queue.NewProcessVideoTask(v.ID.Hex(), userIDStr.(string))
		if err != nil {
			continue
		}
		if err := h.queue.Enqueue(task); err != nil {
			continue
		}
		queued++
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"synced": len(videoModels),
			"queued": queued,
		},
	})
}

// ListVideos returns all videos belonging to the authenticated user.
func (h *VideoHandler) ListVideos(c *gin.Context) {
	userIDStr, _ := c.Get("userID")

	userID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	videos, err := h.videoRepo.FindByUserID(c.Request.Context(), userID, 50, 0)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, videos)
}