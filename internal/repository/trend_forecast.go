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

type TrendForecastRepository struct {
	col *mongo.Collection
}

func NewTrendForecastRepository(db *database.MongoDB) *TrendForecastRepository {
	return &TrendForecastRepository{col: db.Collection("trend_forecasts")}
}

func (r *TrendForecastRepository) FindByUserID(ctx context.Context, userID primitive.ObjectID) ([]models.TrendForecast, error) {
	opts := options.Find().SetSort(bson.D{{Key: "peakPredictionDate", Value: 1}})
	cursor, err := r.col.Find(ctx, bson.M{"userId": userID}, opts)
	if err != nil {
		return nil, fmt.Errorf("FindByUserID: %w", err)
	}
	defer cursor.Close(ctx)

	var forecasts []models.TrendForecast
	if err := cursor.All(ctx, &forecasts); err != nil {
		return nil, fmt.Errorf("decode: %w", err)
	}
	return forecasts, nil
}

func (r *TrendForecastRepository) Upsert(ctx context.Context, forecast models.TrendForecast) error {
	now := time.Now()
	filter := bson.M{"userId": forecast.UserID, "topic": forecast.Topic}
	update := bson.M{
		"$set": bson.M{
			"historicalData":      forecast.HistoricalData,
			"forecast":            forecast.Forecast,
			"peakPredictionDate":  forecast.PeakPredictionDate,
			"peakPredictedScore":  forecast.PeakPredictedScore,
			"matchedClips":        forecast.MatchedClips,
			"forecastGeneratedAt": now,
			"nextUpdateAt":        now.Add(24 * time.Hour),
		},
		"$setOnInsert": bson.M{"createdAt": now},
	}
	_, err := r.col.UpdateOne(ctx, filter, update, options.Update().SetUpsert(true))
	if err != nil {
		return fmt.Errorf("Upsert: %w", err)
	}
	return nil
}
