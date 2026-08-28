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
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/models"
)

type CreatorDNARepository struct {
	col *mongo.Collection
}

func NewCreatorDNARepository(db *database.MongoDB) *CreatorDNARepository {
	return &CreatorDNARepository{col: db.Collection("creator_dna")}
}

func (r *CreatorDNARepository) FindByUserID(ctx context.Context, userID primitive.ObjectID) (*models.CreatorDNA, error) {
	var dna models.CreatorDNA
	err := r.col.FindOne(ctx, bson.M{"userId": userID}).Decode(&dna)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("FindByUserID: %w", err)
	}
	return &dna, nil
}

func (r *CreatorDNARepository) Upsert(ctx context.Context, dna models.CreatorDNA) error {
	now := time.Now()
	filter := bson.M{"userId": dna.UserID}
	update := bson.M{
		"$set": bson.M{
			"channelId":         dna.ChannelID,
			"topicDistribution": dna.TopicDistribution,
			"emotionalRange":    dna.EmotionalRange,
			"speechProfile":     dna.SpeechProfile,
			"topicGraph":        dna.TopicGraph,
			"contentGaps":       dna.ContentGaps,
			"vocabularyProfile": dna.VocabularyProfile,
			"dnaVector":         dna.DNAVector,
			"evergreensRatio":   dna.EvergreensRatio,
			"avgHookScore":      dna.AvgHookScore,
			"lastUpdatedAt":     now,
		},
		"$setOnInsert": bson.M{"createdAt": now},
	}
	opts := options.Update().SetUpsert(true)
	_, err := r.col.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		return fmt.Errorf("Upsert: %w", err)
	}
	return nil
}

func (r *CreatorDNARepository) AppendModelAccuracy(ctx context.Context, userID primitive.ObjectID, point models.ModelAccuracyPoint) error {
	now := time.Now()
	_, err := r.col.UpdateOne(
		ctx,
		bson.M{"userId": userID},
		bson.M{
			"$push":        bson.M{"modelAccuracyHistory": point},
			"$set":         bson.M{"lastUpdatedAt": now},
			"$setOnInsert": bson.M{"createdAt": now},
		},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		return fmt.Errorf("AppendModelAccuracy: %w", err)
	}
	return nil
}

func (r *CreatorDNARepository) UpdateFeatureImportances(ctx context.Context, userID primitive.ObjectID, importances []models.FeatureImportance) error {
	_, err := r.col.UpdateOne(
		ctx,
		bson.M{"userId": userID},
		bson.M{"$set": bson.M{
			"featureImportances": importances,
			"lastUpdatedAt":      time.Now(),
		}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		return fmt.Errorf("UpdateFeatureImportances: %w", err)
	}
	return nil
}