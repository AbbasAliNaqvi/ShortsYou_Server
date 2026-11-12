package telegram

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/config"
)

type Client struct {
	baseURL string
	apiKey  string
	http    *http.Client
}

type Notification struct {
	TelegramID int64  `json:"telegramId"`
	Type       string `json:"type"`
	Title      string `json:"title"`
	Message    string `json:"message"`
	VideoURL   string `json:"videoUrl,omitempty"`
	ClipID     string `json:"clipId,omitempty"`
	JobID      string `json:"jobId,omitempty"`
}

func NewClient(cfg *config.Config) *Client {
	return &Client{
		baseURL: strings.TrimRight(cfg.TelegramBotURL, "/"),
		apiKey:  cfg.TelegramServiceKey,
		http:    &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *Client) Enabled() bool {
	return c != nil && c.baseURL != "" && c.apiKey != ""
}

func (c *Client) Notify(ctx context.Context, notification Notification) error {
	if !c.Enabled() {
		return nil
	}
	body, err := json.Marshal(notification)
	if err != nil {
		return fmt.Errorf("marshal telegram notification: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/internal/notifications", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("build telegram notification request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Internal-API-Key", c.apiKey)
	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("send telegram notification: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("telegram notification returned status %d", resp.StatusCode)
	}
	return nil
}
