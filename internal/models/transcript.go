package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Transcript struct {
	ID          primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	VideoID     primitive.ObjectID  `bson:"videoId"       json:"videoId"`
	UserID      primitive.ObjectID  `bson:"userId"        json:"userId"`
	Segments    []TranscriptSegment `bson:"segments"      json:"segments"`
	FillerWords []FillerWord        `bson:"fillerWords"   json:"fillerWords"`
	SilenceGaps []SilenceGap        `bson:"silenceGaps"   json:"silenceGaps"`
	Language    string              `bson:"language"      json:"language"`
	CreatedAt   time.Time           `bson:"createdAt"     json:"createdAt"`
}

// Import these from ml package when needed
type TranscriptSegment struct {
	Index  int     `bson:"index"  json:"index"`
	Start  float64 `bson:"start"  json:"start"`
	End    float64 `bson:"end"    json:"end"`
	Text   string  `bson:"text"   json:"text"`
	Words  []Word  `bson:"words"  json:"words"`
}

type Word struct {
	Word        string  `bson:"word"        json:"word"`
	Start       float64 `bson:"start"       json:"start"`
	End         float64 `bson:"end"         json:"end"`
	Probability float64 `bson:"probability" json:"probability"`
}

type FillerWord struct {
	Word        string  `bson:"word"        json:"word"`
	Start       float64 `bson:"start"       json:"start"`
	End         float64 `bson:"end"         json:"end"`
	Probability float64 `bson:"probability" json:"probability"`
}

type SilenceGap struct {
	Start    float64 `bson:"start"    json:"start"`
	End      float64 `bson:"end"      json:"end"`
	Duration float64 `bson:"duration" json:"duration"`
}