package handler

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/models"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/queue"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/repository"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/storage"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/hibiken/asynq"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ClipHandler struct {
	clipRepo  *repository.ClipRepository
	videoRepo *repository.VideoRepository
	queue     *queue.Client
	supabase  *storage.SupabaseClient
}

type manualClipRequest struct {
	StartTime    float64             `json:"startTime"`
	EndTime      float64             `json:"endTime"`
	HookText     string              `json:"hookText"`
	EditSettings models.EditSettings `json:"editSettings"`
}

// CreateManual creates and renders a creator-selected range without waiting
// for transcription or AI analysis.
func (h *ClipHandler) CreateManual(c *gin.Context) {
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
	var req manualClipRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.EndTime <= req.StartTime || req.StartTime < 0 {
		response.BadRequest(c, "provide valid startTime and endTime")
		return
	}
	video, err := h.videoRepo.FindByIDAndUserID(c.Request.Context(), videoID, userID)
	if err != nil || video == nil {
		response.NotFound(c, "video")
		return
	}
	if video.DurationSeconds > 0 && req.EndTime > float64(video.DurationSeconds) {
		response.BadRequest(c, "endTime exceeds the source video duration")
		return
	}
	settings := normalizedEditSettings(req.EditSettings)
	// Word timestamps are relative to the original clip. Removing sections
	// without remapping those timestamps makes captions drift, so this editor
	// prioritizes caption sync over destructive cuts.
	settings.RemoveSilences = false
	settings.RemoveFillers = false
	clip := models.Clip{ID: primitive.NewObjectID(), VideoID: videoID, UserID: userID, StartTime: req.StartTime, EndTime: req.EndTime, DurationSeconds: req.EndTime - req.StartTime, TranscriptText: req.HookText, OriginalHook: req.HookText, SelectedHook: req.HookText, Category: models.CategoryNarrative, EditSettings: settings, Status: models.ClipStatusEditing}
	if err := h.clipRepo.BulkInsert(c.Request.Context(), []models.Clip{clip}); err != nil {
		response.InternalError(c)
		return
	}
	task, err := queue.NewExportClipTask(clip.ID.Hex(), userID.Hex())
	if err != nil || h.queue.Enqueue(task, asynq.TaskID("export:"+clip.ID.Hex()), asynq.MaxRetry(2)) != nil {
		_ = h.clipRepo.UpdateStatus(c.Request.Context(), clip.ID, models.ClipStatusFailed)
		response.InternalError(c)
		return
	}
	c.JSON(http.StatusAccepted, gin.H{"success": true, "data": gin.H{"clipId": clip.ID.Hex(), "status": "editing", "message": "manual short rendering started"}})
}

func normalizedEditSettings(settings models.EditSettings) models.EditSettings {
	if !allowedEditOption(settings.BackgroundStyle, "blur", "dark_gradient", "original", "brand_color", "two_frame") {
		settings.BackgroundStyle = "blur"
	}
	if !allowedEditOption(settings.ColorGrade, "warm", "cool", "vibrant", "cinematic", "natural") {
		settings.ColorGrade = "warm"
	}
	if !allowedEditOption(settings.MusicMood, "energetic", "calm", "motivational", "dramatic", "neutral", "none") {
		settings.MusicMood = "energetic"
	}
	if !allowedEditOption(settings.CaptionStyle, "bold", "karaoke", "minimal") {
		settings.CaptionStyle = "bold"
	}
	if !allowedEditOption(settings.Layout, "standard", "two_frame", "multi_face", "auto_face") {
		settings.Layout = "standard"
	}
	return settings
}

func allowedEditOption(value string, options ...string) bool {
	for _, option := range options {
		if value == option {
			return true
		}
	}
	return false
}

