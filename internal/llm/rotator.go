package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

type provider string

const (
	providerGroq   provider = "groq"
	providerGemini provider = "gemini"
)

const groqModel = "openai/gpt-oss-20b"

type apiKey struct {
	value    string
	provider provider

	mu       sync.Mutex
	cooldown bool
	resetAt  time.Time

	count    atomic.Int64
	failures atomic.Int64
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

func (k *apiKey) markFailure(d time.Duration) {
	k.mu.Lock()
	defer k.mu.Unlock()

	k.cooldown = true
	k.resetAt = time.Now().Add(d)
	k.failures.Add(1)
}

type Rotator struct {
	groqKeys   []*apiKey
	geminiKeys []*apiKey

	groqCounter   atomic.Int64
	geminiCounter atomic.Int64

	httpClient *http.Client
}

func NewRotator(groqKeys, geminiKeys []string) *Rotator {
	r := &Rotator{
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}

	for _, key := range groqKeys {
		key = strings.TrimSpace(key)

		if key == "" {
			continue
		}

		r.groqKeys = append(r.groqKeys, &apiKey{
			value:    key,
			provider: providerGroq,
		})
	}

	for _, key := range geminiKeys {
		key = strings.TrimSpace(key)

		if key == "" {
			continue
		}

		r.geminiKeys = append(r.geminiKeys, &apiKey{
			value:    key,
			provider: providerGemini,
		})
	}

	return r
}

func (r *Rotator) Call(
	ctx context.Context,
	prompt string,
) (string, error) {

	maxAttempts := len(r.groqKeys) + len(r.geminiKeys)

	if maxAttempts == 0 {
		return "", fmt.Errorf("no LLM keys configured")
	}

	var lastErr error

	for attempt := 0; attempt < maxAttempts; attempt++ {
		var k *apiKey

		k = r.nextGroqKey()

		if k == nil {
			k = r.nextGeminiKey()
		}

		if k == nil {
			break
		}

		result, rateLimited, cooldown, err := r.dispatch(
			ctx,
			k,
			prompt,
		)

		if err == nil {
			k.count.Add(1)
			return result, nil
		}

		if ctx.Err() != nil {
			return "", ctx.Err()
		}

		lastErr = err

		if rateLimited {
			k.markCooldown(cooldown)
			continue
		}

		k.markFailure(10 * time.Second)
	}

	if lastErr != nil {
		return "", fmt.Errorf(
			"all LLM providers failed: %w",
			lastErr,
		)
	}

	return "", fmt.Errorf(
		"all LLM keys are in cooldown",
	)
}

func (r *Rotator) KeyStatus() []map[string]any {
	var out []map[string]any

	for i, k := range r.groqKeys {
		out = append(out, map[string]any{
			"index":    i + 1,
			"provider": "groq",
			"cooldown": k.inCooldown(),
			"requests": k.count.Load(),
			"failures": k.failures.Load(),
		})
	}

	for i, k := range r.geminiKeys {
		out = append(out, map[string]any{
			"index":    i + 1,
			"provider": "gemini",
			"cooldown": k.inCooldown(),
			"requests": k.count.Load(),
			"failures": k.failures.Load(),
		})
	}

	return out
}

func (r *Rotator) nextGroqKey() *apiKey {
	return r.nextKey(
		r.groqKeys,
		&r.groqCounter,
	)
}

func (r *Rotator) nextGeminiKey() *apiKey {
	return r.nextKey(
		r.geminiKeys,
		&r.geminiCounter,
	)
}

func (r *Rotator) nextKey(
	keys []*apiKey,
	counter *atomic.Int64,
) *apiKey {

	n := len(keys)

	if n == 0 {
		return nil
	}

	start := int(counter.Add(1)-1) % n

	for i := 0; i < n; i++ {
		k := keys[(start+i)%n]

		if !k.inCooldown() {
			return k
		}
	}

	return nil
}

func (r *Rotator) dispatch(
	ctx context.Context,
	k *apiKey,
	prompt string,
) (string, bool, time.Duration, error) {

	switch k.provider {
	case providerGroq:
		return r.callGroq(ctx, k, prompt)

	case providerGemini:
		return r.callGemini(ctx, k, prompt)

	default:
		return "", false, 0, fmt.Errorf(
			"unknown provider: %s",
			k.provider,
		)
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
			Role      string `json:"role"`
			Content   string `json:"content"`
			Reasoning string `json:"reasoning"`
		} `json:"message"`
	} `json:"choices"`
}

