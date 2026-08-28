package storage

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type SupabaseClient struct {
	baseURL string
	apiKey  string
	http    *http.Client
}

func NewSupabase(baseURL, apiKey string) *SupabaseClient {
	return &SupabaseClient{
		baseURL: baseURL,
		apiKey:  apiKey,
		http:    &http.Client{Timeout: 10 * time.Minute},
	}
}

// Upload sends file bytes to a Supabase Storage bucket and returns the public URL.
func (s *SupabaseClient) Upload(
	ctx context.Context,
	bucket string,
	objectPath string,
	contentType string,
	data []byte,
) (string, error) {
	url := fmt.Sprintf(
		"%s/storage/v1/object/%s/%s",
		s.baseURL,
		bucket,
		objectPath,
	)

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		url,
		bytes.NewReader(data),
	)
	if err != nil {
		return "", fmt.Errorf("build upload request: %w", err)
	}

	req.Header.Set("apikey", s.apiKey)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("x-upsert", "true")

	resp, err := s.http.Do(req)
	if err != nil {
		return "", fmt.Errorf("supabase upload: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK &&
		resp.StatusCode != http.StatusCreated {
		raw, _ := io.ReadAll(resp.Body)

		return "", fmt.Errorf(
			"supabase upload status %d: %s",
			resp.StatusCode,
			raw,
		)
	}

	return fmt.Sprintf(
		"%s/storage/v1/object/public/%s/%s",
		s.baseURL,
		bucket,
		objectPath,
	), nil
}

type signedURLResponse struct {
	SignedURL string `json:"signedURL"`
}

// SignedURL creates a time-limited download URL for a private object.
func (s *SupabaseClient) SignedURL(
	ctx context.Context,
	bucket, objectPath string,
	expiresIn int,
) (string, error) {
	url := fmt.Sprintf(
		"%s/storage/v1/object/sign/%s/%s",
		s.baseURL,
		bucket,
		objectPath,
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
		url,
		bytes.NewReader(body),
	)
	if err != nil {
		return "", fmt.Errorf("build signed url request: %w", err)
	}

	req.Header.Set("apikey", s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.http.Do(req)
	if err != nil {
		return "", fmt.Errorf("supabase signed url: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		raw, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf(
			"supabase signed url status %d: %s",
			resp.StatusCode,
			raw,
		)
	}

	var result signedURLResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("decode signed url response: %w", err)
	}

	if result.SignedURL == "" {
		return "", fmt.Errorf("supabase returned empty signed URL")
	}

	return s.baseURL + result.SignedURL, nil
}
