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
	nlpURL   string
	audioURL string
	http     *http.Client
}

func NewClient(nlpServiceURL, audioServiceURL string) *Client {
	return &Client{
		nlpURL:   nlpServiceURL,
		audioURL: audioServiceURL,
		http:     &http.Client{Timeout: 10 * time.Minute},
	}
}

func (c *Client) Transcribe(ctx context.Context, req TranscribeRequest) (*TranscribeResponse, error) {
	var resp TranscribeResponse
	if err := c.post(ctx, c.nlpURL+"/transcribe", req, &resp); err != nil {
		return nil, fmt.Errorf("transcribe: %w", err)
	}
	return &resp, nil
}

func (c *Client) Analyze(ctx context.Context, req AnalyzeRequest) (*AnalyzeResponse, error) {
	var resp AnalyzeResponse
	if err := c.post(ctx, c.nlpURL+"/analyze", req, &resp); err != nil {
		return nil, fmt.Errorf("analyze: %w", err)
	}
	return &resp, nil
}

func (c *Client) DetectEmotion(ctx context.Context, req EmotionRequest) (*EmotionResponse, error) {
	var resp EmotionResponse
	if err := c.post(ctx, c.audioURL+"/emotion", req, &resp); err != nil {
		return nil, fmt.Errorf("detect emotion: %w", err)
	}
	return &resp, nil
}

func (c *Client) GenerateShort(ctx context.Context, req GenerateShortRequest) (*GenerateShortResponse, error) {
	var resp GenerateShortResponse
	if err := c.post(ctx, c.audioURL+"/generate-short", req, &resp); err != nil {
		return nil, fmt.Errorf("generate short: %w", err)
	}
	return &resp, nil
}

// TrainCPEP triggers XGBoost retraining on a creator's labeled feature matrix.
func (c *Client) TrainCPEP(ctx context.Context, req TrainCPEPRequest) (*TrainCPEPResponse, error) {
	var resp TrainCPEPResponse
	if err := c.post(ctx, c.audioURL+"/train-cpep", req, &resp); err != nil {
		return nil, fmt.Errorf("train cpep: %w", err)
	}
	return &resp, nil
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

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("http: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		raw, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("status %d: %s", resp.StatusCode, raw)
	}

	if err := json.NewDecoder(resp.Body).Decode(dest); err != nil {
		return fmt.Errorf("decode response: %w", err)
	}
	return nil
}
