package ml

// NLP Service types — sent to and received from port 8000
type WordTimestamp struct {
	Word        string  `json:"word"`
	Start       float64 `json:"start"`
	End         float64 `json:"end"`
	Probability float64 `json:"probability"`
}

type FillerWord struct {
	Word  string  `json:"word"`
	Start float64 `json:"start"`
	End   float64 `json:"end"`
}

type SilenceGap struct {
	Start float64 `json:"start"`
	End   float64 `json:"end"`
}

type TranscriptSegment struct {
	Index       int             `json:"index"`
	Start       float64         `json:"start"`
	End         float64         `json:"end"`
	Text        string          `json:"text"`
	Words       []WordTimestamp `json:"words"`
	FillerWords []FillerWord    `json:"fillerWords"`
	SilenceGaps []SilenceGap    `json:"silenceGaps"`
}

type TranscribeRequest struct {
	VideoID  string `json:"videoId"`
	AudioURL string `json:"audioUrl"`
}

type TranscribeResponse struct {
	Segments []TranscriptSegment `json:"segments"`
	Language string              `json:"language"`
}

type AnalyzedSegment struct {
	Index          int       `json:"index"`
	SemanticLabels []string  `json:"semanticLabels"`
	SemanticScore  float64   `json:"semanticScore"`
	NoveltyScore   float64   `json:"noveltyScore"`
	ClarityScore   float64   `json:"clarityScore"`
	Embedding      []float64 `json:"embedding"`
}

type TopicWeight struct {
	Topic  string  `json:"topic"`
	Weight float64 `json:"weight"`
}

type AnalyzeRequest struct {
	VideoID  string              `json:"videoId"`
	UserID   string              `json:"userId"`
	Segments []TranscriptSegment `json:"segments"`
}

type AnalyzeResponse struct {
	Segments          []AnalyzedSegment `json:"segments"`
	TopicDistribution []TopicWeight     `json:"topicDistribution"`
}

// Audio/Video Service types — sent to and received from port 8001

type SegmentWindow struct {
	Start float64 `json:"start"`
	End   float64 `json:"end"`
}

type EmotionSegment struct {
	Index               int     `json:"index"`
	EmotionType         string  `json:"emotionType"`
	EmotionScore        float64 `json:"emotionScore"`
	SpeechEmphasisScore float64 `json:"speechEmphasisScore"`
	EnergySpike         float64 `json:"energySpike"`
	PitchVariation      float64 `json:"pitchVariation"`
}

type EmotionRequest struct {
	VideoID  string          `json:"videoId"`
	AudioURL string          `json:"audioUrl"`
	Segments []SegmentWindow `json:"segments"`
}

type EmotionResponse struct {
	Segments []EmotionSegment `json:"segments"`
}

type EditSettingsML struct {
	BackgroundStyle string `json:"backgroundStyle"`
	ColorGrade      string `json:"colorGrade"`
	MusicMood       string `json:"musicMood"`
	CaptionStyle    string `json:"captionStyle"`
	RemoveSilences  bool   `json:"removeSilences"`
	RemoveFillers   bool   `json:"removeFillers"`
}

type GenerateShortRequest struct {
	ClipID       string         `json:"clipId"`
	UserID       string         `json:"userId"`
	VideoURL     string         `json:"videoUrl"`
	StartTime    float64        `json:"startTime"`
	EndTime      float64        `json:"endTime"`
	EditSettings EditSettingsML `json:"editSettings"`
	CallbackURL  string         `json:"callbackUrl"`
}

type GenerateShortResponse struct {
	OutputURL string  `json:"outputUrl"`
	Duration  float64 `json:"duration"`
}

type TrainCPEPRequest struct {
	UserID string `json:"userId"`
}

type TrainCPEPResponse struct {
	ModelVersion string  `json:"modelVersion"`
	PearsonR     float64 `json:"pearsonR"`
	RMSE         float64 `json:"rmse"`
	R2           float64 `json:"r2"`
}
