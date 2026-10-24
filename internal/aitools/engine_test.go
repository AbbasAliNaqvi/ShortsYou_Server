package aitools

import (
	"context"
	"testing"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/llm"
	"github.com/rs/zerolog"
)

func TestParseSFXResponse(t *testing.T) {
	engine := NewEngine(llm.NewRotator(nil, nil), zerolog.Nop())

	rawJSON := `[
		{"type": "whoosh", "at_second": 0.0, "reason": "Intro"},
		{"type": "ding", "at_second": 4.5, "reason": "Tip"},
		{"type": "impact", "at_second": 12.0, "reason": "Climax"}
	]`

	events := engine.parseSFXResponse(rawJSON, 15.0)
	if len(events) != 3 {
		t.Fatalf("expected 3 SFX events, got %d", len(events))
	}

	if events[0].Type != "whoosh" || events[0].AtSecond != 0.0 {
		t.Errorf("unexpected first event: %+v", events[0])
	}
	if events[1].Type != "ding" || events[1].AtSecond != 4.5 {
		t.Errorf("unexpected second event: %+v", events[1])
	}
	if events[2].Type != "impact" || events[2].AtSecond != 12.0 {
		t.Errorf("unexpected third event: %+v", events[2])
	}
}

func TestFallbackSFX(t *testing.T) {
	engine := NewEngine(llm.NewRotator(nil, nil), zerolog.Nop())

	events := engine.fallbackSFX(20.0, "excited")
	if len(events) < 3 {
		t.Fatalf("expected at least 3 fallback SFX events for 20s clip, got %d", len(events))
	}
	if events[0].Type != "whoosh" {
		t.Errorf("expected whoosh at start, got %s", events[0].Type)
	}
}

func TestPlanAudioEffectsFallback(t *testing.T) {
	engine := NewEngine(llm.NewRotator(nil, nil), zerolog.Nop())

	events := engine.PlanAudioEffects(context.Background(), "test transcript", nil, 25.0, "excited")
	if len(events) == 0 {
		t.Fatal("expected non-empty SFX events even when LLM is unconfigured")
	}
}
