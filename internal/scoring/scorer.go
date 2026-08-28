package scoring

import (
	"math"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/ml"
)

const (
	weightEmotion  = 0.25
	weightSemantic = 0.30
	weightEmphasis = 0.20
	weightClarity  = 0.15
	weightNovelty  = 0.10
)

type SegmentScore struct {
	Index               int
	Start               float64
	End                 float64
	Text                string
	EmotionScore        float64
	EmotionType         string
	SemanticImpactScore float64
	SpeechEmphasisScore float64
	ClarityScore        float64
	NoveltyScore        float64
	ViralScore          float64
	SemanticLabels      []string
}


func Score(
	transcript ml.TranscribeResponse,
	analysis   ml.AnalyzeResponse,
	emotion    ml.EmotionResponse,
) []SegmentScore {
	analysisMap := make(map[int]ml.AnalyzedSegment, len(analysis.Segments))
	for _, s := range analysis.Segments {
		analysisMap[s.Index] = s
	}

	emotionMap := make(map[int]ml.EmotionSegment, len(emotion.Segments))
	for _, s := range emotion.Segments {
		emotionMap[s.Index] = s
	}

	results := make([]SegmentScore, 0, len(transcript.Segments))
	for _, seg := range transcript.Segments {
		a := analysisMap[seg.Index]
		e := emotionMap[seg.Index]

		ss := SegmentScore{
			Index:               seg.Index,
			Start:               seg.Start,
			End:                 seg.End,
			Text:                seg.Text,
			EmotionScore:        clamp(e.EmotionScore),
			EmotionType:         e.EmotionType,
			SemanticImpactScore: clamp(a.SemanticScore),
			SpeechEmphasisScore: clamp(e.SpeechEmphasisScore),
			ClarityScore:        clamp(a.ClarityScore),
			NoveltyScore:        clamp(a.NoveltyScore),
			SemanticLabels:      a.SemanticLabels,
		}
		ss.ViralScore = computeViralScore(ss)
		results = append(results, ss)
	}
	return results
}

func computeViralScore(s SegmentScore) float64 {
	raw := weightEmotion*s.EmotionScore +
		weightSemantic*s.SemanticImpactScore +
		weightEmphasis*s.SpeechEmphasisScore +
		weightClarity*s.ClarityScore +
		weightNovelty*s.NoveltyScore
	return math.Round(raw*10000) / 10000
}

func PerformanceBand(views48h int64) string {
	switch {
	case views48h >= 100000:
		return "viral"
	case views48h >= 10000:
		return "high"
	case views48h >= 1000:
		return "medium"
	default:
		return "low"
	}
}

func clamp(v float64) float64 {
	if v < 0 {
		return 0
	}
	if v > 1 {
		return 1
	}
	return v
}