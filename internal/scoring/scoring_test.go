package scoring

import (
	"context"
	"testing"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/ml"
)

func TestMockMLScoringPipeline(t *testing.T) {
	ctx := context.Background()
	mock := ml.NewMockService()

	transcription, err := mock.Transcribe(ctx, ml.TranscribeRequest{
		VideoID:  "test-video",
		AudioURL: "mock://audio",
	})
	if err != nil {
		t.Fatalf("transcribe: %v", err)
	}

	analysis, err := mock.Analyze(ctx, ml.AnalyzeRequest{
		VideoID:  "test-video",
		UserID:   "test-user",
		Segments: transcription.Segments,
	})
	if err != nil {
		t.Fatalf("analyze: %v", err)
	}

	windows := make([]ml.SegmentWindow, len(transcription.Segments))
	for i, segment := range transcription.Segments {
		windows[i] = ml.SegmentWindow{
			Start: segment.Start,
			End:   segment.End,
		}
	}

	emotion, err := mock.DetectEmotion(ctx, ml.EmotionRequest{
		VideoID:  "test-video",
		AudioURL: "mock://audio",
		Segments: windows,
	})
	if err != nil {
		t.Fatalf("emotion: %v", err)
	}

	scores := Score(*transcription, *analysis, *emotion)

	if len(scores) != 3 {
		t.Fatalf("expected 3 scores, got %d", len(scores))
	}

	expected := []float64{
		0.6330,
		0.8630,
		0.9380,
	}

	for i, score := range scores {
		if score.ViralScore != expected[i] {
			t.Errorf(
				"segment %d: expected score %.4f, got %.4f",
				i,
				expected[i],
				score.ViralScore,
			)
		}
	}

	if scores[2].ViralScore <= scores[1].ViralScore {
		t.Fatal("expected segment 2 to outperform segment 1")
	}

	if scores[1].ViralScore <= scores[0].ViralScore {
		t.Fatal("expected segment 1 to outperform segment 0")
	}
}
