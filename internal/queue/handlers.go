package queue

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
	"github.com/rs/zerolog"
)

type TaskHandlers struct {
	log zerolog.Logger
}

func NewTaskHandlers(log zerolog.Logger) *TaskHandlers {
	return &TaskHandlers{log: log}
}

func (h *TaskHandlers) HandleProcessVideo(ctx context.Context, t *asynq.Task) error {
	var p ProcessVideoPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("decode payload: %w", err)
	}

	h.log.Info().
		Str("videoId", p.VideoID).
		Str("userId", p.UserID).
		Msg("video job received — pipeline starts in phase 3")

	return nil
}