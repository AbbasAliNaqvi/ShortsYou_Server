package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/database"
)

// StoredTranscript holds raw Whisper output while waiting for analysis callback.
type StoredTranscript struct {
	ID          primitive.ObjectID       `bson:"_id,omitempty"`
	VideoID     string                   `bson:"videoId"`
	UserID      string                   `bson:"userId"`
	Segments    []StoredSegment          `bson:"segments"`
	FillerWords []StoredFillerWord       `bson:"fillerWords"`
	SilenceGaps []StoredSilenceGap       `bson:"silenceGaps"`
	Language    string                   `bson:"language"`
	CreatedAt   time.Time                `bson:"createdAt"`
}

type StoredSegment struct {
	Index int     `bson:"index" json:"index"`
	Start float64 `bson:"start" json:"start"`
	End   float64 `bson:"end"   json:"end"`
	Text  string  `bson:"text"  json:"text"`
}

type StoredFillerWord struct {
	Word        string  `bson:"word"        json:"word"`
	Start       float64 `bson:"start"       json:"start"`
	End         float64 `bson:"end"         json:"end"`
	Probability float64 `bson:"probability" json:"probability"`
}

type StoredSilenceGap struct {
	Start    float64 `bson:"start"    json:"start"`
	End      float64 `bson:"end"      json:"end"`
	Duration float64 `bson:"duration" json:"duration"`
}

type TranscriptRepository struct {
	col *mongo.Collection
}

func NewTranscriptRepository(db *database.MongoDB) *TranscriptRepository {
	return &TranscriptRepository{col: db.Collection("transcripts")}
}

func (r *TranscriptRepository) Save(ctx context.Context, t StoredTranscript) error {
	t.CreatedAt = time.Now()
	opts := options.Update().SetUpsert(true)
	_, err := r.col.UpdateOne(
		ctx,
		bson.M{"videoId": t.VideoID},
		bson.M{"$set": t},
		opts,
	)
	if err != nil {
		return fmt.Errorf("TranscriptRepository.Save: %w", err)
	}
	return nil
}

func (r *TranscriptRepository) FindByVideoID(ctx context.Context, videoID string) (*StoredTranscript, error) {
	var t StoredTranscript
	err := r.col.FindOne(ctx, bson.M{"videoId": videoID}).Decode(&t)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("TranscriptRepository.FindByVideoID: %w", err)
	}
	return &t, nil
}