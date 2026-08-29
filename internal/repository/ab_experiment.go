package repository

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/database"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/models"
)

type ABExperimentRepository struct {
	col *mongo.Collection
}

func NewABExperimentRepository(db *database.MongoDB) *ABExperimentRepository {
	return &ABExperimentRepository{col: db.Collection("ab_experiments")}
}

func (r *ABExperimentRepository) Insert(ctx context.Context, exp models.ABExperiment) (*models.ABExperiment, error) {
	exp.CreatedAt = time.Now()
	exp.Status = "pending"
	result, err := r.col.InsertOne(ctx, exp)
	if err != nil {
		return nil, fmt.Errorf("Insert: %w", err)
	}
	exp.ID = result.InsertedID.(primitive.ObjectID)
	return &exp, nil
}

func (r *ABExperimentRepository) FindByUserID(ctx context.Context, userID primitive.ObjectID) ([]models.ABExperiment, error) {
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cursor, err := r.col.Find(ctx, bson.M{"userId": userID}, opts)
	if err != nil {
		return nil, fmt.Errorf("FindByUserID: %w", err)
	}
	defer cursor.Close(ctx)

	var exps []models.ABExperiment
	if err := cursor.All(ctx, &exps); err != nil {
		return nil, fmt.Errorf("decode: %w", err)
	}
	return exps, nil
}

func (r *ABExperimentRepository) UpdateResults(
	ctx context.Context,
	id primitive.ObjectID,
	origCTR, genCTR float64,
	nOrig, nGen int,
	tStat float64,
	isSignificant bool,
	liftPct float64,
) error {
	now := time.Now()
	_, err := r.col.UpdateByID(ctx, id, bson.M{
		"$set": bson.M{
			"originalCtr":   origCTR,
			"generatedCtr":  genCTR,
			"nOriginal":     nOrig,
			"nGenerated":    nGen,
			"tStatistic":    tStat,
			"isSignificant": isSignificant,
			"liftPercent":   liftPct,
			"status":        "completed",
			"completedAt":   now,
		},
	})
	if err != nil {
		return fmt.Errorf("UpdateResults: %w", err)
	}
	return nil
}
