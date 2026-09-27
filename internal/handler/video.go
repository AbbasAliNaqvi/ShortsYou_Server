package handler

import (
	"net/http"
	"net/url"
	"strings"
	"time"

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
	clipRepo  *repository.ClipRepository
	userRepo  *repository.UserRepository
	jobRepo   *repository.JobRepository
	queue     *queue.Client
	cfg       *config.Config
	oauthCfg  *oauth2.Config
}

type ingestRequest struct {
	URL        string `json:"url" binding:"required"`
	Transcribe *bool  `json:"transcribe"`
}

type processVideoRequest struct {
	Transcribe *bool `json:"transcribe"`
}

func NewVideoHandler(
	videoRepo *repository.VideoRepository,
	clipRepo *repository.ClipRepository,
	userRepo *repository.UserRepository,
	queueClient *queue.Client,
	oauthCfg *oauth2.Config,
	jobRepo *repository.JobRepository,
	cfg *config.Config,
) *VideoHandler {
	return &VideoHandler{
		videoRepo: videoRepo,
		clipRepo:  clipRepo,
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
			"",
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

// SearchYouTubeVideos exposes a title/topic lookup for the direct ingest flow.
func (h *VideoHandler) SearchYouTubeVideos(c *gin.Context) {
	query := strings.TrimSpace(c.Query("q"))
	if query == "" {
		response.BadRequest(c, "query parameter q is required")
		return
	}
	client, err := youtube.NewPublicClient(c.Request.Context(), h.cfg.YoutubeAPIKey)
	if err != nil {
		response.InternalError(c)
		return
	}
	videos, err := client.SearchVideos(c.Request.Context(), query, 8)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.OK(c, videos)
}

// DeleteVideo removes a source video and every clip generated from it.
func (h *VideoHandler) DeleteVideo(c *gin.Context) {
	userID, ok := authenticatedUserID(c)
	if !ok {
		response.Unauthorized(c)
		return
	}
	videoID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid video id")
		return
	}
	video, err := h.videoRepo.FindByIDAndUserID(c.Request.Context(), videoID, userID)
	if err != nil || video == nil {
		response.NotFound(c, "video")
		return
	}
	// Delete clips first so a deleted source can never leave visible clips behind.
	if err := h.clipRepo.DeleteByVideoID(c.Request.Context(), videoID, userID); err != nil {
		response.InternalError(c)
		return
	}
	deleted, err := h.videoRepo.DeleteByIDAndUserID(c.Request.Context(), videoID, userID)
	if err != nil || !deleted {
		response.InternalError(c)
		return
	}
	response.OK(c, gin.H{"videoId": videoID.Hex(), "message": "video and its clips removed"})
}

// GenerateVideo queues AI transcription and clip discovery for a video already
// saved in the user's library (own channel or a selected public channel).
func (h *VideoHandler) GenerateVideo(c *gin.Context) {
	userID, ok := authenticatedUserID(c)
	if !ok {
		response.Unauthorized(c)
		return
	}
	videoID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid video id")
		return
	}
	video, err := h.videoRepo.FindByID(c.Request.Context(), videoID)
	if err != nil || video.UserID != userID {
		response.NotFound(c, "video")
		return
	}
	// Pending is the initial state of a video that has not been generated yet.
	// A stale active state must be recoverable: otherwise a timed-out callback
	// leaves the user with no way to regenerate clips.
	isActive := video.ProcessingStatus == models.StatusTranscribing ||
		video.ProcessingStatus == models.StatusAnalyzing ||
		video.ProcessingStatus == models.StatusDownloading
	if isActive && (video.UpdatedAt.IsZero() || time.Since(video.UpdatedAt) < 15*time.Minute) {
		response.OK(c, gin.H{"videoId": video.ID.Hex(), "status": video.ProcessingStatus, "message": "AI generation is already in progress"})
		return
	}
	jobID := primitive.NewObjectID().Hex()
	if err := h.jobRepo.Create(c.Request.Context(), models.ProcessingJob{
		JobID: jobID, UserID: userID, VideoID: videoID,
		Status: models.JobStatusQueued, Stage: "queued", Progress: 0,
	}); err != nil {
		response.InternalError(c)
		return
	}
	if err := h.videoRepo.UpdateStatus(c.Request.Context(), videoID, models.StatusPending, ""); err != nil {
		response.InternalError(c)
		return
	}
	task, err := queue.NewProcessVideoTask(video.ID.Hex(), userID.Hex(), jobID)
	if err != nil || h.queue.Enqueue(task) != nil {
		_ = h.jobRepo.Fail(c.Request.Context(), jobID, "could not enqueue processing job")
		response.InternalError(c)
		return
	}
	response.OK(c, gin.H{"jobId": jobID, "videoId": video.ID.Hex(), "status": "processing", "message": "AI generation queued"})
}

