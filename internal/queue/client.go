package queue

import (
	"fmt"

	"github.com/hibiken/asynq"
)

type Client struct {
	inner *asynq.Client
}

func NewClient(redisURL string) (*Client, error) {
	opt, err := asynq.ParseRedisURI(redisURL)
	if err != nil {
		return nil, fmt.Errorf("queue.NewClient: %w", err)
	}
	return &Client{inner: asynq.NewClient(opt)}, nil
}

func (c *Client) Enqueue(task *asynq.Task, opts ...asynq.Option) error {
	_, err := c.inner.Enqueue(task, opts...)
	if err != nil {
		return fmt.Errorf("enqueue %s: %w", task.Type(), err)
	}
	return nil
}

func (c *Client) Close() error {
	return c.inner.Close()
}

func (c *Client) EnqueueForce(task *asynq.Task, opts ...asynq.Option) error {
	_, err := c.inner.Enqueue(task, opts...)
	return err
}