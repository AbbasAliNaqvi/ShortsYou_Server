package handler

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/aitools"
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
	clipRepo       *repository.ClipRepository
	videoRepo      *repository.VideoRepository
	transcriptRepo *repository.TranscriptRepository
	queue          *queue.Client
	supabase       *storage.SupabaseClient
	aiTools        *aitools.Engine
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
	transcriptRepo *repository.TranscriptRepository,
	queueClient *queue.Client,
	supabase *storage.SupabaseClient,
	aiTools *aitools.Engine,
) *ClipHandler {
	return &ClipHandler{
		clipRepo:       clipRepo,
		videoRepo:      videoRepo,
		transcriptRepo: transcriptRepo,
		queue:          queueClient,
		supabase:       supabase,
		aiTools:        aiTools,
	}
}

func (h *ClipHandler) ListClips(c *gin.Context) {
	userID, ok := authenticatedUserID(c)
	if !ok {
		response.Unauthorized(c)
		return
	}

	limit, skip, valid := pagination(c)
	if !valid {
		response.BadRequest(c, "page must be >= 1 and limit must be between 1 and 100")
		return
	}
	clips, err := h.clipRepo.FindByUserID(
		c.Request.Context(),
		userID,
		limit,
		skip,
	)
	if err != nil {
		response.InternalError(c)
		return
	}

	if clips == nil {
		clips = []models.Clip{}
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

func (h *ClipHandler) DeleteClip(c *gin.Context) {
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
	deleted, err := h.clipRepo.DeleteByIDAndUserID(c.Request.Context(), id, userID)
	if err != nil {
		response.InternalError(c)
		return
	}
	if !deleted {
		response.NotFound(c, "clip")
		return
	}
	response.OK(c, gin.H{"clipId": id.Hex(), "message": "clip removed"})
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

	if req.Status != nil && *req.Status != "" {
		newStatus := models.ClipStatus(*req.Status)
		if !isValidClipStatus(newStatus) || !isValidStatusTransition(clip.Status, newStatus) {
			response.BadRequest(c, "invalid clip status transition")
			return
		}
		if err := h.clipRepo.UpdateStatus(c.Request.Context(), id, newStatus); err != nil {
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

	// Ownership check
	if clip.UserID != userID {
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

	task, err := queue.NewExportClipTask(clipIDStr, userID.Hex())
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

	// Local renderer URLs are already directly downloadable. Parse the URL rather
	// than slicing it: http and https have different offsets and malformed values
	// previously could panic here.
	outputURL, parseErr := url.Parse(clip.SupabaseShortURL)
	if parseErr == nil && (outputURL.Hostname() == "127.0.0.1" || outputURL.Hostname() == "localhost") {
		response.OK(c, gin.H{
			"clipId":      clipIDStr,
			"downloadUrl": clip.SupabaseShortURL,
			"expiresIn":   3600,
		})
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
		// Fallback to providing the raw URL if signed generation fails (e.g., DNS error)
		response.OK(c, gin.H{
			"clipId":      clipIDStr,
			"downloadUrl": clip.SupabaseShortURL,
			"expiresIn":   3600,
		})
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

	if !isValidStatusTransition(clip.Status, models.ClipStatusDetected) {
		response.BadRequest(c, "clip cannot be approved from its current status")
		return
	}
	if err := h.clipRepo.UpdateStatus(c.Request.Context(), id, models.ClipStatusDetected); err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{
		"clipId":  c.Param("id"),
		"status":  string(models.ClipStatusDetected),
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

	if !isValidStatusTransition(clip.Status, models.ClipStatusRejected) {
		response.BadRequest(c, "clip cannot be rejected from its current status")
		return
	}
	if err := h.clipRepo.UpdateStatus(c.Request.Context(), id, models.ClipStatusRejected); err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{
		"clipId":  c.Param("id"),
		"status":  string(models.ClipStatusRejected),
		"message": "clip rejected and archived",
	})
}

func (h *ClipHandler) ListPendingClips(c *gin.Context) {
	userID, ok := authenticatedUserID(c)
	if !ok {
		response.Unauthorized(c)
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
	userID, ok := authenticatedUserID(c)
	if !ok {
		response.Unauthorized(c)
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

type DailyReelItem struct {
	ID              string              `json:"id"`
	VideoID         string              `json:"videoId"`
	VideoTitle      string              `json:"videoTitle"`
	ThumbnailURL    string              `json:"thumbnailUrl"`
	StartTime       float64             `json:"startTime"`
	EndTime         float64             `json:"endTime"`
	DurationSeconds float64             `json:"durationSeconds"`
	HookText        string              `json:"hookText"`
	ViralScore      float64             `json:"viralScore"`
	Category        models.ClipCategory `json:"category"`
	Status          models.ClipStatus   `json:"status"`
	Reasoning       string              `json:"reasoning"`
	PlayableURL     string              `json:"playableUrl,omitempty"`
}

// GET /api/v1/clips/daily-reels
func (h *ClipHandler) GetDailyReels(c *gin.Context) {
	userID, ok := authenticatedUserID(c)
	if !ok {
		response.Unauthorized(c)
		return
	}

	ctx := c.Request.Context()
	clips, err := h.clipRepo.FindByUserID(ctx, userID, 100, 0)
	if err != nil {
		clips = []models.Clip{}
	}

	// Sort clips by ViralScore descending
	userClips := make([]models.Clip, len(clips))
	copy(userClips, clips)
	for i := 0; i < len(userClips)-1; i++ {
		for j := i + 1; j < len(userClips); j++ {
			if userClips[j].ViralScore > userClips[i].ViralScore {
				userClips[i], userClips[j] = userClips[j], userClips[i]
			}
		}
	}

	// Load user videos for title & thumbnail resolution
	videos, _ := h.videoRepo.FindByUserID(ctx, userID, 50, 0)
	videoMap := make(map[string]models.Video)
	for _, v := range videos {
		videoMap[v.ID.Hex()] = v
	}

	daily := make([]DailyReelItem, 0, 5)

	for _, clip := range userClips {
		if len(daily) >= 5 {
			break
		}
		v := videoMap[clip.VideoID.Hex()]
		title := v.Title
		if title == "" {
			title = "Viral Short Candidate"
		}
		thumb := clip.SelectedThumbnail
		if thumb == "" && len(clip.ThumbnailOptions) > 0 {
			thumb = clip.ThumbnailOptions[0]
		}
		if thumb == "" {
			thumb = v.ThumbnailURL
		}

		hook := clip.SelectedHook
		if hook == "" || hook == "Your strongest moment starts here" {
			hook = clip.OriginalHook
		}
		if hook == "" {
			hook = title
		}

		reason := fmt.Sprintf("High viral potential with %.1f retention score.", clip.ViralScore*100)
		if clip.Scores.Emotion > 0.75 {
			reason = "Strong emotional peak and curiosity-inducing hook."
		}

		daily = append(daily, DailyReelItem{
			ID:              clip.ID.Hex(),
			VideoID:         clip.VideoID.Hex(),
			VideoTitle:      title,
			ThumbnailURL:    thumb,
			StartTime:       clip.StartTime,
			EndTime:         clip.EndTime,
			DurationSeconds: clip.DurationSeconds,
			HookText:        hook,
			ViralScore:      clip.ViralScore,
			Category:        clip.Category,
			Status:          clip.Status,
			Reasoning:       reason,
			PlayableURL:     clip.SupabaseShortURL,
		})
	}

	// If fewer than 5 clips exist, auto-synthesize recommendations from user videos
	if len(daily) < 5 && len(videos) > 0 {
		for _, v := range videos {
			if len(daily) >= 5 {
				break
			}
			// Check if video already in daily
			alreadyIn := false
			for _, item := range daily {
				if item.VideoID == v.ID.Hex() {
					alreadyIn = true
					break
				}
			}
			if alreadyIn {
				continue
			}

			maxDur := 30.0
			if v.DurationSeconds > 0 && float64(v.DurationSeconds) < maxDur {
				maxDur = float64(v.DurationSeconds)
			}

			daily = append(daily, DailyReelItem{
				ID:              primitive.NewObjectID().Hex(),
				VideoID:         v.ID.Hex(),
				VideoTitle:      v.Title,
				ThumbnailURL:    v.ThumbnailURL,
				StartTime:       0.0,
				EndTime:         maxDur,
				DurationSeconds: maxDur,
				HookText:        v.Title,
				ViralScore:      0.92,
				Category:        models.CategoryViral,
				Status:          models.ClipStatusDetected,
				Reasoning:       "AI Agent recommended from your uploaded footage.",
			})
		}
	}

	response.OK(c, daily)
}

type autoComposeRequest struct {
	VideoID string `json:"videoId" binding:"required"`
}

// POST /api/v1/editor/auto-compose
func (h *ClipHandler) AutoCompose(c *gin.Context) {
	userID, ok := authenticatedUserID(c)
	if !ok {
		response.Unauthorized(c)
		return
	}

	var req autoComposeRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.VideoID == "" {
		response.BadRequest(c, "videoId is required")
		return
	}

	videoOID, err := primitive.ObjectIDFromHex(req.VideoID)
	if err != nil {
		response.BadRequest(c, "invalid videoId")
		return
	}

	video, err := h.videoRepo.FindByIDAndUserID(c.Request.Context(), videoOID, userID)
	if err != nil || video == nil {
		response.NotFound(c, "video")
		return
	}

	// Load transcript if available
	snippet := ""
	if h.transcriptRepo != nil {
		t, _ := h.transcriptRepo.FindByVideoID(c.Request.Context(), video.ID.Hex())
		if t != nil && len(t.Segments) > 0 {
			var b strings.Builder
			for i, s := range t.Segments {
				if i >= 15 {
					break
				}
				b.WriteString(s.Text)
				b.WriteString(" ")
			}
			snippet = b.String()
		}
	}

	if snippet == "" {
		snippet = video.Description
	}

	res := h.aiTools.AutoComposeClip(
		c.Request.Context(),
		video.Title,
		snippet,
		float64(video.DurationSeconds),
	)

	response.OK(c, res)
}

type generateHooksRequest struct {
	VideoID  string `json:"videoId"`
	ClipText string `json:"clipText"`
	Tone     string `json:"tone"`
}

// POST /api/v1/editor/generate-hooks
func (h *ClipHandler) GenerateHooks(c *gin.Context) {
	userID, ok := authenticatedUserID(c)
	if !ok {
		response.Unauthorized(c)
		return
	}

	var req generateHooksRequest
	_ = c.ShouldBindJSON(&req)

	title := ""
	if req.VideoID != "" {
		if vID, err := primitive.ObjectIDFromHex(req.VideoID); err == nil {
			if v, err := h.videoRepo.FindByIDAndUserID(c.Request.Context(), vID, userID); err == nil && v != nil {
				title = v.Title
			}
		}
	}

	vars := h.aiTools.GenerateViralHookVariations(c.Request.Context(), title, req.ClipText)
	response.OK(c, vars)
}