// POST /api/v1/channels/:channelId/videos/:youtubeVideoId/process
func (h *VideoHandler) ProcessPublicVideo(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	channelID := c.Param("channelId")
	ytVideoID := c.Param("youtubeVideoId")

	userID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	transcribe := true
	if fromIngest, exists := c.Get("transcribe"); exists {
		transcribe = fromIngest.(bool)
	} else if c.Request.ContentLength != 0 {
		var req processVideoRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			response.BadRequest(c, "invalid processing options")
			return
		}
		if req.Transcribe != nil {
			transcribe = *req.Transcribe
		}
	}

	// A selected public video is stored once per user. Reusing the existing
	// document keeps the Videos library stable when a creator is revisited.
	existing, _ := h.videoRepo.FindByYouTubeID(c.Request.Context(), ytVideoID, userID)
	if existing != nil {
		response.OK(c, gin.H{
			"message": "video already in your library",
			"videoId": existing.ID.Hex(),
			"status":  existing.ProcessingStatus,
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
	jobID := primitive.NewObjectID().Hex()

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
		JobID:    jobID,
		UserID:   userID,
		VideoID:  videoID,
		Status:   models.JobStatusQueued,
		Stage:    "queued",
		Progress: 0,
	}
	if err := h.jobRepo.Create(c.Request.Context(), job); err != nil {
		response.InternalError(c)
		return
	}

	if !transcribe {
		if err := h.videoRepo.UpdateStatus(c.Request.Context(), videoID, models.StatusCompleted, "transcription skipped by user"); err != nil {
			response.InternalError(c)
			return
		}
		if err := h.jobRepo.Complete(c.Request.Context(), jobID, 0); err != nil {
			response.InternalError(c)
			return
		}
		response.OK(c, gin.H{
			"jobId":   jobID,
			"videoId": videoID.Hex(),
			"title":   meta.Title,
			"status":  "completed",
			"message": "video saved; transcription was skipped",
		})
		return
	}

	// Enqueue the processing job
	task, err := queue.NewProcessVideoTask(videoID.Hex(), userIDStr.(string), jobID)
	if err != nil {
		response.InternalError(c)
		return
	}
	if err := h.queue.Enqueue(task); err != nil {
		_ = h.jobRepo.Fail(c.Request.Context(), jobID, "could not enqueue processing job")
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

// IngestURL accepts a YouTube watch or short URL from the studio dashboard.
func (h *VideoHandler) IngestURL(c *gin.Context) {
	var req ingestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "youtube url is required")
		return
	}

	parsed, err := url.Parse(strings.TrimSpace(req.URL))
	if err != nil {
		response.BadRequest(c, "invalid youtube url")
		return
	}

	videoID := parsed.Query().Get("v")
	host := strings.ToLower(parsed.Hostname())
	if videoID == "" && (host == "youtu.be" || host == "www.youtu.be") {
		videoID = strings.Trim(parsed.Path, "/")
	}
	if videoID == "" && (host == "youtube.com" || host == "www.youtube.com" || host == "m.youtube.com") {
		parts := strings.Split(strings.Trim(parsed.Path, "/"), "/")
		if len(parts) == 2 && (parts[0] == "shorts" || parts[0] == "embed" || parts[0] == "live") {
			videoID = parts[1]
		}
	}
	if videoID == "" || strings.ContainsAny(videoID, " /?#") {
		response.BadRequest(c, "use a youtube watch or short url")
		return
	}

	transcribe := true
	if req.Transcribe != nil {
		transcribe = *req.Transcribe
	}
	c.Set("transcribe", transcribe)
	c.Params = gin.Params{{Key: "channelId", Value: "direct"}, {Key: "youtubeVideoId", Value: videoID}}
	h.ProcessPublicVideo(c)
}

// AutoCreate queues AI transcription, clip discovery, AND auto-export for a
// video already saved in the user's library. This is the "one-button magic"
// that goes from saved video → ready-to-download shorts with zero manual steps.
// POST /api/v1/videos/:id/auto-create
func (h *VideoHandler) AutoCreate(c *gin.Context) {
	userID, ok := authenticatedUserID(c)
	if !ok {
		response.Unauthorized(c)
		return
	}
	videoID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid video id")
		return
	}
	video, err := h.videoRepo.FindByID(c.Request.Context(), videoID)
	if err != nil || video.UserID != userID {
		response.NotFound(c, "video")
		return
	}

	// Mark the video for auto-creation so the analysis callback auto-exports.
	if err := h.videoRepo.UpdateFields(c.Request.Context(), videoID, map[string]any{
		"autoCreate":       true,
		"processingStatus": string(models.StatusPending),
		"updatedAt":        time.Now(),
	}); err != nil {
		response.InternalError(c)
		return
	}

	jobID := primitive.NewObjectID().Hex()
	if err := h.jobRepo.Create(c.Request.Context(), models.ProcessingJob{
		JobID: jobID, UserID: userID, VideoID: videoID,
		Status: models.JobStatusQueued, Stage: "auto_create_queued", Progress: 0,
	}); err != nil {
		response.InternalError(c)
		return
	}

	task, err := queue.NewProcessVideoTask(video.ID.Hex(), userID.Hex(), jobID, true)
	if err != nil || h.queue.Enqueue(task) != nil {
		_ = h.jobRepo.Fail(c.Request.Context(), jobID, "could not enqueue auto-create job")
		response.InternalError(c)
		return
	}
	response.OK(c, gin.H{
		"jobId":   jobID,
		"videoId": video.ID.Hex(),
		"status":  "auto_creating",
		"message": "AI Auto-Create started — your shorts will appear ready to download",
	})
}

