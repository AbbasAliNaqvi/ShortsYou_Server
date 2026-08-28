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
	userRepo *repository.UserRepository,
	queueClient *queue.Client,
) *VideoHandler {
	return &VideoHandler{
		videoRepo: videoRepo,
		userRepo:  userRepo,
		queue:     queueClient,
	}
}

// SyncChannel fetches the authenticated user's YouTube videos,
// stores/updates them in MongoDB, and queues pending videos for processing.
func (h *VideoHandler) SyncChannel(c *gin.Context) {
	value, exists := c.Get("userID")
	if !exists {
		response.Unauthorized(c)
		return
	}

	userIDStr, ok := value.(string)
	if !ok || userIDStr == "" {
		response.Unauthorized(c)
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	// Retrieve the local user.
	user, err := h.userRepo.FindByID(
		c.Request.Context(),
		userIDStr,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "find user: " + err.Error(),
		})
		return
	}

	if user == nil {
		response.NotFound(c, "user")
		return
	}

	if user.AccessToken == "" {
		response.BadRequest(c, "youtube authorization required")
		return
	}

	// Create a YouTube client using the user's OAuth access token.
	ytClient, err := youtube.NewClientWithToken(
		c.Request.Context(),
		user.AccessToken,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "create youtube client: " + err.Error(),
		})
		return
	}

	// Fetch the user's YouTube videos.
	ytVideos, err := ytClient.FetchMyVideos(
		c.Request.Context(),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "fetch youtube videos: " + err.Error(),
		})
		return
	}

	// Convert YouTube video data into our MongoDB model.
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

	// Insert new videos and update existing video metadata.
	if err := h.videoRepo.BulkUpsert(
		c.Request.Context(),
		videoModels,
	); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "save videos: " + err.Error(),
		})
		return
	}

	// Find all videos that still need processing.
	pending, err := h.videoRepo.FindByStatus(
		c.Request.Context(),
		userID,
		models.StatusPending,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "find pending videos: " + err.Error(),
		})
		return
	}

	// Queue pending videos for asynchronous processing.
	queued := 0

	for _, video := range pending {
		task, err := queue.NewProcessVideoTask(
			video.ID.Hex(),
			userIDStr,
		)
		if err != nil {
			continue
		}

		if err := h.queue.Enqueue(task); err != nil {
			continue
		}

		queued++
	}

	response.OK(c, gin.H{
		"synced": len(videoModels),
		"queued": queued,
	})
}

// ListVideos returns all videos belonging to the authenticated user.
func (h *VideoHandler) ListVideos(c *gin.Context) {
	value, exists := c.Get("userID")
	if !exists {
		response.Unauthorized(c)
		return
	}

	userIDStr, ok := value.(string)
	if !ok || userIDStr == "" {
		response.Unauthorized(c)
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	videos, err := h.videoRepo.FindByUserID(
		c.Request.Context(),
		userID,
		50,
		0,
	)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, videos)
}
