package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TrendPoint struct {
	Date          time.Time `bson:"date"          json:"date"`
	InterestScore float64   `bson:"interestScore" json:"interestScore"`
}

type ForecastPoint struct {
	Date           time.Time `bson:"date"           json:"date"`
	PredictedScore float64   `bson:"predictedScore" json:"predictedScore"`
	Lower95        float64   `bson:"lower95"        json:"lower95"`
	Upper95        float64   `bson:"upper95"        json:"upper95"`
}

type MatchedClip struct {
	ClipID          string  `bson:"clipId"          json:"clipId"`
	Title           string  `bson:"title"           json:"title"`
	SimilarityScore float64 `bson:"similarityScore" json:"similarityScore"`
}

type TrendForecast struct {
	ID                  primitive.ObjectID `bson:"_id,omitempty"       json:"id"`
	UserID              primitive.ObjectID `bson:"userId"              json:"userId"`
	Topic               string             `bson:"topic"               json:"topic"`
	HistoricalData      []TrendPoint       `bson:"historicalData"      json:"historicalData"`
	Forecast            []ForecastPoint    `bson:"forecast"            json:"forecast"`
	PeakPredictionDate  time.Time          `bson:"peakPredictionDate"  json:"peakPredictionDate"`
	PeakPredictedScore  float64            `bson:"peakPredictedScore"  json:"peakPredictedScore"`
	MatchedClips        []MatchedClip      `bson:"matchedClips"        json:"matchedClips"`
	ForecastGeneratedAt time.Time          `bson:"forecastGeneratedAt" json:"forecastGeneratedAt"`
	NextUpdateAt        time.Time          `bson:"nextUpdateAt"        json:"nextUpdateAt"`
	CreatedAt           time.Time          `bson:"createdAt"           json:"createdAt"`
}