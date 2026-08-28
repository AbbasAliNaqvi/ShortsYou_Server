package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TopicWeight struct {
	Topic  string  `bson:"topic"  json:"topic"`
	Weight float64 `bson:"weight" json:"weight"`
	Label  string  `bson:"label"  json:"label"`
}

type GraphNode struct {
	ID         string  `bson:"id"         json:"id"`
	Label      string  `bson:"label"      json:"label"`
	ClipCount  int     `bson:"clipCount"  json:"clipCount"`
	IsGap      bool    `bson:"isGap"      json:"isGap"`
	IsTrending bool    `bson:"isTrending" json:"isTrending"`
	Weight     float64 `bson:"weight"     json:"weight"`
}

type GraphEdge struct {
	Source string  `bson:"source" json:"source"`
	Target string  `bson:"target" json:"target"`
	Weight float64 `bson:"weight" json:"weight"`
}

type ContentGap struct {
	Topic            string  `bson:"topic"            json:"topic"`
	DemandScore      float64 `bson:"demandScore"      json:"demandScore"`
	TrendScore       float64 `bson:"trendScore"       json:"trendScore"`
	GapScore         float64 `bson:"gapScore"         json:"gapScore"`
	OpportunityScore float64 `bson:"opportunityScore" json:"opportunityScore"`
}

type TopicGraph struct {
	Nodes []GraphNode `bson:"nodes" json:"nodes"`
	Edges []GraphEdge `bson:"edges" json:"edges"`
}

type EmotionalRange struct {
	Mean            float64 `bson:"mean"            json:"mean"`
	Std             float64 `bson:"std"             json:"std"`
	Min             float64 `bson:"min"             json:"min"`
	Max             float64 `bson:"max"             json:"max"`
	DominantEmotion string  `bson:"dominantEmotion" json:"dominantEmotion"`
}

type SpeechProfile struct {
	AvgWPM            float64 `bson:"avgWpm"            json:"avgWpm"`
	PauseFrequency    float64 `bson:"pauseFrequency"    json:"pauseFrequency"`
	EmphasisFrequency float64 `bson:"emphasisFrequency" json:"emphasisFrequency"`
	AvgSegmentLength  float64 `bson:"avgSegmentLength"  json:"avgSegmentLength"`
}

type VocabularyProfile struct {
	TopWords          []string `bson:"topWords"          json:"topWords"`
	AvgSentenceLength float64  `bson:"avgSentenceLength" json:"avgSentenceLength"`
	ReadabilityScore  float64  `bson:"readabilityScore"  json:"readabilityScore"`
}

type FeatureImportance struct {
	Feature     string  `bson:"feature"     json:"feature"`
	MeanAbsSHAP float64 `bson:"meanAbsShap" json:"meanAbsSHAP"`
	FeatureType string  `bson:"featureType" json:"featureType"`
}

type ModelAccuracyPoint struct {
	NSamples  int64     `bson:"nSamples"  json:"nSamples"`
	PearsonR  float64   `bson:"pearsonR"  json:"pearsonR"`
	RMSE      float64   `bson:"rmse"      json:"rmse"`
	R2        float64   `bson:"r2"        json:"r2"`
	TrainedAt time.Time `bson:"trainedAt" json:"trainedAt"`
}

type CreatorDNA struct {
	ID                   primitive.ObjectID   `bson:"_id,omitempty"       json:"id"`
	UserID               primitive.ObjectID   `bson:"userId"              json:"userId"`
	ChannelID            string               `bson:"channelId"           json:"channelId"`
	TopicDistribution    []TopicWeight        `bson:"topicDistribution"   json:"topicDistribution"`
	EmotionalRange       EmotionalRange       `bson:"emotionalRange"      json:"emotionalRange"`
	SpeechProfile        SpeechProfile        `bson:"speechProfile"       json:"speechProfile"`
	TopicGraph           TopicGraph           `bson:"topicGraph"          json:"topicGraph"`
	ContentGaps          []ContentGap         `bson:"contentGaps"         json:"contentGaps"`
	VocabularyProfile    VocabularyProfile    `bson:"vocabularyProfile"   json:"vocabularyProfile"`
	DNAVector            []float64            `bson:"dnaVector"           json:"dnaVector"`
	EvergreensRatio      float64              `bson:"evergreensRatio"     json:"evergreensRatio"`
	AvgHookScore         float64              `bson:"avgHookScore"        json:"avgHookScore"`
	ModelAccuracyHistory []ModelAccuracyPoint `bson:"modelAccuracyHistory" json:"modelAccuracyHistory"`
	FeatureImportances   []FeatureImportance  `bson:"featureImportances"  json:"featureImportances"`
	LastUpdatedAt        time.Time            `bson:"lastUpdatedAt"       json:"lastUpdatedAt"`
	CreatedAt            time.Time            `bson:"createdAt"           json:"createdAt"`
}