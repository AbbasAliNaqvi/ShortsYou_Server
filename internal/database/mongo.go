package database

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoDB struct {
	Client *mongo.Client
	DB     *mongo.Database
}

// NewMongo connects to MongoDB and verifies the connection.
func NewMongo(uri, dbName string) (*MongoDB, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(
		ctx,
		options.Client().ApplyURI(uri),
	)
	if err != nil {
		return nil, fmt.Errorf("connect mongodb: %w", err)
	}

	if err := client.Ping(ctx, nil); err != nil {
		_ = client.Disconnect(context.Background())
		return nil, fmt.Errorf("ping mongodb: %w", err)
	}

	return &MongoDB{
		Client: client,
		DB:     client.Database(dbName),
	}, nil
}

// Disconnect closes the MongoDB connection.
func (m *MongoDB) Disconnect() error {
	if m == nil || m.Client == nil {
		return nil
	}

	ctx, cancel := context.WithTimeout(
		context.Background(),
		10*time.Second,
	)
	defer cancel()

	return m.Client.Disconnect(ctx)
}

// Collection returns a MongoDB collection.
func (m *MongoDB) Collection(name string) *mongo.Collection {
	return m.DB.Collection(name)
}

// CreateIndexes creates all application indexes.
func (m *MongoDB) CreateIndexes(ctx context.Context) error {
	// Users
	users := m.Collection("users")

	_, err := users.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "googleId", Value: 1},
			},
			Options: options.Index().
				SetUnique(true).
				SetName("uniq_google_id"),
		},
		{
			Keys: bson.D{
				{Key: "email", Value: 1},
			},
			Options: options.Index().
				SetName("email_idx"),
		},
	})
	if err != nil {
		return fmt.Errorf("create users indexes: %w", err)
	}

	// Videos
	videos := m.Collection("videos")

	_, err = videos.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "userId", Value: 1},
				{Key: "youtubeVideoId", Value: 1},
			},
			Options: options.Index().
				SetUnique(true).
				SetName("uniq_user_youtube_video"),
		},
		{
			Keys: bson.D{
				{Key: "userId", Value: 1},
				{Key: "publishedAt", Value: -1},
			},
			Options: options.Index().
				SetName("user_published_idx"),
		},
		{
			Keys: bson.D{
				{Key: "userId", Value: 1},
				{Key: "processingStatus", Value: 1},
			},
			Options: options.Index().
				SetName("user_processing_status_idx"),
		},
	})

	if err != nil {
		return fmt.Errorf("create videos indexes: %w", err)
	}

	return nil
}