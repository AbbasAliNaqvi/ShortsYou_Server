package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type ProcessingStatus string

const (
	StatusPending      ProcessingStatus = "pending"
	StatusDownloading  ProcessingStatus = "downloading"
	StatusTranscribing ProcessingStatus = "transcribing"
	StatusAnalyzing    ProcessingStatus = "analyzing"
	StatusCompleted    ProcessingStatus = "completed"
	StatusFailed       ProcessingStatus = "failed"
)

func (s ProcessingStatus) IsValid() bool {
	switch s {
	case StatusPending,
		StatusDownloading,
		StatusTranscribing,
		StatusAnalyzing,
		StatusCompleted,
		StatusFailed:
		return true
	default:
		return false
	}
}

type Video struct {
	ID              bson.ObjectID    `bson:"_id,omitempty"       json:"id"`
	UserID          bson.ObjectID    `bson:"userId"              json:"userId"`
	YouTubeVideoID  string           `bson:"youtubeVideoId"      json:"youtubeVideoId"`
	Title           string           `bson:"title"               json:"title"`
	Description     string           `bson:"description"         json:"description"`
	DurationSeconds int64            `bson:"durationSeconds"     json:"durationSeconds"`
	ThumbnailURL    string           `bson:"thumbnailUrl"        json:"thumbnailUrl"`
	PublishedAt     time.Time        `bson:"publishedAt"         json:"publishedAt"`
	ViewCount       int64            `bson:"viewCount"            json:"viewCount"`
	LikeCount       int64            `bson:"likeCount"            json:"likeCount"`
	CommentCount    int64            `bson:"commentCount"         json:"commentCount"`
	ProcessingStatus ProcessingStatus `bson:"processingStatus"    json:"processingStatus"`
	ClipsDetected   int              `bson:"clipsDetected"       json:"clipsDetected"`
	ErrorLog        string           `bson:"errorLog,omitempty"  json:"errorLog,omitempty"`
	CreatedAt       time.Time        `bson:"createdAt"            json:"createdAt"`
	UpdatedAt       time.Time        `bson:"updatedAt"            json:"updatedAt"`
}