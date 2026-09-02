package ml

type TranscribeRequest struct {
	VideoID  string `json:"videoId"`
	AudioURL string `json:"audioUrl"`
}

type WordTimestamp struct {
	Word        string  `json:"word"`
	Start       float64 `json:"start"`
	End         float64 `json:"end"`
	Probability float64 `json:"probability"`
}

type FillerWord struct {
	Word        string  `json:"word"`
	Start       float64 `json:"start"`
	End         float64 `json:"end"`
	Probability float64 `json:"probability"`
}

type SilenceGap struct {
	Start    float64 `json:"start"`
	End      float64 `json:"end"`
	Duration float64 `json:"duration"`
}

type TranscriptSegment struct {
	Index       int             `json:"index"`
	Start       float64         `json:"start"`
	End         float64         `json:"end"`
	Text        string          `json:"text"`
	Words       []WordTimestamp `json:"words"`
}

type TranscribeResponse struct {
	Segments    []TranscriptSegment `json:"segments"`
	FillerWords []FillerWord        `json:"fillerWords"`
	SilenceGaps []SilenceGap        `json:"silenceGaps"`
	Language    string              `json:"language"`
}


type AnalyzeRequest struct {
	JobID       string              `json:"job_id"`
	VideoID     string              `json:"video_id"`
	UserID      string              `json:"user_id"`
	Language    string              `json:"language"`
	Segments    []TranscriptSegment `json:"segments"`
	FillerWords []FillerWord        `json:"fillerWords"`
	SilenceGaps []SilenceGap        `json:"silenceGaps"`
}

type AnalyzedSegment struct {
	Index          int       `json:"index"`
	SemanticLabels []string  `json:"semanticLabels"`
	SemanticScore  float64   `json:"semanticScore"`
	NoveltyScore   float64   `json:"noveltyScore"`
	ClarityScore   float64   `json:"clarityScore"`
	Embedding      []float64 `json:"embedding"`
	HookScore      float64   `json:"hookScore"`
	SuggestedHook  string    `json:"suggestedHook"`
}

type TopicWeight struct {
	Topic  string  `json:"topic"`
	Label  string  `json:"label"`
	Weight float64 `json:"weight"`
}

type AnalyzeResponse struct {
	Segments          []AnalyzedSegment `json:"segments"`
	TopicDistribution []TopicWeight     `json:"topicDistribution"`
}


type SegmentWindow struct {
	Index int     `json:"index"`
	Start float64 `json:"start"`
	End   float64 `json:"end"`
}

type EmotionRequest struct {
	VideoID  string          `json:"videoId"`
	AudioURL string          `json:"audioUrl"`
	Segments []SegmentWindow `json:"segments"`
}

type EmotionSegment struct {
	Index               int     `json:"index"`
	EmotionType         string  `json:"emotionType"`
	EmotionScore        float64 `json:"emotionScore"`
	SpeechEmphasisScore float64 `json:"speechEmphasisScore"`
	EnergySpike         float64 `json:"energySpike"`
	PitchVariation      float64 `json:"pitchVariation"`
}

type EmotionResponse struct {
	Segments []EmotionSegment `json:"segments"`
}


type GenerateShortRequest struct {
	ClipID      string  `json:"clipId"`
	UserID      string  `json:"userId"`
	VideoURL    string  `json:"videoUrl"`
	StartTime   float64 `json:"startTime"`
	EndTime     float64 `json:"endTime"`
	CallbackURL string  `json:"callbackUrl"`
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