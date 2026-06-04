package database

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

type MongoDB struct {
	Client *mongo.Client
	DB    *mongo.Database
}

func NewMongoDB(uri, dbName string) (*MongoDB, error) {

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	opts := options.Client().
		ApplyURI(uri).
		SetServerSelectionTimeout(10 * time.Second).
		SetConnectTimeout(10 * time.Second).
		SetMaxPoolSize(100).
		SetMinPoolSize(5)

	client, err := mongo.Connect(ctx, opts)
	if err != nil {
		return nil, fmt.Errorf("MONGO.CONNECT: %w",err)
	}

	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		_ = client.Disconnect(context.Background())
		return nil, fmt.Errorf("MONGO.PING: %w",err)
	}

	return &MongoDB{
		Client: client,
		DB:    client.Database(dbName),
	}, nil
}

func (m *MongoDB) Collection(name string) *mongo.Collection {
	return m.DB.Collection(name)
}

func (m *MongoDB) Ping(ctx context.Context) error {
	return m.Client.Ping(ctx, readpref.Primary())
}

func (m *MongoDB) Disconnect(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(context.Background(),5*time.Second)
	defer cancel()
	return m.Client.Disconnect(ctx)
}

func (m *MongoDB) CreateIndexes(ctx context.Context) error {
	type spec struct {
		collection string
		model      mongo.IndexModel
	}

	indexes := []spec{
		{
			collection: "users",
			model: mongo.IndexModel{
				Keys:    bson.D{{Key: "email", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
		},
		{
			collection: "users",
			model: mongo.IndexModel{
				Keys:    bson.D{{Key: "googleId", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
		},
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
			collection: "feature_matrix",
			model: mongo.IndexModel{
				Keys:    bson.D{{Key: "clipId", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
		},
	}

	for _, idx := range indexes {
		coll := m.DB.Collection(idx.collection)
		if _, err := coll.Indexes().CreateOne(ctx, idx.model); err != nil {
			return fmt.Errorf("index on %s: %w", idx.collection, err)
		}
	}

	return nil
}