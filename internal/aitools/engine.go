package aitools

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/edit"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/llm"
	"github.com/rs/zerolog"
)

var jsonBlockRegex = regexp.MustCompile(`(?s)\[\s*\{.*\}\s*\]`)
var jsonObjRegex = regexp.MustCompile(`(?s)\{.*\}`)

type Engine struct {
	rotator *llm.Rotator
	log     zerolog.Logger
}

func NewEngine(rotator *llm.Rotator, log zerolog.Logger) *Engine {
	return &Engine{
		rotator: rotator,
		log:     log.With().Str("component", "ai_tools").Logger(),
	}
}

// PlanAudioEffects uses the Groq LLM to intelligently analyze the clip text and word timestamps,
// generating precision-timed sound effects that match key narrative shifts and punchlines.
func (e *Engine) PlanAudioEffects(
	ctx context.Context,
	clipText string,
	words []edit.CaptionWord,
	duration float64,
	emotion string,
) []edit.SFXEvent {
	if duration <= 1.5 {
		return []edit.SFXEvent{
			{Type: "whoosh", AtSecond: 0.0},
		}
	}

	callCtx, cancel := context.WithTimeout(ctx, 6*time.Second)
	defer cancel()

	var transcriptSnippet strings.Builder
	for i, w := range words {
		if i > 40 {
			transcriptSnippet.WriteString("...")
			break
		}
		transcriptSnippet.WriteString(fmt.Sprintf("[%.1fs] %s ", w.Start, w.Word))
	}
	if transcriptSnippet.Len() == 0 {
		transcriptSnippet.WriteString(clipText)
	}

	prompt := fmt.Sprintf(`You are an expert viral short-form video sound designer (OpusClip, CapCut, TikTok).
Your task is to analyze the spoken transcript of a short video and place high-impact, contextual sound effects (SFX) at exact timestamps to maximize viewer retention and engagement.

Clip Duration: %.2f seconds
Detected Emotion: %s
Transcript & Timestamps (relative to 0.0s):
%s

Available SFX Types:
- "whoosh": Rapid transition, scene start, scroll stopper, or camera pan. (Best at 0.0s or major topic shifts).
- "pop": Subtle sound effect for list items, single words, tips, or stat reveals.
- "ding": Eureka/aha moments, clever thoughts, key takeaways, success sounds.
- "impact": Dramatic punchline, shocking revelation, strong declarative statement.
- "bass_drop": Major plot twist, serious climax, heavy emphasis.
- "riser": Tension-building sound 2-3 seconds BEFORE a climax or reveal.
- "laugh_light": Light giggle or witty comment.
- "laugh": Out loud funny moment or joke punchline.
- "applause": Final victory, celebration, or wrap-up.
- "shocked": Gasp, surprise, disbelief.

Rules:
1. Return between 2 and 5 well-timed sound effects spaced apart across the clip (never cluster within 1.5 seconds of each other).
2. "at_second" MUST be a float between 0.0 and %.2f.
3. Every sound effect must directly match the spoken words or narrative beat at that timestamp.
4. Output MUST be ONLY valid JSON matching this schema:
[
  {"type": "whoosh", "at_second": 0.0, "reason": "Scroll stopper hook"},
  {"type": "ding", "at_second": 4.5, "reason": "Key statistic"},
  {"type": "impact", "at_second": 18.2, "reason": "Punchline reveal"}
]`, duration, emotion, transcriptSnippet.String(), duration)

	resp, err := e.rotator.Call(callCtx, prompt)
	if err != nil {
		e.log.Warn().Err(err).Msg("LLM SFX planning failed — applying dynamic fallback")
		return e.fallbackSFX(duration, emotion)
	}

	events := e.parseSFXResponse(resp, duration)
	if len(events) == 0 {
		e.log.Warn().Str("raw", resp).Msg("LLM returned no valid SFX events — applying dynamic fallback")
		return e.fallbackSFX(duration, emotion)
	}

	e.log.Info().Int("sfxCount", len(events)).Msg("AI sound designer planned SFX events")
	return events
}

