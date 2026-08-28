package queue

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hibiken/asynq"
)

const (
	TypeProcessVideo     = "video:process"
	TypeExportClip       = "clip:export"
	TypeCollectAnalytics = "clip:collect_analytics"
	TypeRetrainCPEP      = "user:retrain_cpep"
)

type ProcessVideoPayload struct {
	VideoID string `json:"videoId"`
	UserID  string `json:"userId"`
}

type ExportClipPayload struct {
	ClipID string `json:"clipId"`
	UserID string `json:"userId"`
}

type CollectAnalyticsPayload struct {
	ClipID         string `json:"clipId"`
	UserID         string `json:"userId"`
	YouTubeVideoID string `json:"youtubeVideoId"`
}

type RetrainCPEPPayload struct {
	UserID string `json:"userId"`
}

func NewProcessVideoTask(videoID, userID string) (*asynq.Task, error) {
	payload, err := json.Marshal(ProcessVideoPayload{VideoID: videoID, UserID: userID})
	if err != nil {
		return nil, fmt.Errorf("marshal ProcessVideoPayload: %w", err)
	}
	return asynq.NewTask(TypeProcessVideo, payload), nil
}

func NewExportClipTask(clipID, userID string) (*asynq.Task, error) {
	payload, err := json.Marshal(ExportClipPayload{ClipID: clipID, UserID: userID})
	if err != nil {
		return nil, fmt.Errorf("marshal ExportClipPayload: %w", err)
	}
	return asynq.NewTask(TypeExportClip, payload), nil
}

func NewCollectAnalyticsTask(clipID, userID, youtubeVideoID string) (*asynq.Task, error) {
	payload, err := json.Marshal(CollectAnalyticsPayload{
		ClipID:         clipID,
		UserID:         userID,
		YouTubeVideoID: youtubeVideoID,
	})
	if err != nil {
		return nil, fmt.Errorf("marshal CollectAnalyticsPayload: %w", err)
	}
	return asynq.NewTask(TypeCollectAnalytics, payload,
		asynq.ProcessIn(48*time.Hour),
		asynq.MaxRetry(3),
	), nil
}

func NewRetrainCPEPTask(userID string) (*asynq.Task, error) {
	payload, err := json.Marshal(RetrainCPEPPayload{UserID: userID})
	if err != nil {
		return nil, fmt.Errorf("marshal RetrainCPEPPayload: %w", err)
	}
	return asynq.NewTask(TypeRetrainCPEP, payload), nil
}