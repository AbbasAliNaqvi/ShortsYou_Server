package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ProcessingJob struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	JobID       string             `bson:"jobId"         json:"jobId"`
	UserID      primitive.ObjectID `bson:"userId"        json:"userId"`
	VideoID     primitive.ObjectID `bson:"videoId"       json:"videoId"`
	Status      string             `bson:"status"        json:"status"`
	Stage       string             `bson:"stage"         json:"stage"`
	Progress    float64            `bson:"progress"      json:"progress"`
	ClipsFound  int                `bson:"clipsFound"    json:"clipsFound"`
	Error       string             `bson:"error,omitempty" json:"error,omitempty"`
	CreatedAt   time.Time          `bson:"createdAt"     json:"createdAt"`
	CompletedAt *time.Time         `bson:"completedAt,omitempty" json:"completedAt,omitempty"`
}

const (
	JobStatusQueued      = "queued"
	JobStatusDownloading = "downloading"
	JobStatusTranscribing = "transcribing"
	JobStatusAnalyzing   = "analyzing"
	JobStatusCompleted   = "completed"
	JobStatusFailed      = "failed"
)