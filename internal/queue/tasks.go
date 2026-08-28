package queue

import (
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
)

const (
	TypeProcessVideo = "video:process"
)

type ProcessVideoPayload struct {
	VideoID string `json:"videoId"`
	UserID  string `json:"userId"`
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