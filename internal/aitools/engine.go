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

type AutoComposeResult struct {
	StartTime       float64 `json:"startTime"`
	EndTime         float64 `json:"endTime"`
	Duration        float64 `json:"duration"`
	HookText        string  `json:"hookText"`
	CaptionStyle    string  `json:"captionStyle"`
	ColorGrade      string  `json:"colorGrade"`
	MusicMood       string  `json:"musicMood"`
	BackgroundStyle string  `json:"backgroundStyle"`
	Layout          string  `json:"layout"`
	Reasoning       string  `json:"reasoning"`
}

type HookVariation struct {
	Tone string `json:"tone"`
	Text string `json:"text"`
}

// AutoComposeClip acts as an AI agentic video director, selecting the exact optimal start/end
// timestamps, high-curiosity viral hook, captions, color grade, and background framing.
func (e *Engine) AutoComposeClip(
	ctx context.Context,
	videoTitle string,
	transcriptSnippet string,
	videoDuration float64,
) AutoComposeResult {
	maxDur := 30.0
	if videoDuration > 0 && videoDuration < maxDur {
		maxDur = videoDuration
	}

	defaultResult := AutoComposeResult{
		StartTime:       0.0,
		EndTime:         maxDur,
		Duration:        maxDur,
		HookText:        deriveFallbackHook(videoTitle),
		CaptionStyle:    "karaoke",
		ColorGrade:      "vibrant",
		MusicMood:       "energetic",
		BackgroundStyle: "crop",
		Layout:          "standard",
		Reasoning:       "AI Agent targeted high-energy opening sequence with vertical 9:16 framing.",
	}
	if defaultResult.HookText == "" {
		defaultResult.HookText = "Watch This Until The End"
	}

	callCtx, cancel := context.WithTimeout(ctx, 8*time.Second)
	defer cancel()

	prompt := fmt.Sprintf(`You are an elite short-form video director (Opus Clip / CapCut style).
Analyze this footage and determine the single most viral 20-35 second Short.

Video Title: %q
Video Duration: %.1f seconds
Transcript / Content:
%s

Determine:
1. start_time (seconds, between 0 and %.1f)
2. end_time (seconds, start_time + 18 to 35 seconds, never exceeding %.1f)
3. hook_text (viral curiosity hook under 7 words to stop scroll in first 3s)
4. caption_style ("karaoke" | "bold" | "minimal")
5. color_grade ("vibrant" | "cinematic" | "warm" | "cool")
6. music_mood ("energetic" | "motivational" | "dramatic" | "calm")
7. reasoning (brief 1-sentence explanation of why this moment will hook viewers)

Return ONLY valid JSON matching this schema:
{
  "start_time": 12.0,
  "end_time": 41.5,
  "hook_text": "The 1 Rule You Must Follow",
  "caption_style": "karaoke",
  "color_grade": "vibrant",
  "music_mood": "energetic",
  "reasoning": "High narrative momentum with emotional peak between 15s and 38s."
}`, videoTitle, videoDuration, truncate(transcriptSnippet, 1200), videoDuration, videoDuration)

	resp, err := e.rotator.Call(callCtx, prompt)
	if err != nil {
		e.log.Warn().Err(err).Msg("auto compose llm call failed — using agentic fallback")
		return defaultResult
	}

	match := jsonObjRegex.FindString(strings.TrimSpace(resp))
	if match == "" {
		return defaultResult
	}

	type parsedOutput struct {
		StartTime    float64 `json:"start_time"`
		EndTime      float64 `json:"end_time"`
		HookText     string  `json:"hook_text"`
		CaptionStyle string  `json:"caption_style"`
		ColorGrade   string  `json:"color_grade"`
		MusicMood    string  `json:"music_mood"`
		Reasoning    string  `json:"reasoning"`
	}

	var parsed parsedOutput
	if err := json.Unmarshal([]byte(match), &parsed); err != nil {
		return defaultResult
	}

	if parsed.EndTime <= parsed.StartTime || parsed.StartTime < 0 {
		return defaultResult
	}
	if videoDuration > 0 && parsed.EndTime > videoDuration {
		parsed.EndTime = videoDuration
	}
	if parsed.EndTime-parsed.StartTime < 5.0 {
		parsed.EndTime = minFloat(videoDuration, parsed.StartTime+30.0)
	}

	hook := strings.Trim(strings.TrimSpace(parsed.HookText), `"'“”`)
	if hook == "" || len(hook) > 80 {
		hook = defaultResult.HookText
	}

	style := parsed.CaptionStyle
	if style != "karaoke" && style != "bold" && style != "minimal" {
		style = "karaoke"
	}
	grade := parsed.ColorGrade
	if grade != "vibrant" && grade != "cinematic" && grade != "warm" && grade != "cool" {
		grade = "vibrant"
	}
	mood := parsed.MusicMood
	if mood != "energetic" && mood != "motivational" && mood != "dramatic" && mood != "calm" {
		mood = "energetic"
	}
	reason := strings.TrimSpace(parsed.Reasoning)
	if reason == "" {
		reason = "AI Agent identified peak audience retention and emotional curiosity."
	}

	return AutoComposeResult{
		StartTime:       parsed.StartTime,
		EndTime:         parsed.EndTime,
		Duration:        parsed.EndTime - parsed.StartTime,
		HookText:        hook,
		CaptionStyle:    style,
		ColorGrade:      grade,
		MusicMood:       mood,
		BackgroundStyle: "crop",
		Layout:          "standard",
		Reasoning:       reason,
	}
}

// GenerateViralHookVariations generates 5 distinct psychological hook angles for creators.
func (e *Engine) GenerateViralHookVariations(
	ctx context.Context,
	videoTitle string,
	clipText string,
) []HookVariation {
	callCtx, cancel := context.WithTimeout(ctx, 8*time.Second)
	defer cancel()

	source := clipText
	if strings.TrimSpace(source) == "" {
		source = videoTitle
	}

	prompt := fmt.Sprintf(`Generate 5 distinct viral hooks for a YouTube Short based on this footage.
Each hook must be under 7 words. No hashtags. No quotes.

Footage: %s

Return ONLY valid JSON matching this schema:
[
  {"tone": "Curiosity Gap", "text": "..."},
  {"tone": "Controversial", "text": "..."},
  {"tone": "Story Hook", "text": "..."},
  {"tone": "Direct Question", "text": "..."},
  {"tone": "Secret Revealed", "text": "..."}
]`, truncate(source, 600))

	resp, err := e.rotator.Call(callCtx, prompt)
	if err == nil {
		match := jsonBlockRegex.FindString(strings.TrimSpace(resp))
		if match != "" {
			var vars []HookVariation
			if err := json.Unmarshal([]byte(match), &vars); err == nil && len(vars) > 0 {
				return vars
			}
		}
	}

	base := deriveFallbackHook(source)
	if base == "" {
		base = "What Nobody Tells You About This"
	}

	return []HookVariation{
		{Tone: "Curiosity Gap", Text: base},
		{Tone: "Controversial", Text: "The Hard Truth Nobody Wants To Hear"},
		{Tone: "Story Hook", Text: "This Happened When Least Expected"},
		{Tone: "Direct Question", Text: "Did You Know This Actually Works?"},
		{Tone: "Secret Revealed", Text: "The Exact Secret High Achievers Use"},
	}
}

func minFloat(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
