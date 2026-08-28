package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"sync/atomic"
	"time"
)

type provider string

const (
	providerGroq   provider = "groq"
	providerGemini provider = "gemini"
)

// apiKey tracks state for a single API key — cooldown and request count.
type apiKey struct {
	value    string
	provider provider
	mu       sync.Mutex
	cooldown bool
	resetAt  time.Time
	count    atomic.Int64
}

func (k *apiKey) inCooldown() bool {
	k.mu.Lock()
	defer k.mu.Unlock()
	if k.cooldown && time.Now().After(k.resetAt) {
		k.cooldown = false
	}
	return k.cooldown
}

func (k *apiKey) markCooldown(d time.Duration) {
	k.mu.Lock()
	defer k.mu.Unlock()
	k.cooldown = true
	k.resetAt = time.Now().Add(d)
}

// Rotator manages multiple LLM API keys across Groq (primary) and Gemini (fallback).
// Goroutine-safe — multiple workers can call it simultaneously.
type Rotator struct {
	groqKeys   []*apiKey
	geminiKeys []*apiKey
	counter    atomic.Int64
	httpClient *http.Client
}

// NewRotator builds a Rotator from the key slices loaded from config.
func NewRotator(groqKeys, geminiKeys []string) *Rotator {
	r := &Rotator{
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
	for _, k := range groqKeys {
		r.groqKeys = append(r.groqKeys, &apiKey{value: k, provider: providerGroq})
	}
	for _, k := range geminiKeys {
		r.geminiKeys = append(r.geminiKeys, &apiKey{value: k, provider: providerGemini})
	}
	return r
}

// Call sends a prompt to the best available key, rotating on 429 responses.
// It tries every Groq key before falling back to Gemini.
func (r *Rotator) Call(ctx context.Context, prompt string) (string, error) {
	maxAttempts := len(r.groqKeys) + len(r.geminiKeys)
	if maxAttempts == 0 {
		return "", fmt.Errorf("no LLM keys configured")
	}

	for attempt := 0; attempt < maxAttempts; attempt++ {
		k := r.nextGroqKey()
		if k == nil {
			k = r.nextGeminiKey()
		}
		if k == nil {
			return "", fmt.Errorf("all LLM keys are in cooldown")
		}

		result, rateLimited, err := r.dispatch(ctx, k, prompt)
		if rateLimited {
			k.markCooldown(60 * time.Second)
			continue
		}
		if err != nil {
			return "", err
		}

		k.count.Add(1)
		return result, nil
	}

	return "", fmt.Errorf("all LLM call attempts exhausted")
}

// KeyStatus returns the current state of all keys — used by the admin endpoint.
func (r *Rotator) KeyStatus() []map[string]any {
	var out []map[string]any
	for i, k := range r.groqKeys {
		out = append(out, map[string]any{
			"index":    i + 1,
			"provider": "groq",
			"cooldown": k.inCooldown(),
			"requests": k.count.Load(),
		})
	}
	for i, k := range r.geminiKeys {
		out = append(out, map[string]any{
			"index":    i + 1,
			"provider": "gemini",
			"cooldown": k.inCooldown(),
			"requests": k.count.Load(),
		})
	}
	return out
}

// nextGroqKey returns the next available Groq key using round-robin.
// Returns nil if all Groq keys are currently in cooldown.
func (r *Rotator) nextGroqKey() *apiKey {
	n := len(r.groqKeys)
	if n == 0 {
		return nil
	}
	start := int(r.counter.Add(1)) % n
	for i := 0; i < n; i++ {
		k := r.groqKeys[(start+i)%n]
		if !k.inCooldown() {
			return k
		}
	}
	return nil
}

// nextGeminiKey returns the first available Gemini key.
func (r *Rotator) nextGeminiKey() *apiKey {
	for _, k := range r.geminiKeys {
		if !k.inCooldown() {
			return k
		}
	}
	return nil
}

func (r *Rotator) dispatch(ctx context.Context, k *apiKey, prompt string) (string, bool, error) {
	switch k.provider {
	case providerGroq:
		return r.callGroq(ctx, k, prompt)
	case providerGemini:
		return r.callGemini(ctx, k, prompt)
	default:
		return "", false, fmt.Errorf("unknown provider: %s", k.provider)
	}
}

type groqRequest struct {
	Model    string        `json:"model"`
	Messages []groqMessage `json:"messages"`
}

type groqMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type groqResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func (r *Rotator) callGroq(ctx context.Context, k *apiKey, prompt string) (string, bool, error) {
	body, _ := json.Marshal(groqRequest{
		Model:    "llama-3.3-70b-versatile",
		Messages: []groqMessage{{Role: "user", Content: prompt}},
	})

	req, _ := http.NewRequestWithContext(
		ctx, http.MethodPost,
		"https://api.groq.com/openai/v1/chat/completions",
		bytes.NewReader(body),
	)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+k.value)

	resp, err := r.httpClient.Do(req)
	if err != nil {
		return "", false, fmt.Errorf("groq http: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusTooManyRequests {
		return "", true, fmt.Errorf("groq key rate limited")
	}
	if resp.StatusCode != http.StatusOK {
		return "", false, fmt.Errorf("groq status %d", resp.StatusCode)
	}

	raw, _ := io.ReadAll(resp.Body)
	var result groqResponse
	if err := json.Unmarshal(raw, &result); err != nil {
		return "", false, fmt.Errorf("groq decode: %w", err)
	}
	if len(result.Choices) == 0 {
		return "", false, fmt.Errorf("groq: empty choices")
	}
	return result.Choices[0].Message.Content, false, nil
}

type geminiRequest struct {
	Contents []geminiContent `json:"contents"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

func (r *Rotator) callGemini(ctx context.Context, k *apiKey, prompt string) (string, bool, error) {
	body, _ := json.Marshal(geminiRequest{
		Contents: []geminiContent{
			{Parts: []geminiPart{{Text: prompt}}},
		},
	})

	url := "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + k.value

	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := r.httpClient.Do(req)
	if err != nil {
		return "", false, fmt.Errorf("gemini http: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusTooManyRequests {
		return "", true, fmt.Errorf("gemini key rate limited")
	}
	if resp.StatusCode != http.StatusOK {
		return "", false, fmt.Errorf("gemini status %d", resp.StatusCode)
	}

	raw, _ := io.ReadAll(resp.Body)
	var result geminiResponse
	if err := json.Unmarshal(raw, &result); err != nil {
		return "", false, fmt.Errorf("gemini decode: %w", err)
	}
	if len(result.Candidates) == 0 || len(result.Candidates[0].Content.Parts) == 0 {
		return "", false, fmt.Errorf("gemini: empty response")
	}
	return result.Candidates[0].Content.Parts[0].Text, false, nil
}