package database

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisClient struct {
	*redis.Client
}

func NewRedis(url string) (*RedisClient, error) {
	// Parse Redis connection URL.
	opts, err := redis.ParseURL(url)
	if err != nil {
		return nil, fmt.Errorf("redis.ParseURL: %w", err)
	}

	// Connection pool configuration.
	opts.PoolSize = 10
	opts.MinIdleConns = 2

	// Connection timeouts.
	opts.DialTimeout = 5 * time.Second
	opts.ReadTimeout = 3 * time.Second
	opts.WriteTimeout = 3 * time.Second

	// Create Redis client.
	client := redis.NewClient(opts)

	// Test Redis connection.
	ctx, cancel := context.WithTimeout(
		context.Background(),
		5*time.Second,
	)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		_ = client.Close()
		return nil, fmt.Errorf("redis.Ping: %w", err)
	}

	return &RedisClient{
		Client: client,
	}, nil
}

func (r *RedisClient) Ping(ctx context.Context) error {
	return r.Client.Ping(ctx).Err()
}

func (r *RedisClient) Close() error {
	return r.Client.Close()
}
