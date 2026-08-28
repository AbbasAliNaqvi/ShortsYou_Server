package queue

import (
	"fmt"

	"github.com/hibiken/asynq"
	"github.com/rs/zerolog"
)

type Worker struct {
	server *asynq.Server
	mux    *asynq.ServeMux
	log    zerolog.Logger
}

func NewWorker(redisURL string, log zerolog.Logger) (*Worker, error) {
	opt, err := asynq.ParseRedisURI(redisURL)
	if err != nil {
		return nil, fmt.Errorf("queue.NewWorker: %w", err)
	}

	srv := asynq.NewServer(opt, asynq.Config{
		Concurrency: 5,
		// Priority queues — critical jobs jump the line.
		Queues: map[string]int{
			"critical": 6,
			"default":  3,
			"low":      1,
		},
	})

	return &Worker{
		server: srv,
		mux:    asynq.NewServeMux(),
		log:    log,
	}, nil
}

func (w *Worker) Register(taskType string, fn asynq.HandlerFunc) {
	w.mux.HandleFunc(taskType, fn)
}

func (w *Worker) Start() error {
	if err := w.server.Start(w.mux); err != nil {
		return fmt.Errorf("worker.Start: %w", err)
	}
	return nil
}

func (w *Worker) Stop() {
	w.server.Shutdown()
}