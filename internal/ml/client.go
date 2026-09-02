package ml

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type Client struct {
	nlpURL       string
	audioURL     string
	apiKey       string
	callbackBase string
	http         *http.Client
}

func NewClient(nlpURL, audioURL, apiKey, callbackBase string) *Client {
	return &Client{
		nlpURL:       nlpURL,
		audioURL:     audioURL,
		apiKey:       apiKey,
		callbackBase: callbackBase,
		http:         &http.Client{Timeout: 30 * time.Second},
	}
}

// AcceptedResponse is returned immediately by async ML endpoints
type AcceptedResponse struct {
	JobID    string `json:"job_id"`
	Accepted bool   `json:"accepted"`
}

// Results come back via POST to /api/internal/transcription/done
func (c *Client) Transcribe(
	ctx context.Context,
	req TranscribeRequest,
) (*TranscribeResponse, error) {
	type asyncReq struct {
		VideoID     string `json:"videoId"`
		AudioURL    string `json:"audioUrl"`
		CallbackURL string `json:"callbackUrl,omitempty"`
		InternalKey string `json:"internalKey,omitempty"`
	}

	body := asyncReq{
		VideoID:     req.VideoID,
		AudioURL:    req.AudioURL,
		CallbackURL: c.callbackBase + "/api/internal/transcription/done",
		InternalKey: c.apiKey,
	}

	var resp AcceptedResponse

	if err := c.post(
		ctx,
		c.nlpURL+"/transcribe",
		body,
		&resp,
	); err != nil {
		return nil, fmt.Errorf("transcribe: %w", err)
	}

	if !resp.Accepted {
		return nil, fmt.Errorf("transcribe: service rejected job")
	}

	// This endpoint is asynchronous. The actual transcript arrives
	// through /api/internal/transcription/done.
	return &TranscribeResponse{}, nil
}

// Results come back via POST to /api/internal/analysis/done
func (c *Client) Analyze(ctx context.Context, req AnalyzeRequest) (*AnalyzeResponse, error) {
	type asyncReq struct {
		JobID       string              `json:"job_id"`
		VideoID     string              `json:"video_id"`
		UserID      string              `json:"user_id"`
		Language    string              `json:"language"`
		Segments    []TranscriptSegment `json:"segments"`
		FillerWords []FillerWord        `json:"fillerWords"`
		SilenceGaps []SilenceGap        `json:"silenceGaps"`
		CallbackURL string              `json:"callbackUrl,omitempty"`
		InternalKey string              `json:"internalKey,omitempty"`
	}

	body := asyncReq{
		JobID:       req.VideoID,
		VideoID:     req.VideoID,
		UserID:      req.UserID,
		Language:    req.Language,
		Segments:    req.Segments,
		FillerWords: req.FillerWords,
		SilenceGaps: req.SilenceGaps,
		CallbackURL: c.callbackBase + "/api/internal/analysis/done",
		InternalKey: c.apiKey,
	}

	var resp AcceptedResponse
	if err := c.post(ctx, c.nlpURL+"/analyze", body, &resp); err != nil {
		return nil, fmt.Errorf("analyze: %w", err)
	}

	if !resp.Accepted {
		return nil, fmt.Errorf("analyze: service rejected job")
	}

	// The analysis is asynchronous. The actual result arrives
	// later through /api/internal/analysis/done.
	return nil, nil
}

func (c *Client) post(ctx context.Context, url string, body, dest any) error {
	data, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if c.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+c.apiKey)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("http: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		raw, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("status %d: %s", resp.StatusCode, raw)
	}

	return json.NewDecoder(resp.Body).Decode(dest)
}

func (c *Client) DetectEmotion(
	ctx context.Context,
	req EmotionRequest,
) (*EmotionResponse, error) {
	var resp EmotionResponse

	if err := c.post(
		ctx,
		c.audioURL+"/detect-emotion",
		req,
		&resp,
	); err != nil {
		return nil, fmt.Errorf("detect emotion: %w", err)
	}

	return &resp, nil
}

// GenerateShort calls the audio ML service to generate a short.
func (c *Client) GenerateShort(
	ctx context.Context,
	req GenerateShortRequest,
) (*GenerateShortResponse, error) {
	var resp GenerateShortResponse

	if err := c.post(
		ctx,
		c.audioURL+"/create-short",
		req,
		&resp,
	); err != nil {
		return nil, fmt.Errorf("generate short: %w", err)
	}

	return &resp, nil
}

func (c *Client) TrainCPEP(
	ctx context.Context,
	req TrainCPEPRequest,
) (*TrainCPEPResponse, error) {
	var resp TrainCPEPResponse

	if err := c.post(
		ctx,
		c.audioURL+"/train-cpep",
		req,
		&resp,
	); err != nil {
		return nil, fmt.Errorf("train cpep: %w", err)
	}

	return &resp, nil
}
