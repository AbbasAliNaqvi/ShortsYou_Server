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

type JobRepository struct {
	col *mongo.Collection
}

func NewJobRepository(db *database.MongoDB) *JobRepository {
	return &JobRepository{col: db.Collection("processing_jobs")}
}

func (r *JobRepository) Create(ctx context.Context, job models.ProcessingJob) error {
	job.CreatedAt = time.Now()
	_, err := r.col.InsertOne(ctx, job)
	if err != nil {
		return fmt.Errorf("JobRepository.Create: %w", err)
	}
	return nil
}

func (r *JobRepository) FindByJobID(ctx context.Context, jobID string) (*models.ProcessingJob, error) {
	var job models.ProcessingJob
	err := r.col.FindOne(ctx, bson.M{"jobId": jobID}).Decode(&job)
	if err != nil {
		return nil, fmt.Errorf("JobRepository.FindByJobID: %w", err)
	}
	return &job, nil
}

func (r *JobRepository) FindByUserID(ctx context.Context, userID primitive.ObjectID, limit int) ([]models.ProcessingJob, error) {
	if limit <= 0 {
		limit = 20
	}

	cursor, err := r.col.Find(ctx, bson.M{"userId": userID}, options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}).SetLimit(int64(limit)))
	if err != nil {
		return nil, fmt.Errorf("JobRepository.FindByUserID: %w", err)
	}
	defer cursor.Close(ctx)

	var jobs []models.ProcessingJob
	if err := cursor.All(ctx, &jobs); err != nil {
		return nil, fmt.Errorf("JobRepository.FindByUserID decode: %w", err)
	}
	return jobs, nil
}

func (r *JobRepository) UpdateStatus(ctx context.Context, jobID, status, stage string, progress float64) error {
	_, err := r.col.UpdateOne(
		ctx,
		bson.M{"jobId": jobID},
		bson.M{"$set": bson.M{
			"status":   status,
			"stage":    stage,
			"progress": progress,
		}},
	)
	return err
}

func (r *JobRepository) Complete(ctx context.Context, jobID string, clipsFound int) error {
	now := time.Now()
	_, err := r.col.UpdateOne(
		ctx,
		bson.M{"jobId": jobID},
		bson.M{"$set": bson.M{
			"status":      models.JobStatusCompleted,
			"stage":       "completed",
			"progress":    1.0,
			"clipsFound":  clipsFound,
			"completedAt": now,
		}},
	)
	return err
}

func (r *JobRepository) Fail(ctx context.Context, jobID, errMsg string) error {
	_, err := r.col.UpdateOne(
		ctx,
		bson.M{"jobId": jobID},
		bson.M{"$set": bson.M{
			"status": models.JobStatusFailed,
			"error":  errMsg,
		}},
	)
	return err
}

// UpdateByVideoID updates the most recent pipeline job for a video. Callbacks
// are keyed by videoId by the external ML service, not by our internal job ID.
func (r *JobRepository) UpdateByVideoID(ctx context.Context, videoID string, status, stage string, progress float64, clipsFound int, errMsg string) error {
	id, err := primitive.ObjectIDFromHex(videoID)
	if err != nil {
		return fmt.Errorf("JobRepository.UpdateByVideoID: invalid video id: %w", err)
	}
	fields := bson.M{
		"status":     status,
		"stage":      stage,
		"progress":   progress,
		"clipsFound": clipsFound,
		"error":      errMsg,
	}
	if status == models.JobStatusCompleted || status == models.JobStatusFailed {
		now := time.Now()
		fields["completedAt"] = now
	}
	var latest models.ProcessingJob
	if err := r.col.FindOne(
		ctx,
		bson.M{"videoId": id},
		options.FindOne().SetSort(bson.D{{Key: "createdAt", Value: -1}}),
	).Decode(&latest); err != nil {
		if err == mongo.ErrNoDocuments {
			return nil
		}
		return fmt.Errorf("JobRepository.UpdateByVideoID find: %w", err)
	}
	_, err = r.col.UpdateOne(
		ctx,
		bson.M{"_id": latest.ID},
		bson.M{"$set": fields},
	)
	if err != nil {
		return fmt.Errorf("JobRepository.UpdateByVideoID: %w", err)
	}
	return nil
}