func NewClipHandler(
	clipRepo *repository.ClipRepository,
	videoRepo *repository.VideoRepository,
	queueClient *queue.Client,
	supabase *storage.SupabaseClient,
) *ClipHandler {
	return &ClipHandler{
		clipRepo:  clipRepo,
		videoRepo: videoRepo,
		queue:     queueClient,
		supabase:  supabase,
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

	var req updateClipRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	clip, err := h.clipRepo.FindByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "clip")
		return
	}
	if clip.UserID != userID {
		response.NotFound(c, "clip")
		return
	}

	// Allow any status reset including "detected" for re-processing.
	if req.Status != nil && *req.Status != "" {
		if err := h.clipRepo.UpdateFields(c.Request.Context(), id, map[string]any{
			"status":    *req.Status,
			"updatedAt": time.Now(),
		}); err != nil {
			response.InternalError(c)
			return
		}
	}

	// Update edit settings and/or selected hook when provided.
	if req.EditSettings != nil || req.SelectedHook != nil {
		editSettings := models.EditSettings{}
		selectedHook := ""

		if req.EditSettings != nil {
			editSettings = normalizedEditSettings(*req.EditSettings)
		}

		if req.SelectedHook != nil {
			selectedHook = *req.SelectedHook
		}

		if err := h.clipRepo.UpdateEditSettings(
			c.Request.Context(),
			id,
			editSettings,
			selectedHook,
		); err != nil {
			response.InternalError(c)
			return
		}
	}

	clip, err = h.clipRepo.FindByID(c.Request.Context(), id)
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

	// Ownership check
	if clip.UserID.Hex() != userIDStr.(string) {
		response.Forbidden(c)
		return
	}
	if clip.Status == models.ClipStatusEditing {
		c.JSON(http.StatusAccepted, gin.H{
			"success": true,
			"data": gin.H{
				"clipId":  clipIDStr,
				"status":  "editing",
				"message": "clip export is already in progress",
			},
		})
		return
	}

	// Allow force re-export by resetting editing status
	// This handles stuck jobs from failed previous attempts
	if err := h.clipRepo.UpdateFields(c.Request.Context(), id, map[string]any{
		"status":    string(models.ClipStatusEditing),
		"updatedAt": time.Now(),
	}); err != nil {
		response.InternalError(c)
		return
	}

	task, err := queue.NewExportClipTask(clipIDStr, userIDStr.(string))
	if err != nil {
		response.InternalError(c)
		return
	}

	// A stable task ID prevents double clicks or browser retries from rendering
	// the same clip twice. Never force a duplicate task: it creates competing
	// FFmpeg jobs which overwrite each other's output and callback state.
	if err := h.queue.Enqueue(task,
		asynq.TaskID("export:"+clipIDStr),
		asynq.Unique(10*time.Minute),
		asynq.MaxRetry(2),
	); err != nil {
		if errors.Is(err, asynq.ErrTaskIDConflict) || errors.Is(err, asynq.ErrDuplicateTask) {
			c.JSON(http.StatusAccepted, gin.H{
				"success": true,
				"data": gin.H{
					"clipId":  clipIDStr,
					"status":  "editing",
					"message": "clip export is already queued",
				},
			})
			return
		}
		_ = h.clipRepo.UpdateStatus(c.Request.Context(), id, models.ClipStatusFailed)
		response.InternalError(c)
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"success": true,
		"data": gin.H{
			"clipId":  clipIDStr,
			"status":  "editing",
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
		response.BadRequest(c, "exported clip has no output URL")
		return
	}

	if h.supabase == nil {
		fmt.Println("[download] supabase client is nil")
		response.InternalError(c)
		return
	}

	downloadBucket := queue.ProcessedClipBucket
	objectKey, err := extractProcessedObjectKey(
		clip.SupabaseShortURL,
		downloadBucket,
	)
	if err != nil {
		// The current renderer stores clips in the existing "videos" bucket
		// under a processed-clips/ prefix. Support that canonical output URL
		// while retaining compatibility with a dedicated processed-clips bucket.
		downloadBucket = "videos"
		objectKey, err = extractProcessedObjectKey(clip.SupabaseShortURL, downloadBucket)
		if err != nil {
			fmt.Printf("[download] invalid stored output URL: %v\n", err)
			response.InternalError(c)
			return
		}
	}

	fmt.Printf(
		"[download] bucket=%s object=%s\n",
		downloadBucket,
		objectKey,
	)

	signedURL, err := h.supabase.SignedURL(
		c.Request.Context(),
		downloadBucket,
		objectKey,
		3600,
	)
	if err != nil {
		fmt.Printf(
			"[download] signed URL generation failed: %v\n",
			err,
		)
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{
		"clipId":      clipIDStr,
		"downloadUrl": signedURL,
		"expiresIn":   3600,
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

func extractProcessedObjectKey(outputURL, bucket string) (string, error) {
	outputURL = strings.TrimSpace(outputURL)

	if outputURL == "" {
		return "", fmt.Errorf("output URL is empty")
	}

	// If the callback already gives us an object key,
	// accept it directly.
	if !strings.HasPrefix(outputURL, "http://") &&
		!strings.HasPrefix(outputURL, "https://") {
		key := strings.TrimLeft(outputURL, "/")

		prefix := bucket + "/"
		if strings.HasPrefix(key, prefix) {
			key = strings.TrimPrefix(key, prefix)
		}

		if key == "" {
			return "", fmt.Errorf("empty object key")
		}

		return key, nil
	}

	u, err := url.Parse(outputURL)
	if err != nil {
		return "", fmt.Errorf("parse output URL: %w", err)
	}

	// Expected:
	// /storage/v1/object/public/<bucket>/<object>
	// /storage/v1/object/sign/<bucket>/<object>
	marker := "/storage/v1/object/"

	idx := strings.Index(u.Path, marker)
	if idx == -1 {
		return "", fmt.Errorf(
			"output URL is not a Supabase storage URL: %s",
			outputURL,
		)
	}

	remainder := strings.TrimPrefix(
		u.Path[idx+len(marker):],
		"/",
	)

	parts := strings.SplitN(remainder, "/", 2)
	if len(parts) != 2 {
		return "", fmt.Errorf(
			"cannot extract bucket/object from output URL",
		)
	}

	// parts[0] can be "public", "sign", etc.
	// Find the bucket name in the remaining path.
	remaining := remainder

	for _, mode := range []string{"public", "sign", "authenticated"} {
		prefix := mode + "/" + bucket + "/"

		if strings.HasPrefix(remaining, prefix) {
			key := strings.TrimPrefix(remaining, prefix)

			if key == "" {
				return "", fmt.Errorf("empty object key")
			}

			return key, nil
		}
	}

	return "", fmt.Errorf(
		"bucket %q not found in output URL path %q",
		bucket,
		u.Path,
	)
}

func (h *ClipHandler) ApproveClip(c *gin.Context) {
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
	clip, err := h.clipRepo.FindByID(c.Request.Context(), id)
	if err != nil || clip == nil || clip.UserID != userID {
		response.NotFound(c, "clip")
		return
	}

	if err := h.clipRepo.UpdateStatus(c.Request.Context(), id, models.ClipStatusDetected); err != nil {
		response.InternalError(c)
		return
	}

	if err := h.clipRepo.UpdateFields(c.Request.Context(), id, map[string]any{
		"status":     "approved",
		"approvedAt": time.Now(),
		"updatedAt":  time.Now(),
	}); err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{
		"clipId":  c.Param("id"),
		"status":  "approved",
		"message": "clip approved and ready for export",
	})
}

func (h *ClipHandler) RejectClip(c *gin.Context) {
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
	clip, err := h.clipRepo.FindByID(c.Request.Context(), id)
	if err != nil || clip == nil || clip.UserID != userID {
		response.NotFound(c, "clip")
		return
	}

	if err := h.clipRepo.UpdateFields(c.Request.Context(), id, map[string]any{
		"status":     "rejected",
		"rejectedAt": time.Now(),
		"updatedAt":  time.Now(),
	}); err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{
		"clipId":  c.Param("id"),
		"status":  "rejected",
		"message": "clip rejected and archived",
	})
}

func (h *ClipHandler) ListPendingClips(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	userID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	clips, err := h.clipRepo.FindByStatus(c.Request.Context(), userID, "detected")
	if err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{
		"clips": clips,
		"count": len(clips),
	})
}

func (h *ClipHandler) ListApprovedClips(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	userID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}

	clips, err := h.clipRepo.FindByStatus(c.Request.Context(), userID, "approved")
	if err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{
		"clips": clips,
		"count": len(clips),
	})
}
