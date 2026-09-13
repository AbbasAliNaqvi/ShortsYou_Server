// Package edit contains the typed boundary to the ShortsYou FastAPI renderer.
package edit

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type SFXEvent struct {
	Type     string  `json:"type"`
	AtSecond float64 `json:"at_second"`
}

// CreateShortRequest mirrors the FastAPI CreateShortRequest contract.
type CreateShortRequest struct {
	JobID           string     `json:"job_id"`
	ClipID          string     `json:"clip_id"`
	UserID          string     `json:"user_id"`
	VideoURL        string     `json:"video_url"`
	StartTime       float64    `json:"start_time"`
	EndTime         float64    `json:"end_time"`
	Style           string     `json:"style"`
	HookText        string     `json:"hook_text,omitempty"`
	MusicMood       string     `json:"music_mood,omitempty"`
	RemoveSilences  bool       `json:"remove_silences"`
	RemoveFillers   bool       `json:"remove_fillers"`
	CallbackURL     string     `json:"callback_url"`
	CallbackKey     string     `json:"callback_key"`
	Layout          string     `json:"layout"`
	BackgroundStyle string     `json:"background_style,omitempty"`
	ColorGrade      string     `json:"color_grade,omitempty"`
	CaptionStyle    string     `json:"caption_style,omitempty"`
	EmotionType     string     `json:"emotion_type"`
	SFXEvents       []SFXEvent `json:"sfx_events"`
}

type CreateShortResponse struct {
	JobID      string `json:"job_id"`
	Accepted   bool   `json:"accepted"`
	ETASeconds int    `json:"eta_seconds"`
}

type HealthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
	Version string `json:"version"`
}

type Client struct {
	baseURL string
	http    *http.Client
}

func NewClient(baseURL string) *Client {
	// The renderer accepts jobs immediately, but a busy local FFmpeg worker can
	// briefly delay the event loop. Do not re-submit the same render prematurely.
	return &Client{baseURL: strings.TrimRight(baseURL, "/"), http: &http.Client{Timeout: 2 * time.Minute}}
}

func (c *Client) CreateShort(ctx context.Context, request CreateShortRequest) (*CreateShortResponse, error) {
	var response CreateShortResponse
	if err := c.doJSON(ctx, http.MethodPost, "/create-short", request, &response); err != nil {
		return nil, err
	}
	if !response.Accepted || response.JobID == "" {
		return nil, fmt.Errorf("edit service did not accept render job %q", request.JobID)
	}
	return &response, nil
}

func (c *Client) Health(ctx context.Context) (*HealthResponse, error) {
	var response HealthResponse
	if err := c.doJSON(ctx, http.MethodGet, "/health", nil, &response); err != nil {
		return nil, err
	}
	if response.Status != "ok" {
		return nil, fmt.Errorf("edit service is unhealthy: %s", response.Status)
	}
	return &response, nil
}

func (c *Client) doJSON(ctx context.Context, method, path string, input, output any) error {
	var body io.Reader
	if input != nil {
		data, err := json.Marshal(input)
		if err != nil {
			return fmt.Errorf("marshal edit request: %w", err)
		}
		body = bytes.NewReader(data)
	}
	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, body)
	if err != nil {
		return fmt.Errorf("create edit request: %w", err)
	}
	if input != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("call edit service: %w", err)
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return fmt.Errorf("read edit response: %w", err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("edit service returned %d: %s", resp.StatusCode, strings.TrimSpace(string(data)))
	}
	if err := json.Unmarshal(data, output); err != nil {
		return fmt.Errorf("decode edit response: %w", err)
	}
	return nil
}
