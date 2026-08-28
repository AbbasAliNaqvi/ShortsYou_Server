package queue

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
	"github.com/rs/zerolog"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/models"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/repository"
)

type TaskHandlers struct {
	log       zerolog.Logger
	videoRepo *repository.VideoRepository
}

func NewTaskHandlers(
	log zerolog.Logger,
	videoRepo *repository.VideoRepository,
) *TaskHandlers {
	return &TaskHandlers{
		log:       log,
		videoRepo: videoRepo,
	}
}

// HandleProcessVideo handles the asynchronous video-processing pipeline.
//
// For now this implements the pipeline/state-machine foundation:
// pending -> downloading -> transcribing -> analyzing -> completed.
//
// The actual downloader/transcription/AI analysis can be plugged into
// these phases as those components are implemented.
func (h *TaskHandlers) HandleProcessVideo(
	ctx context.Context,
	t *asynq.Task,
) error {
	var p ProcessVideoPayload

	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("decode payload: %w", err)
	}

	if p.VideoID == "" {
		return fmt.Errorf("missing videoId in task payload")
	}

	if p.UserID == "" {
		return fmt.Errorf("missing userId in task payload")
	}

	videoID, err := primitive.ObjectIDFromHex(p.VideoID)
	if err != nil {
		return fmt.Errorf("invalid videoId %q: %w", p.VideoID, err)
	}

	userID, err := primitive.ObjectIDFromHex(p.UserID)
	if err != nil {
		return fmt.Errorf("invalid userId %q: %w", p.UserID, err)
	}

	h.log.Info().
		Str("videoId", p.VideoID).
		Str("userId", p.UserID).
		Msg("video job received")

	// Make sure the video belongs to the user that owns the task.
	video, err := h.videoRepo.FindByID(ctx, videoID)
	if err != nil {
		return fmt.Errorf("find video: %w", err)
	}

	if video.UserID != userID {
		return fmt.Errorf(
			"video %s does not belong to user %s",
			p.VideoID,
			p.UserID,
		)
	}

	// ------------------------------------------------------------
	// Phase 1: Downloading
	// ------------------------------------------------------------

	if err := h.videoRepo.UpdateStatus(
		ctx,
		videoID,
		models.StatusDownloading,
		"",
	); err != nil {
		return fmt.Errorf("set downloading status: %w", err)
	}

	h.log.Info().
		Str("videoId", p.VideoID).
		Msg("video processing phase: downloading")

	// TODO:
	// Download the source video here.
	//
	// Example future flow:
	//
	// sourcePath, err := downloader.Download(ctx, video.YouTubeVideoID)
	// if err != nil {
	//     _ = h.videoRepo.UpdateStatus(
	//         ctx,
	//         videoID,
	//         models.StatusFailed,
	//         err.Error(),
	//     )
	//     return fmt.Errorf("download video: %w", err)
	// }

	// ------------------------------------------------------------
	// Phase 2: Transcribing
	// ------------------------------------------------------------

	if err := h.videoRepo.UpdateStatus(
		ctx,
		videoID,
		models.StatusTranscribing,
		"",
	); err != nil {
		return fmt.Errorf("set transcribing status: %w", err)
	}

	h.log.Info().
		Str("videoId", p.VideoID).
		Msg("video processing phase: transcribing")

	// TODO:
	// Run speech-to-text here.
	//
	// transcript, err := transcriber.Transcribe(ctx, sourcePath)
	// if err != nil {
	//     _ = h.videoRepo.UpdateStatus(
	//         ctx,
	//         videoID,
	//         models.StatusFailed,
	//         err.Error(),
	//     )
	//     return fmt.Errorf("transcribe video: %w", err)
	// }

	// ------------------------------------------------------------
	// Phase 3: Analyzing
	// ------------------------------------------------------------

	if err := h.videoRepo.UpdateStatus(
		ctx,
		videoID,
		models.StatusAnalyzing,
		"",
	); err != nil {
		return fmt.Errorf("set analyzing status: %w", err)
	}

	h.log.Info().
		Str("videoId", p.VideoID).
		Msg("video processing phase: analyzing")

	// TODO:
	// Run AI analysis here.
	//
	// clips, err := analyzer.FindClips(ctx, transcript)
	// if err != nil {
	//     _ = h.videoRepo.UpdateStatus(
	//         ctx,
	//         videoID,
	//         models.StatusFailed,
	//         err.Error(),
	//     )
	//     return fmt.Errorf("analyze video: %w", err)
	// }
	//
	// h.videoRepo.UpdateClipsDetected(ctx, videoID, len(clips))

	// ------------------------------------------------------------
	// Phase 4: Completed
	// ------------------------------------------------------------

	if err := h.videoRepo.UpdateStatus(
		ctx,
		videoID,
		models.StatusCompleted,
		"",
	); err != nil {
		return fmt.Errorf("set completed status: %w", err)
	}

	h.log.Info().
		Str("videoId", p.VideoID).
		Msg("video processing completed")

	return nil
}
