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

type ClipRepository struct {
	col *mongo.Collection
}

func NewClipRepository(db *database.MongoDB) *ClipRepository {
	return &ClipRepository{col: db.Collection("clips")}
}

func (r *ClipRepository) BulkInsert(ctx context.Context, clips []models.Clip) error {
	if len(clips) == 0 {
		return nil
	}

	now := time.Now()
	docs := make([]any, 0, len(clips))
	for i := range clips {
		clips[i].CreatedAt = now
		clips[i].UpdatedAt = now
		docs = append(docs, clips[i])
	}

	_, err := r.col.InsertMany(ctx, docs)
	if err != nil {
		return fmt.Errorf("BulkInsert: %w", err)
	}
	return nil
}

func (r *ClipRepository) FindByUserID(
	ctx context.Context,
	userID primitive.ObjectID,
	limit, skip int64,
) ([]models.Clip, error) {
	opts := options.Find().
		SetSort(bson.D{{Key: "viralScore", Value: -1}}).
		SetLimit(limit).
		SetSkip(skip)

	cursor, err := r.col.Find(ctx, bson.M{"userId": userID}, opts)
	if err != nil {
		return nil, fmt.Errorf("FindByUserID: %w", err)
	}
	defer cursor.Close(ctx)

	var clips []models.Clip
	if err := cursor.All(ctx, &clips); err != nil {
		return nil, fmt.Errorf("decode clips: %w", err)
	}
	return clips, nil
}

// FindByVideoID returns all clips belonging to a specific video.
func (r *ClipRepository) FindByVideoID(ctx context.Context, videoID primitive.ObjectID) ([]models.Clip, error) {
	opts := options.Find().SetSort(bson.D{{Key: "viralScore", Value: -1}})

	cursor, err := r.col.Find(ctx, bson.M{"videoId": videoID}, opts)
	if err != nil {
		return nil, fmt.Errorf("FindByVideoID: %w", err)
	}
	defer cursor.Close(ctx)

	var clips []models.Clip
	if err := cursor.All(ctx, &clips); err != nil {
		return nil, fmt.Errorf("decode clips: %w", err)
	}
	return clips, nil
}

// FindByID returns a single clip by its ObjectID.
func (r *ClipRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*models.Clip, error) {
	var clip models.Clip
	err := r.col.FindOne(ctx, bson.M{"_id": id}).Decode(&clip)
	if err != nil {
		return nil, fmt.Errorf("FindByID: %w", err)
	}
	return &clip, nil
}

// DeleteByIDAndUserID removes one clip without allowing cross-account deletion.
func (r *ClipRepository) DeleteByIDAndUserID(ctx context.Context, id, userID primitive.ObjectID) (bool, error) {
	result, err := r.col.DeleteOne(ctx, bson.M{"_id": id, "userId": userID})
	if err != nil {
		return false, fmt.Errorf("delete clip: %w", err)
	}
	return result.DeletedCount == 1, nil
}

// DeleteByVideoID removes the clips derived from a source video.
func (r *ClipRepository) DeleteByVideoID(ctx context.Context, videoID, userID primitive.ObjectID) error {
	_, err := r.col.DeleteMany(ctx, bson.M{"videoId": videoID, "userId": userID})
	if err != nil {
		return fmt.Errorf("delete video clips: %w", err)
	}
	return nil
}

// UpdateStatus changes the processing status of a clip.
func (r *ClipRepository) UpdateStatus(ctx context.Context, id primitive.ObjectID, status models.ClipStatus) error {
	_, err := r.col.UpdateByID(ctx, id, bson.M{
		"$set": bson.M{
			"status":    status,
			"updatedAt": time.Now(),
		},
	})
	if err != nil {
		return fmt.Errorf("UpdateStatus: %w", err)
	}
	return nil
}

// UpdateEditSettings saves the creator's chosen editing options and hook.
func (r *ClipRepository) UpdateEditSettings(
	ctx context.Context,
	id primitive.ObjectID,
	settings models.EditSettings,
	selectedHook string,
) error {
	fields := bson.M{
		"editSettings": settings,
		"updatedAt":    time.Now(),
	}
	if selectedHook != "" {
		fields["selectedHook"] = selectedHook
	}

	_, err := r.col.UpdateByID(ctx, id, bson.M{"$set": fields})
	if err != nil {
		return fmt.Errorf("UpdateEditSettings: %w", err)
	}
	return nil
}

func (r *ClipRepository) UpdatePerformanceData(
	ctx context.Context,
	id primitive.ObjectID,
	data models.PerformanceData,
) error {
	_, err := r.col.UpdateByID(ctx, id, bson.M{
		"$set": bson.M{
			"performanceData": data,
			"updatedAt":       time.Now(),
		},
	})
	if err != nil {
		return fmt.Errorf("UpdatePerformanceData: %w", err)
	}
	return nil
}

func (r *ClipRepository) UpdateFields(ctx context.Context, id primitive.ObjectID, fields map[string]any) error {
	_, err := r.col.UpdateByID(ctx, id, bson.M{"$set": fields})
	if err != nil {
		return fmt.Errorf("UpdateFields: %w", err)
	}
	return nil
}

// FindByStatus returns all clips for a user matching a specific status string.
func (r *ClipRepository) FindByStatus(
	ctx context.Context,
	userID primitive.ObjectID,
	status string,
) ([]models.Clip, error) {
	opts := options.Find().
		SetSort(bson.D{{Key: "viralScore", Value: -1}})

	cursor, err := r.col.Find(ctx, bson.M{
		"userId": userID,
		"status": status,
	}, opts)
	if err != nil {
		return nil, fmt.Errorf("FindByStatus: %w", err)
	}
	defer cursor.Close(ctx)

	var clips []models.Clip
	if err := cursor.All(ctx, &clips); err != nil {
		return nil, fmt.Errorf("decode clips: %w", err)
	}
	return clips, nil
}
