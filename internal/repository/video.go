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

type VideoRepository struct {
	col *mongo.Collection
}

func NewVideoRepository(db *database.MongoDB) *VideoRepository {
	return &VideoRepository{
		col: db.Collection("videos"),
	}
}

func (r *VideoRepository) BulkUpsert(
	ctx context.Context,
	videos []models.Video,
) error {
	if len(videos) == 0 {
		return nil
	}

	now := time.Now()

	ops := make([]mongo.WriteModel, 0, len(videos))

	for _, video := range videos {
		// A YouTube video belongs to a particular ShortsYou user.
		filter := bson.M{
			"userId":         video.UserID,
			"youtubeVideoId": video.YouTubeVideoID,
		}

		update := bson.M{
			"$set": bson.M{
				"title":           video.Title,
				"description":     video.Description,
				"durationSeconds": video.DurationSeconds,
				"thumbnailUrl":    video.ThumbnailURL,
				"publishedAt":     video.PublishedAt,
				"viewCount":       video.ViewCount,
				"likeCount":       video.LikeCount,
				"commentCount":    video.CommentCount,
				"updatedAt":       now,
			},
			"$setOnInsert": bson.M{
				"userId":           video.UserID,
				"youtubeVideoId":   video.YouTubeVideoID,
				"processingStatus": models.StatusPending,
				"clipsDetected":    0,
				"createdAt":        now,
			},
		}

		op := mongo.NewUpdateOneModel().
			SetFilter(filter).
			SetUpdate(update).
			SetUpsert(true)

		ops = append(ops, op)
	}

	_, err := r.col.BulkWrite(
		ctx,
		ops,
		options.BulkWrite().SetOrdered(false),
	)
	if err != nil {
		return fmt.Errorf("bulk upsert videos: %w", err)
	}

	return nil
}

// FindByUserID returns videos belonging to a user.
//
// Results are ordered newest first using YouTube's publishedAt timestamp.
func (r *VideoRepository) FindByUserID(
	ctx context.Context,
	userID primitive.ObjectID,
	limit int64,
	skip int64,
) ([]models.Video, error) {
	if limit <= 0 {
		limit = 20
	}

	if limit > 100 {
		limit = 100
	}

	if skip < 0 {
		skip = 0
	}

	opts := options.Find().
		SetSort(bson.D{
			{Key: "publishedAt", Value: -1},
			{Key: "_id", Value: -1},
		}).
		SetLimit(limit).
		SetSkip(skip)

	cursor, err := r.col.Find(
		ctx,
		bson.M{"userId": userID},
		opts,
	)
	if err != nil {
		return nil, fmt.Errorf("find videos by user: %w", err)
	}

	defer cursor.Close(ctx)

	var videos []models.Video

	if err := cursor.All(ctx, &videos); err != nil {
		return nil, fmt.Errorf("decode videos: %w", err)
	}

	if videos == nil {
		videos = []models.Video{}
	}

	return videos, nil
}

// FindByStatus returns all videos belonging to a user with the given
// processing status.
func (r *VideoRepository) FindByStatus(
	ctx context.Context,
	userID primitive.ObjectID,
	status models.ProcessingStatus,
) ([]models.Video, error) {
	filter := bson.M{
		"userId":           userID,
		"processingStatus": status,
	}

	opts := options.Find().
		SetSort(bson.D{
			{Key: "publishedAt", Value: -1},
		})

	cursor, err := r.col.Find(ctx, filter, opts)
	if err != nil {
		return nil, fmt.Errorf("find videos by status: %w", err)
	}

	defer cursor.Close(ctx)

	var videos []models.Video

	if err := cursor.All(ctx, &videos); err != nil {
		return nil, fmt.Errorf("decode videos: %w", err)
	}

	if videos == nil {
		videos = []models.Video{}
	}

	return videos, nil
}

// FindByID returns a video by MongoDB ObjectID.
//
// The caller should perform the user ownership check separately.
func (r *VideoRepository) FindByID(
	ctx context.Context,
	id primitive.ObjectID,
) (*models.Video, error) {
	var video models.Video

	err := r.col.FindOne(
		ctx,
		bson.M{"_id": id},
	).Decode(&video)

	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}

	if err != nil {
		return nil, fmt.Errorf("find video by id: %w", err)
	}

	return &video, nil
}

// FindByIDAndUserID returns a video only if it belongs to the supplied user.
//
// This is safer for HTTP handlers than FindByID because it prevents a user
// from accessing another user's video by guessing/obtaining its ObjectID.
func (r *VideoRepository) FindByIDAndUserID(
	ctx context.Context,
	id primitive.ObjectID,
	userID primitive.ObjectID,
) (*models.Video, error) {
	var video models.Video

	filter := bson.M{
		"_id":    id,
		"userId": userID,
	}

	err := r.col.FindOne(ctx, filter).Decode(&video)

	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}

	if err != nil {
		return nil, fmt.Errorf("find video by id and user: %w", err)
	}

	return &video, nil
}

// UpdateStatus changes the processing status of a video.
//
// If errLog is provided, it is saved into errorLog.
// When a video succeeds, passing an empty errLog clears an old error.
func (r *VideoRepository) UpdateStatus(
	ctx context.Context,
	id primitive.ObjectID,
	status models.ProcessingStatus,
	errLog string,
) error {
	fields := bson.M{
		"processingStatus": status,
		"updatedAt":        time.Now(),
	}

	if errLog != "" {
		fields["errorLog"] = errLog
	} else {
		fields["errorLog"] = ""
	}

	result, err := r.col.UpdateOne(
		ctx,
		bson.M{"_id": id},
		bson.M{"$set": fields},
	)
	if err != nil {
		return fmt.Errorf("update video status: %w", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("video not found: %s", id.Hex())
	}

	return nil
}

// UpdateClipsDetected updates the number of clips detected for a video.
func (r *VideoRepository) UpdateClipsDetected(
	ctx context.Context,
	id primitive.ObjectID,
	count int,
) error {
	if count < 0 {
		count = 0
	}

	_, err := r.col.UpdateOne(
		ctx,
		bson.M{"_id": id},
		bson.M{
			"$set": bson.M{
				"clipsDetected": count,
				"updatedAt":     time.Now(),
			},
		},
	)

	if err != nil {
		return fmt.Errorf("update clips detected: %w", err)
	}

	return nil
}