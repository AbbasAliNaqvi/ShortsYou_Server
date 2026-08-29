package ml

import "context"

type MockService struct{}

func NewMockService() *MockService {
	return &MockService{}
}

func (m *MockService) Transcribe(
	ctx context.Context,
	req TranscribeRequest,
) (*TranscribeResponse, error) {
	_ = ctx
	_ = req

	return &TranscribeResponse{
		Language: "en",
		Segments: []TranscriptSegment{
			{
				Index: 0,
				Start: 0,
				End:   5,
				Text:  "Most people think success happens overnight.",
				Words: []WordTimestamp{
					{Word: "Most", Start: 0, End: 0.4, Probability: 0.99},
					{Word: "people", Start: 0.4, End: 0.9, Probability: 0.99},
					{Word: "think", Start: 0.9, End: 1.3, Probability: 0.98},
					{Word: "success", Start: 1.3, End: 2.0, Probability: 0.99},
					{Word: "happens", Start: 2.0, End: 2.6, Probability: 0.98},
					{Word: "overnight", Start: 2.6, End: 3.5, Probability: 0.97},
				},
			},
			{
				Index: 1,
				Start: 5,
				End:   11,
				Text:  "But the truth is, the boring days are what build everything.",
				Words: []WordTimestamp{
					{Word: "But", Start: 5, End: 5.3, Probability: 0.99},
					{Word: "the", Start: 5.3, End: 5.5, Probability: 0.99},
					{Word: "truth", Start: 5.5, End: 5.9, Probability: 0.98},
					{Word: "is", Start: 5.9, End: 6.1, Probability: 0.99},
					{Word: "the", Start: 6.1, End: 6.3, Probability: 0.99},
					{Word: "boring", Start: 6.3, End: 6.8, Probability: 0.97},
					{Word: "days", Start: 6.8, End: 7.2, Probability: 0.98},
					{Word: "are", Start: 7.2, End: 7.5, Probability: 0.99},
					{Word: "what", Start: 7.5, End: 7.9, Probability: 0.99},
					{Word: "build", Start: 7.9, End: 8.4, Probability: 0.98},
					{Word: "everything", Start: 8.4, End: 9.2, Probability: 0.97},
				},
			},
			{
				Index: 2,
				Start: 11,
				End:   17,
				Text:  "If you keep showing up when nobody is watching, you eventually win.",
				Words: []WordTimestamp{
					{Word: "If", Start: 11, End: 11.2, Probability: 0.99},
					{Word: "you", Start: 11.2, End: 11.5, Probability: 0.99},
					{Word: "keep", Start: 11.5, End: 11.9, Probability: 0.98},
					{Word: "showing", Start: 11.9, End: 12.4, Probability: 0.98},
					{Word: "up", Start: 12.4, End: 12.7, Probability: 0.99},
					{Word: "when", Start: 12.7, End: 13.1, Probability: 0.99},
					{Word: "nobody", Start: 13.1, End: 13.6, Probability: 0.97},
					{Word: "is", Start: 13.6, End: 13.8, Probability: 0.99},
					{Word: "watching", Start: 13.8, End: 14.3, Probability: 0.98},
					{Word: "you", Start: 14.3, End: 14.6, Probability: 0.99},
					{Word: "eventually", Start: 14.6, End: 15.3, Probability: 0.97},
					{Word: "win", Start: 15.3, End: 15.8, Probability: 0.99},
				},
			},
		},
	}, nil
}

func (m *MockService) Analyze(
	ctx context.Context,
	req AnalyzeRequest,
) (*AnalyzeResponse, error) {
	_ = ctx

	segments := make([]AnalyzedSegment, len(req.Segments))

	for i, s := range req.Segments {
		switch i {
		case 0:
			segments[i] = AnalyzedSegment{
				Index:          s.Index,
				SemanticLabels: []string{"motivation", "success"},
				SemanticScore:  0.72,
				NoveltyScore:   0.68,
				ClarityScore:   0.91,
				Embedding:      []float64{0.12, 0.45, 0.78},
			}
		case 1:
			segments[i] = AnalyzedSegment{
				Index:          s.Index,
				SemanticLabels: []string{"insight", "success", "discipline"},
				SemanticScore:  0.91,
				NoveltyScore:   0.88,
				ClarityScore:   0.94,
				Embedding:      []float64{0.31, 0.72, 0.56},
			}
		default:
			segments[i] = AnalyzedSegment{
				Index:          s.Index,
				SemanticLabels: []string{"motivation", "discipline", "achievement"},
				SemanticScore:  0.95,
				NoveltyScore:   0.92,
				ClarityScore:   0.96,
				Embedding:      []float64{0.67, 0.84, 0.91},
			}
		}
	}

	return &AnalyzeResponse{
		Segments: segments,
		TopicDistribution: []TopicWeight{
			{Topic: "motivation", Weight: 0.4},
			{Topic: "success", Weight: 0.35},
			{Topic: "discipline", Weight: 0.25},
		},
	}, nil
}

func (m *MockService) DetectEmotion(
	ctx context.Context,
	req EmotionRequest,
) (*EmotionResponse, error) {
	_ = ctx

	segments := make([]EmotionSegment, len(req.Segments))

	emotions := []struct {
		emotion  string
		score    float64
		emphasis float64
		energy   float64
		pitch    float64
	}{
		{"neutral", 0.45, 0.50, 0.40, 0.35},
		{"inspiring", 0.82, 0.78, 0.76, 0.70},
		{"excited", 0.94, 0.91, 0.93, 0.88},
	}

	for i, window := range req.Segments {
		e := emotions[i%len(emotions)]

		segments[i] = EmotionSegment{
			Index:               i,
			EmotionType:         e.emotion,
			EmotionScore:        e.score,
			SpeechEmphasisScore: e.emphasis,
			EnergySpike:         e.energy,
			PitchVariation:      e.pitch,
		}

		_ = window
	}

	return &EmotionResponse{
		Segments: segments,
	}, nil
}

func (m *MockService) GenerateShort(
	ctx context.Context,
	req GenerateShortRequest,
) (*GenerateShortResponse, error) {
	_ = ctx

	return &GenerateShortResponse{
		OutputURL: req.VideoURL,
		Duration:  req.EndTime - req.StartTime,
	}, nil
}

func (m *MockService) TrainCPEP(
	ctx context.Context,
	req TrainCPEPRequest,
) (*TrainCPEPResponse, error) {
	_ = ctx
	_ = req

	return &TrainCPEPResponse{
		ModelVersion: "mock-cpep-v1",
		PearsonR:     0.82,
		RMSE:         0.14,
		R2:           0.67,
	}, nil
}
