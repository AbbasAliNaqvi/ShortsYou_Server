package edit

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCreateShortUsesFastAPIContract(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/create-short" {
			t.Fatalf("unexpected request: %s %s", r.Method, r.URL.Path)
		}
		var request CreateShortRequest
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if request.JobID != "job-1" || request.ClipID != "clip-1" || request.VideoURL == "" {
			t.Fatalf("unexpected render request: %#v", request)
		}
		_ = json.NewEncoder(w).Encode(CreateShortResponse{JobID: request.JobID, Accepted: true, ETASeconds: 120})
	}))
	defer server.Close()

	response, err := NewClient(server.URL).CreateShort(context.Background(), CreateShortRequest{
		JobID: "job-1", ClipID: "clip-1", UserID: "user-1", VideoURL: "https://example.test/video.mp4",
	})
	if err != nil {
		t.Fatalf("CreateShort returned error: %v", err)
	}
	if !response.Accepted || response.ETASeconds != 120 {
		t.Fatalf("unexpected response: %#v", response)
	}
}

func TestHealthRejectsUnhealthyService(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(HealthResponse{Status: "starting", Service: "shortsyou-edit"})
	}))
	defer server.Close()

	if _, err := NewClient(server.URL).Health(context.Background()); err == nil {
		t.Fatal("Health accepted an unhealthy renderer")
	}
}
