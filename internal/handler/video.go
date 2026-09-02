package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/oauth2"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/config"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/models"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/queue"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/repository"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/youtube"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/response"
)

type VideoHandler struct {
	videoRepo *repository.VideoRepository
	userRepo  *repository.UserRepository
	jobRepo   *repository.JobRepository
	queue     *queue.Client
	cfg       *config.Config
	oauthCfg  *oauth2.Config
}

func NewVideoHandler(
	videoRepo *repository.VideoRepository,
	userRepo  *repository.UserRepository,
	queueClient *queue.Client,
	oauthCfg  *oauth2.Config,
	jobRepo   *repository.JobRepository,
	cfg       *config.Config,
) *VideoHandler {
	return &VideoHandler{
		videoRepo: videoRepo,
		userRepo:  userRepo,
		jobRepo:   jobRepo,
		queue:     queueClient,
		cfg:       cfg,
		oauthCfg:  oauthCfg,
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
		user.RefreshToken,
		user.TokenExpiry,
		h.oauthCfg,
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

// POST /api/v1/channels/:channelId/videos/:youtubeVideoId/process
func (h *VideoHandler) ProcessPublicVideo(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	channelID    := c.Param("channelId")
	ytVideoID    := c.Param("youtubeVideoId")

	userID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	// Check if this video was already processed by this user
	existing, _ := h.videoRepo.FindByYouTubeID(c.Request.Context(), ytVideoID, userID)
	if existing != nil && existing.ProcessingStatus == models.StatusCompleted {
		response.OK(c, gin.H{
			"message": "video already processed",
			"videoId": existing.ID.Hex(),
			"status":  "completed",
		})
		return
	}

	// Fetch video metadata from YouTube public API
	ytClient, err := youtube.NewPublicClient(c.Request.Context(), h.cfg.YoutubeAPIKey)
	if err != nil {
		response.InternalError(c)
		return
	}

	videos, err := ytClient.FetchPublicVideoDetails(c.Request.Context(), []string{ytVideoID})
	if err != nil || len(videos) == 0 {
		response.NotFound(c, "youtube video")
		return
	}

	meta := videos[0]

	// Create Video document in MongoDB
	videoID := primitive.NewObjectID()
	jobID   := primitive.NewObjectID().Hex()

	video := models.Video{
		ID:               videoID,
		UserID:           userID,
		YouTubeVideoID:   ytVideoID,
		Title:            meta.Title,
		Description:      meta.Description,
		ThumbnailURL:     meta.ThumbnailURL,
		DurationSeconds:  meta.DurationSeconds,
		ViewCount:        meta.ViewCount,
		LikeCount:        meta.LikeCount,
		CommentCount:     meta.CommentCount,
		PublishedAt:      meta.PublishedAt,
		ProcessingStatus: models.StatusPending,
		SourceType:       "public",
		SourceChannelID:  channelID,
	}

	if err := h.videoRepo.Insert(c.Request.Context(), video); err != nil {
		response.InternalError(c)
		return
	}

	// Create job tracking document
	job := models.ProcessingJob{
		JobID:   jobID,
		UserID:  userID,
		VideoID: videoID,
		Status:  models.JobStatusQueued,
		Stage:   "queued",
		Progress: 0,
	}
	if err := h.jobRepo.Create(c.Request.Context(), job); err != nil {
		response.InternalError(c)
		return
	}

	// Enqueue the processing job
	task, err := queue.NewProcessVideoTask(videoID.Hex(), userIDStr.(string))
	if err != nil {
		response.InternalError(c)
		return
	}
	if err := h.queue.Enqueue(task); err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{
		"jobId":   jobID,
		"videoId": videoID.Hex(),
		"title":   meta.Title,
		"status":  "processing",
		"message": "video queued for AI analysis",
	})
}

// GET /api/v1/jobs/:jobId
func (h *VideoHandler) GetJobStatus(c *gin.Context) {
	jobID := c.Param("jobId")

	job, err := h.jobRepo.FindByJobID(c.Request.Context(), jobID)
	if err != nil {
		response.NotFound(c, "job")
		return
	}

	response.OK(c, gin.H{
		"jobId":      job.JobID,
		"videoId":    job.VideoID.Hex(),
		"status":     job.Status,
		"stage":      job.Stage,
		"progress":   job.Progress,
		"clipsFound": job.ClipsFound,
		"error":      job.Error,
	})
}