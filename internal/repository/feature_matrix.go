package repository

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/database"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/models"
)

type FeatureMatrixRepository struct {
	col *mongo.Collection
}

func NewFeatureMatrixRepository(db *database.MongoDB) *FeatureMatrixRepository {
	return &FeatureMatrixRepository{col: db.Collection("feature_matrix")}
}

func (r *FeatureMatrixRepository) BulkInsert(ctx context.Context, rows []models.FeatureMatrix) error {
	if len(rows) == 0 {
		return nil
	}
	now := time.Now()
	docs := make([]any, len(rows))
	for i := range rows {
		rows[i].CreatedAt = now
		docs[i] = rows[i]
	}
	_, err := r.col.InsertMany(ctx, docs)
	if err != nil {
		return fmt.Errorf("FeatureMatrix.BulkInsert: %w", err)
	}
	return nil
}

func (r *FeatureMatrixRepository) UpdatePerformanceLabels(
	ctx context.Context,
	clipID primitive.ObjectID,
	views int64,
	ctr, avgWatchTime float64,
	band string,
) error {
	now := time.Now()
	_, err := r.col.UpdateOne(
		ctx,
		bson.M{"clipId": clipID},
		bson.M{"$set": bson.M{
			"views48h":               views,
			"ctr48h":                 ctr,
			"avgWatchTimeSec":        avgWatchTime,
			"performanceBand":        band,
			"performanceCollectedAt": now,
		}},
	)
	if err != nil {
		return fmt.Errorf("UpdatePerformanceLabels: %w", err)
	}
	return nil
}

func (r *FeatureMatrixRepository) CountLabeledForUser(ctx context.Context, userID primitive.ObjectID) (int64, error) {
	n, err := r.col.CountDocuments(ctx, bson.M{
		"userId":          userID,
		"performanceBand": bson.M{"$exists": true, "$ne": ""},
	})
	if err != nil {
		return 0, fmt.Errorf("CountLabeledForUser: %w", err)
	}
	return n, nil
}

func (r *FeatureMatrixRepository) FindLabeledByUserID(ctx context.Context, userID primitive.ObjectID) ([]models.FeatureMatrix, error) {
	cursor, err := r.col.Find(ctx, bson.M{
		"userId":          userID,
		"performanceBand": bson.M{"$exists": true, "$ne": ""},
	})
	if err != nil {
		return nil, fmt.Errorf("FindLabeledByUserID: %w", err)
	}
	defer cursor.Close(ctx)

	var rows []models.FeatureMatrix
	if err := cursor.All(ctx, &rows); err != nil {
		return nil, fmt.Errorf("decode: %w", err)
	}
	return rows, nil
}