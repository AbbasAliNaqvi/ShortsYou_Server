package storage

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"
)

type SupabaseClient struct {
	baseURL string
	apiKey  string
	http    *http.Client
}

func NewSupabase(baseURL, apiKey string) *SupabaseClient {
	return &SupabaseClient{
		baseURL: strings.TrimRight(baseURL, "/"),
		apiKey:  apiKey,
		http: &http.Client{
			Timeout: 10 * time.Minute,
		},
	}
}


func (s *SupabaseClient) Upload(
	ctx context.Context,
	bucket string,
	objectPath string,
	contentType string,
	data []byte,
) (string, error) {
	if bucket == "" {
		return "", fmt.Errorf("bucket is required")
	}

	if objectPath == "" {
		return "", fmt.Errorf("object path is required")
	}

	if contentType == "" {
		contentType = "application/octet-stream"
	}

	endpoint := fmt.Sprintf(
		"%s/storage/v1/object/%s/%s",
		s.baseURL,
		url.PathEscape(bucket),
		escapeObjectPath(objectPath),
	)

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		endpoint,
		bytes.NewReader(data),
	)
	if err != nil {
		return "", fmt.Errorf("build upload request: %w", err)
	}

	s.setHeaders(req)

	req.Header.Set("Content-Type", contentType)
	req.Header.Set("x-upsert", "true")

	resp, err := s.http.Do(req)
	if err != nil {
		return "", fmt.Errorf("supabase upload: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK &&
		resp.StatusCode != http.StatusCreated {
		raw, _ := io.ReadAll(io.LimitReader(resp.Body, 16<<10))

		return "", fmt.Errorf(
			"supabase upload status %d: %s",
			resp.StatusCode,
			strings.TrimSpace(string(raw)),
		)
	}

	return fmt.Sprintf(
		"%s/storage/v1/object/public/%s/%s",
		s.baseURL,
		url.PathEscape(bucket),
		escapeObjectPath(objectPath),
	), nil
}

type signedURLResponse struct {
	SignedURL string `json:"signedURL"`
}

func (s *SupabaseClient) SignedURL(
	ctx context.Context,
	bucket string,
	objectPath string,
	expiresIn int,
) (string, error) {
	if bucket == "" {
		return "", fmt.Errorf("bucket is required")
	}

	if objectPath == "" {
		return "", fmt.Errorf("object path is required")
	}

	if expiresIn <= 0 {
		return "", fmt.Errorf("expiresIn must be greater than zero")
	}

	endpoint := fmt.Sprintf(
		"%s/storage/v1/object/sign/%s/%s",
		s.baseURL,
		url.PathEscape(bucket),
		escapeObjectPath(objectPath),
	)

	body, err := json.Marshal(map[string]int{
		"expiresIn": expiresIn,
	})
	if err != nil {
		return "", fmt.Errorf("encode signed url request: %w", err)
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		endpoint,
		bytes.NewReader(body),
	)
	if err != nil {
		return "", fmt.Errorf("build signed url request: %w", err)
	}

	s.setHeaders(req)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.http.Do(req)
	if err != nil {
		return "", fmt.Errorf("supabase signed url: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		raw, _ := io.ReadAll(io.LimitReader(resp.Body, 16<<10))

		return "", fmt.Errorf(
			"supabase signed url status %d: %s",
			resp.StatusCode,
			strings.TrimSpace(string(raw)),
		)
	}

	var result signedURLResponse

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("decode signed url response: %w", err)
	}

	if result.SignedURL == "" {
		return "", fmt.Errorf("supabase returned empty signed URL")
	}

	if strings.HasPrefix(result.SignedURL, "http://") ||
		strings.HasPrefix(result.SignedURL, "https://") {
		return result.SignedURL, nil
	}

	return s.baseURL + "/storage/v1/" + strings.TrimLeft(result.SignedURL, "/"), nil
}

func (s *SupabaseClient) setHeaders(req *http.Request) {
	req.Header.Set("apikey", s.apiKey)

	if s.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+s.apiKey)
	}
}

func escapeObjectPath(objectPath string) string {
	objectPath = strings.Trim(objectPath, "/")

	if objectPath == "" {
		return ""
	}

	parts := strings.Split(objectPath, "/")

	for i := range parts {
		parts[i] = url.PathEscape(parts[i])
	}

	return path.Join(parts...)
}