func (e *Engine) parseSFXResponse(raw string, duration float64) []edit.SFXEvent {
	clean := strings.TrimSpace(raw)
	match := jsonBlockRegex.FindString(clean)
	if match != "" {
		clean = match
	}

	var items []SFXPlanningItem
	if err := json.Unmarshal([]byte(clean), &items); err != nil {
		return nil
	}

	allowedTypes := map[string]bool{
		"whoosh": true, "whoosh_slow": true, "impact": true, "bass_drop": true,
		"pop": true, "ding": true, "laugh": true, "laugh_light": true,
		"shocked": true, "applause": true, "riser": true, "love": true,
	}

	var events []edit.SFXEvent
	var lastTime float64 = -2.0

	// Always ensure an intro whoosh at 0.0s for scroll-stopping hook
	hasIntro := false

	for _, item := range items {
		t := strings.ToLower(strings.TrimSpace(item.Type))
		if !allowedTypes[t] {
			continue
		}
		atSec := item.AtSecond
		if atSec < 0.0 {
			atSec = 0.0
		}
		if atSec > duration {
			atSec = duration - 0.5
		}

		if atSec <= 0.5 {
			hasIntro = true
		}

		if atSec-lastTime >= 1.2 {
			events = append(events, edit.SFXEvent{
				Type:     t,
				AtSecond: atSec,
			})
			lastTime = atSec
		}
	}

	if !hasIntro {
		events = append([]edit.SFXEvent{{Type: "whoosh", AtSecond: 0.0}}, events...)
	}

	sort.Slice(events, func(i, j int) bool {
		return events[i].AtSecond < events[j].AtSecond
	})

	return events
}

func (e *Engine) fallbackSFX(duration float64, emotion string) []edit.SFXEvent {
	events := []edit.SFXEvent{
		{Type: "whoosh", AtSecond: 0.0},
	}

	if duration >= 8.0 {
		events = append(events, edit.SFXEvent{
			Type:     "pop",
			AtSecond: duration * 0.35,
		})
	}

	if duration >= 15.0 {
		climaxType := "impact"
		if emotion == "happy" || emotion == "humorous" {
			climaxType = "laugh_light"
		} else if emotion == "serious" {
			climaxType = "bass_drop"
		}
		events = append(events, edit.SFXEvent{
			Type:     climaxType,
			AtSecond: duration * 0.75,
		})
	}

	return events
}

// GenerateViralHook uses the Groq LLM to generate an engaging, concise hook banner text.
func (e *Engine) GenerateViralHook(ctx context.Context, clipText string, emotion string) string {
	callCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	prompt := fmt.Sprintf(`Generate a viral, curiosity-inducing hook headline for this short video clip.
The hook will appear at the top of the video in the first 3 seconds to stop viewers from scrolling.
Rules:
- Length: between 3 and 7 words.
- Tone: punchy, curious, urgent, or emotional.
- Do NOT use clickbait jargon or hashtags.
- Output ONLY the hook text and nothing else.

Emotion: %s
Spoken text: %s`, emotion, clipText)

	resp, err := e.rotator.Call(callCtx, prompt)
	if err != nil {
		e.log.Warn().Err(err).Msg("hook generation failed — deriving contextual fallback")
		return deriveFallbackHook(clipText)
	}

	hook := strings.TrimSpace(resp)
	hook = strings.Trim(hook, `"'“”`)
	if hook == "" || len(hook) > 80 {
		return deriveFallbackHook(clipText)
	}
	return hook
}

func deriveFallbackHook(text string) string {
	clean := strings.TrimSpace(text)
	if clean == "" {
		return ""
	}
	words := strings.Fields(clean)
	if len(words) <= 7 {
		return clean
	}
	return strings.Join(words[:7], " ") + "..."
}

// DetectClipDynamics recommends dynamic audio and visual style settings for a clip.
func (e *Engine) DetectClipDynamics(ctx context.Context, clipText string) ClipDynamics {
	defaultDynamics := ClipDynamics{
		MusicMood:    "energetic",
		EmotionType:  "excited",
		ColorGrade:   "warm",
		CaptionStyle: "karaoke",
	}

	callCtx, cancel := context.WithTimeout(ctx, 4*time.Second)
	defer cancel()

	prompt := fmt.Sprintf(`Analyze this short-form video transcript and select the best visual and audio dynamic presets.
Transcript: %q

Return ONLY valid JSON matching this schema:
{
  "music_mood": "energetic" | "calm" | "dramatic" | "motivational" | "neutral",
  "emotion_type": "excited" | "happy" | "serious" | "curious" | "shocked",
  "color_grade": "warm" | "cinematic" | "vibrant" | "cool" | "natural",
  "caption_style": "karaoke" | "bold" | "minimal"
}`, clipText)

	resp, err := e.rotator.Call(callCtx, prompt)
	if err != nil {
		return defaultDynamics
	}

	match := jsonObjRegex.FindString(strings.TrimSpace(resp))
	if match == "" {
		return defaultDynamics
	}

	var d ClipDynamics
	if err := json.Unmarshal([]byte(match), &d); err != nil {
		return defaultDynamics
	}

	if d.MusicMood == "" {
		d.MusicMood = defaultDynamics.MusicMood
	}
	if d.EmotionType == "" {
		d.EmotionType = defaultDynamics.EmotionType
	}
	if d.ColorGrade == "" {
		d.ColorGrade = defaultDynamics.ColorGrade
	}
	if d.CaptionStyle == "" {
		d.CaptionStyle = defaultDynamics.CaptionStyle
	}

	return d
}
