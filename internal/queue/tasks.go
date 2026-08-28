package queue

import (
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
)

const (
	TypeProcessVideo = "video:process"
	TypeExportClip   = "clip:export"
)

type ProcessVideoPayload struct {
	VideoID string `json:"videoId"`
	UserID  string `json:"userId"`
}

type ExportClipPayload struct {
	ClipID string `json:"clipId"`
	UserID string `json:"userId"`
}

func NewProcessVideoTask(videoID, userID string) (*asynq.Task, error) {
	payload, err := json.Marshal(ProcessVideoPayload{
		VideoID: videoID,
		UserID:  userID,
	})
	if err != nil {
		return nil, fmt.Errorf("marshal ProcessVideoPayload: %w", err)
	}
	return asynq.NewTask(TypeProcessVideo, payload), nil
}

func NewExportClipTask(clipID, userID string) (*asynq.Task, error) {
	payload, err := json.Marshal(ExportClipPayload{
		ClipID: clipID,
		UserID: userID,
	})
	if err != nil {
		return nil, fmt.Errorf("marshal ExportClipPayload: %w", err)
	}
	return asynq.NewTask(TypeExportClip, payload), nil
}