func (r *Rotator) callGroq(
	ctx context.Context,
	k *apiKey,
	prompt string,
) (string, bool, time.Duration, error) {

	body, err := json.Marshal(groqRequest{
		Model: groqModel,
		Messages: []groqMessage{
			{
				Role:    "user",
				Content: prompt,
			},
		},
	})

	if err != nil {
		return "", false, 0, fmt.Errorf(
			"groq marshal: %w",
			err,
		)
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		"https://api.groq.com/openai/v1/chat/completions",
		bytes.NewReader(body),
	)

	if err != nil {
		return "", false, 0, fmt.Errorf(
			"groq request: %w",
			err,
		)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+k.value)

	resp, err := r.httpClient.Do(req)

	if err != nil {
		return "", false, 0, fmt.Errorf(
			"groq http: %w",
			err,
		)
	}

	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)

	if err != nil {
		return "", false, 0, fmt.Errorf(
			"groq read response: %w",
			err,
		)
	}

	if resp.StatusCode == http.StatusTooManyRequests {
		cooldown := groqResetDuration(resp)

		return "",
			true,
			cooldown,
			fmt.Errorf(
				"groq rate limited: %s",
				string(raw),
			)
	}

	if resp.StatusCode != http.StatusOK {
		return "",
			false,
			0,
			fmt.Errorf(
				"groq status %d: %s",
				resp.StatusCode,
				string(raw),
			)
	}

	var result groqResponse

	if err := json.Unmarshal(raw, &result); err != nil {
		return "",
			false,
			0,
			fmt.Errorf(
				"groq decode: %w; body=%s",
				err,
				string(raw),
			)
	}

	if len(result.Choices) == 0 {
		return "",
			false,
			0,
			fmt.Errorf(
				"groq: empty choices; body=%s",
				string(raw),
			)
	}

	content := result.Choices[0].Message.Content

	if strings.TrimSpace(content) == "" {
		return "",
			false,
			0,
			fmt.Errorf(
				"groq: empty content; body=%s",
				string(raw),
			)
	}

	return content, false, 0, nil
}

func groqResetDuration(resp *http.Response) time.Duration {
	requestReset := parseGroqDuration(
		resp.Header.Get("x-ratelimit-reset-requests"),
	)

	tokenReset := parseGroqDuration(
		resp.Header.Get("x-ratelimit-reset-tokens"),
	)

	cooldown := requestReset

	if tokenReset > cooldown {
		cooldown = tokenReset
	}

	if cooldown <= 0 {
		cooldown = 60 * time.Second
	}

	if cooldown > 10*time.Minute {
		cooldown = 10 * time.Minute
	}

	return cooldown
}

func parseGroqDuration(value string) time.Duration {
	value = strings.TrimSpace(value)

	if value == "" {
		return 0
	}

	if d, err := time.ParseDuration(value); err == nil {
		return d
	}

	if seconds, err := strconv.ParseFloat(value, 64); err == nil {
		return time.Duration(seconds * float64(time.Second))
	}

	return 0
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

func (r *Rotator) callGemini(
	ctx context.Context,
	k *apiKey,
	prompt string,
) (string, bool, time.Duration, error) {

	body, err := json.Marshal(geminiRequest{
		Contents: []geminiContent{
			{
				Parts: []geminiPart{
					{
						Text: prompt,
					},
				},
			},
		},
	})

	if err != nil {
		return "", false, 0, fmt.Errorf(
			"gemini marshal: %w",
			err,
		)
	}

	url := "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + k.value

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		url,
		bytes.NewReader(body),
	)

	if err != nil {
		return "", false, 0, fmt.Errorf(
			"gemini request: %w",
			err,
		)
	}

	req.Header.Set(
		"Content-Type",
		"application/json",
	)

	resp, err := r.httpClient.Do(req)

	if err != nil {
		return "", false, 0, fmt.Errorf(
			"gemini http: %w",
			err,
		)
	}

	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)

	if err != nil {
		return "", false, 0, fmt.Errorf(
			"gemini read response: %w",
			err,
		)
	}

	if resp.StatusCode == http.StatusTooManyRequests {
		return "",
			true,
			60 * time.Second,
			fmt.Errorf(
				"gemini rate limited: %s",
				string(raw),
			)
	}

	if resp.StatusCode != http.StatusOK {
		return "",
			false,
			0,
			fmt.Errorf(
				"gemini status %d: %s",
				resp.StatusCode,
				string(raw),
			)
	}

	var result geminiResponse

	if err := json.Unmarshal(raw, &result); err != nil {
		return "",
			false,
			0,
			fmt.Errorf(
				"gemini decode: %w; body=%s",
				err,
				string(raw),
			)
	}

	if len(result.Candidates) == 0 {
		return "",
			false,
			0,
			fmt.Errorf(
				"gemini: empty candidates; body=%s",
				string(raw),
			)
	}

	if len(result.Candidates[0].Content.Parts) == 0 {
		return "",
			false,
			0,
			fmt.Errorf(
				"gemini: empty parts; body=%s",
				string(raw),
			)
	}

	content := result.Candidates[0].Content.Parts[0].Text

	if strings.TrimSpace(content) == "" {
		return "",
			false,
			0,
			fmt.Errorf(
				"gemini: empty content; body=%s",
				string(raw),
			)
	}

	return content, false, 0, nil
}