type autoCreateIngestRequest struct {
	URL string `json:"url" binding:"required"`
}

// AutoCreateIngest accepts a YouTube URL and does EVERYTHING: ingest → transcription
// → AI analysis → clip detection → hook generation → auto-export top clips.
// The ultimate single-action endpoint.
// POST /api/v1/videos/auto-create
func (h *VideoHandler) AutoCreateIngest(c *gin.Context) {
	var req autoCreateIngestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "youtube url is required")
		return
	}

	parsed, err := url.Parse(strings.TrimSpace(req.URL))
	if err != nil {
		response.BadRequest(c, "invalid youtube url")
		return
	}

	ytVideoID := parsed.Query().Get("v")
	host := strings.ToLower(parsed.Hostname())
	if ytVideoID == "" && (host == "youtu.be" || host == "www.youtu.be") {
		ytVideoID = strings.Trim(parsed.Path, "/")
	}
	if ytVideoID == "" && (host == "youtube.com" || host == "www.youtube.com" || host == "m.youtube.com") {
		parts := strings.Split(strings.Trim(parsed.Path, "/"), "/")
		if len(parts) == 2 && (parts[0] == "shorts" || parts[0] == "embed" || parts[0] == "live") {
			ytVideoID = parts[1]
		}
	}
	if ytVideoID == "" || strings.ContainsAny(ytVideoID, " /?#") {
		response.BadRequest(c, "use a youtube watch or short url")
		return
	}

	userID, ok := authenticatedUserID(c)
	if !ok {
		response.Unauthorized(c)
		return
	}

	// Check if already exists
	existing, _ := h.videoRepo.FindByYouTubeID(c.Request.Context(), ytVideoID, userID)
	if existing != nil {
		// Set auto-create on existing video and start the pipeline
		if err := h.videoRepo.UpdateFields(c.Request.Context(), existing.ID, map[string]any{
			"autoCreate":       true,
			"processingStatus": string(models.StatusPending),
			"updatedAt":        time.Now(),
		}); err != nil {
			response.InternalError(c)
			return
		}
		jobID := primitive.NewObjectID().Hex()
		if err := h.jobRepo.Create(c.Request.Context(), models.ProcessingJob{
			JobID: jobID, UserID: userID, VideoID: existing.ID,
			Status: models.JobStatusQueued, Stage: "auto_create_queued", Progress: 0,
		}); err != nil {
			response.InternalError(c)
			return
		}
		task, err := queue.NewProcessVideoTask(existing.ID.Hex(), userID.Hex(), jobID, true)
		if err != nil || h.queue.Enqueue(task) != nil {
			_ = h.jobRepo.Fail(c.Request.Context(), jobID, "could not enqueue auto-create job")
			response.InternalError(c)
			return
		}
		response.OK(c, gin.H{
			"jobId":   jobID,
			"videoId": existing.ID.Hex(),
			"title":   existing.Title,
			"status":  "auto_creating",
			"message": "AI Auto-Create started on existing video",
		})
		return
	}

	// Fetch video metadata from YouTube
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

	videoID := primitive.NewObjectID()
	jobID := primitive.NewObjectID().Hex()

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
		SourceChannelID:  "direct",
		AutoCreate:       true,
	}

	if err := h.videoRepo.Insert(c.Request.Context(), video); err != nil {
		response.InternalError(c)
		return
	}

	job := models.ProcessingJob{
		JobID:    jobID,
		UserID:   userID,
		VideoID:  videoID,
		Status:   models.JobStatusQueued,
		Stage:    "auto_create_queued",
		Progress: 0,
	}
	if err := h.jobRepo.Create(c.Request.Context(), job); err != nil {
		response.InternalError(c)
		return
	}

	task, err := queue.NewProcessVideoTask(videoID.Hex(), userID.Hex(), jobID, true)
	if err != nil {
		response.InternalError(c)
		return
	}
	if err := h.queue.Enqueue(task); err != nil {
		_ = h.jobRepo.Fail(c.Request.Context(), jobID, "could not enqueue auto-create job")
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{
		"jobId":   jobID,
		"videoId": videoID.Hex(),
		"title":   meta.Title,
		"status":  "auto_creating",
		"message": "AI Auto-Create started — transcription, analysis, hook generation, and rendering will happen automatically",
	})
}

// GET /api/v1/jobs/:jobId
func (h *VideoHandler) GetJobStatus(c *gin.Context) {
	userIDValue, exists := c.Get("userID")
	if !exists {
		response.Unauthorized(c)
		return
	}
	userID, err := primitive.ObjectIDFromHex(userIDValue.(string))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	jobID := c.Param("jobId")

	job, err := h.jobRepo.FindByJobID(c.Request.Context(), jobID)
	if err != nil {
		response.NotFound(c, "job")
		return
	}
	if job.UserID != userID {
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

// ListJobs returns recent processing jobs for the authenticated dashboard.
func (h *VideoHandler) ListJobs(c *gin.Context) {
	userIDValue, exists := c.Get("userID")
	if !exists {
		response.Unauthorized(c)
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDValue.(string))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	jobs, err := h.jobRepo.FindByUserID(c.Request.Context(), userID, 20)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, jobs)
}
