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

// Ping verifies that MongoDB is reachable.
func (m *MongoDB) Ping(ctx context.Context) error {
	if m == nil || m.Client == nil {
		return fmt.Errorf("mongodb client is nil")
	}

	return m.Client.Ping(ctx, nil)
}

// CreateIndexes creates all application indexes.
func (m *MongoDB) CreateIndexes(ctx context.Context) error {
	type spec struct {
		collection string
		model      mongo.IndexModel
	}

	indexes := []spec{
		// users
		{
			collection: "users",
			model: mongo.IndexModel{
				Keys: bson.D{{Key: "email", Value: 1}},
				Options: options.Index().
					SetUnique(true).
					SetName("email_1"),
			},
		},
		{
			collection: "users",
			model: mongo.IndexModel{
				Keys: bson.D{{Key: "googleId", Value: 1}},
				Options: options.Index().
					SetUnique(true).
					SetName("uniq_google_id"),
			},
		},

		// videos
		{
			collection: "videos",
			model: mongo.IndexModel{
				Keys:    bson.D{{Key: "youtubeVideoId", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
		},
		{
			collection: "videos",
			model: mongo.IndexModel{
				Keys: bson.D{
					{Key: "userId", Value: 1},
					{Key: "createdAt", Value: -1},
				},
			},
		},
		{
			collection: "videos",
			model: mongo.IndexModel{
				Keys: bson.D{
					{Key: "userId", Value: 1},
					{Key: "youtubeVideoId", Value: 1},
				},
				Options: options.Index().
					SetUnique(true).
					SetName("uniq_user_youtube_video"),
			},
		},
		{
			collection: "videos",
			model: mongo.IndexModel{
				Keys: bson.D{
					{Key: "userId", Value: 1},
					{Key: "processingStatus", Value: 1},
				},
				Options: options.Index().
					SetName("user_processing_status_idx"),
			},
		},

		// clips
		{
			collection: "clips",
			model: mongo.IndexModel{
				Keys: bson.D{
					{Key: "videoId", Value: 1},
					{Key: "viralScore", Value: -1},
				},
			},
		},
		{
			collection: "clips",
			model: mongo.IndexModel{
				Keys: bson.D{
					{Key: "userId", Value: 1},
					{Key: "status", Value: 1},
				},
			},
		},
		{
			collection: "clips",
			model: mongo.IndexModel{
				Keys: bson.D{
					{Key: "userId", Value: 1},
					{Key: "viralScore", Value: -1},
				},
			},
		},

		// feature_matrix
		{
			collection: "feature_matrix",
			model: mongo.IndexModel{
				Keys:    bson.D{{Key: "clipId", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
		},
		{
			collection: "feature_matrix",
			model: mongo.IndexModel{
				Keys: bson.D{
					{Key: "userId", Value: 1},
					{Key: "performanceBand", Value: 1},
				},
			},
		},

		// creator_dna
		{
			collection: "creator_dna",
			model: mongo.IndexModel{
				Keys:    bson.D{{Key: "userId", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
		},

		// audience_personas
		{
			collection: "audience_personas",
			model: mongo.IndexModel{
				Keys:    bson.D{{Key: "userId", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
		},

		// trend_forecasts
		{
			collection: "trend_forecasts",
			model: mongo.IndexModel{
				Keys: bson.D{
					{Key: "userId", Value: 1},
					{Key: "topic", Value: 1},
				},
				Options: options.Index().SetUnique(true),
			},
		},
		{
			collection: "trend_forecasts",
			model: mongo.IndexModel{
				Keys: bson.D{
					{Key: "userId", Value: 1},
					{Key: "peakPredictionDate", Value: 1},
				},
			},
		},

		// ab_experiments
		{
			collection: "ab_experiments",
			model: mongo.IndexModel{
				Keys: bson.D{
					{Key: "userId", Value: 1},
					{Key: "createdAt", Value: -1},
				},
			},
		},
		{
			collection: "ab_experiments",
			model: mongo.IndexModel{
				Keys: bson.D{{Key: "clipId", Value: 1}},
			},
		},
	}

	for _, idx := range indexes {
		coll := m.DB.Collection(idx.collection)
		if _, err := coll.Indexes().CreateOne(ctx, idx.model); err != nil {
			return fmt.Errorf("create index on %s: %w", idx.collection, err)
		}
	}

	return nil
}
