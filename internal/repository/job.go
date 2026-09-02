package repository

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"

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