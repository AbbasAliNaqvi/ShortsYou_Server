package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ClipCategory string
type ClipStatus string

const (
	CategoryViral          ClipCategory = "viral"
	CategoryEvergreen      ClipCategory = "evergreen"
	CategoryNarrative      ClipCategory = "narrative"
	CategoryEmotion        ClipCategory = "emotion"
	CategoryCommentTrigger ClipCategory = "comment_trigger"
)

const (
	ClipStatusDetected  ClipStatus = "detected"
	ClipStatusEditing   ClipStatus = "editing"
	ClipStatusExported  ClipStatus = "exported"
	ClipStatusPublished ClipStatus = "published"
	ClipStatusRejected  ClipStatus = "rejected"
	ClipStatusFailed    ClipStatus = "failed"
)

type ConfidenceInterval struct {
	Low  float64 `bson:"low" json:"low"`
	High float64 `bson:"high" json:"high"`
}

type ClipScores struct {
	Emotion        float64 `bson:"emotion" json:"emotion"`
	SemanticImpact float64 `bson:"semanticImpact" json:"semanticImpact"`
	SpeechEmphasis float64 `bson:"speechEmphasis" json:"speechEmphasis"`
	Clarity        float64 `bson:"clarity" json:"clarity"`
	Novelty        float64 `bson:"novelty" json:"novelty"`
	TrendAlignment float64 `bson:"trendAlignment" json:"trendAlignment"`
}

type SuggestedHook struct {
	Text      string  `bson:"text" json:"text"`
	HookScore float64 `bson:"hookScore" json:"hookScore"`
}

type EditSettings struct {
	BackgroundStyle string `bson:"backgroundStyle" json:"backgroundStyle"`
	ColorGrade      string `bson:"colorGrade" json:"colorGrade"`
	MusicMood       string `bson:"musicMood" json:"musicMood"`
	CaptionStyle    string `bson:"captionStyle" json:"captionStyle"`
	RemoveSilences  bool   `bson:"removeSilences" json:"removeSilences"`
	RemoveFillers   bool   `bson:"removeFillers" json:"removeFillers"`
}

type PerformanceData struct {
	Views48h        int64     `bson:"views48h" json:"views48h"`
	CTR48h          float64   `bson:"ctr48h" json:"ctr48h"`
	AvgWatchTimeSec float64   `bson:"avgWatchTimeSec" json:"avgWatchTimeSec"`
	EngagementRate  float64   `bson:"engagementRate" json:"engagementRate"`
	CollectedAt     time.Time `bson:"collectedAt" json:"collectedAt"`
}

type Clip struct {
	ID                    primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	VideoID               primitive.ObjectID `bson:"videoId" json:"videoId"`
	UserID                primitive.ObjectID `bson:"userId" json:"userId"`
	StartTime             float64            `bson:"startTime" json:"startTime"`
	EndTime               float64            `bson:"endTime" json:"endTime"`
	DurationSeconds       float64            `bson:"durationSeconds" json:"durationSeconds"`
	TranscriptText        string             `bson:"transcriptText" json:"transcriptText"`
	Category              ClipCategory       `bson:"category" json:"category"`
	ViralScore            float64            `bson:"viralScore" json:"viralScore"`
	GenericPredScore      float64            `bson:"genericPredictionScore" json:"genericPredictionScore"`
	PersonalizedPredScore float64            `bson:"personalizedPredictionScore" json:"personalizedPredictionScore"`
	ConfidenceInterval    ConfidenceInterval `bson:"predictionConfidenceInterval" json:"predictionConfidenceInterval"`

	Scores ClipScores `bson:"scores" json:"scores"`

	ShapValues map[string]float64 `bson:"shapValues,omitempty" json:"shapValues,omitempty"`

	SemanticLabels []string `bson:"semanticLabels" json:"semanticLabels"`
	EmotionType    string   `bson:"emotionType" json:"emotionType"`

	OriginalHook   string          `bson:"originalHook" json:"originalHook"`
	HookScore      float64         `bson:"hookScore" json:"hookScore"`
	SuggestedHooks []SuggestedHook `bson:"suggestedHooks" json:"suggestedHooks"`
	SelectedHook   string          `bson:"selectedHook" json:"selectedHook"`

	EditSettings EditSettings `bson:"editSettings" json:"editSettings"`

	SupabaseRawClipURL string `bson:"supabaseRawClipUrl,omitempty" json:"supabaseRawClipUrl,omitempty"`
	SupabaseShortURL   string `bson:"supabaseShortUrl,omitempty" json:"supabaseShortUrl,omitempty"`

	ThumbnailOptions  []string `bson:"thumbnailOptions" json:"thumbnailOptions"`
	SelectedThumbnail string   `bson:"selectedThumbnail" json:"selectedThumbnail"`

	PerformanceData *PerformanceData `bson:"performanceData,omitempty" json:"performanceData,omitempty"`

	ABTestGroup        string `bson:"abTestGroup" json:"abTestGroup"`
	ABTestExperimentID string `bson:"abTestExperimentId,omitempty" json:"abTestExperimentId,omitempty"`

	Status ClipStatus `bson:"status" json:"status"`

	CreatedAt  time.Time  `bson:"createdAt" json:"createdAt"`
	UpdatedAt  time.Time  `bson:"updatedAt" json:"updatedAt"`
	ExportedAt *time.Time `bson:"exportedAt,omitempty" json:"exportedAt,omitempty"`
}
