package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type FeatureMatrix struct {
	ID      primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ClipID  primitive.ObjectID `bson:"clipId"        json:"clipId"`
	VideoID primitive.ObjectID `bson:"videoId"       json:"videoId"`
	UserID  primitive.ObjectID `bson:"userId"        json:"userId"`

	EmotionScore        float64 `bson:"emotionScore"        json:"emotionScore"`
	SemanticImpactScore float64 `bson:"semanticImpactScore" json:"semanticImpactScore"`
	SpeechEmphasisScore float64 `bson:"speechEmphasisScore" json:"speechEmphasisScore"`
	ClarityScore        float64 `bson:"clarityScore"        json:"clarityScore"`
	NoveltyScore        float64 `bson:"noveltyScore"        json:"noveltyScore"`
	HookScore           float64 `bson:"hookScore"           json:"hookScore"`
	TrendAlignmentScore float64 `bson:"trendAlignmentScore" json:"trendAlignmentScore"`
	DurationSeconds     float64 `bson:"durationSeconds"     json:"durationSeconds"`
	VideoPositionRatio  float64 `bson:"videoPositionRatio"  json:"videoPositionRatio"`
	TopicAffinityScore  float64 `bson:"topicAffinityScore"  json:"topicAffinityScore"`

	// Performance labels populated by the 48hr analytics collection job.
	Views48h               int64      `bson:"views48h,omitempty"               json:"views48h,omitempty"`
	CTR48h                 float64    `bson:"ctr48h,omitempty"                 json:"ctr48h,omitempty"`
	AvgWatchTimeSec        float64    `bson:"avgWatchTimeSec,omitempty"        json:"avgWatchTimeSec,omitempty"`
	PerformanceBand        string     `bson:"performanceBand,omitempty"        json:"performanceBand,omitempty"`
	PerformanceCollectedAt *time.Time `bson:"performanceCollectedAt,omitempty" json:"performanceCollectedAt,omitempty"`

	CreatedAt time.Time `bson:"createdAt" json:"createdAt"`
}