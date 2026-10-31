package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestSwipeHandler_Unauthenticated(t *testing.T) {
	h := NewSwipeHandler(nil, nil, nil, nil, nil, nil)
	r := gin.New()
	r.GET("/api/v1/swipe/deck", h.GetDeck)
	r.POST("/api/v1/swipe/action", h.HandleAction)
	r.POST("/api/v1/swipe/undo", h.HandleUndo)
	r.GET("/api/v1/swipe/stats", h.GetStats)

	// 1. GetDeck without auth
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/api/v1/swipe/deck", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized for GetDeck, got %d", w.Code)
	}

	// 2. HandleAction without auth
	w = httptest.NewRecorder()
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/swipe/action", bytes.NewBufferString(`{"action":"accept"}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized for HandleAction, got %d", w.Code)
	}

	// 3. HandleUndo without auth
	w = httptest.NewRecorder()
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/swipe/undo", bytes.NewBufferString(`{"clipId":"123"}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized for HandleUndo, got %d", w.Code)
	}

	// 4. GetStats without auth
	w = httptest.NewRecorder()
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/swipe/stats", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized for GetStats, got %d", w.Code)
	}
}

func TestSwipeHandler_ActionValidation(t *testing.T) {
	h := NewSwipeHandler(nil, nil, nil, nil, nil, nil)
	r := gin.New()

	testUserID := primitive.NewObjectID()
	r.Use(func(c *gin.Context) {
		c.Set("userID", testUserID.Hex())
		c.Next()
	})
	r.POST("/api/v1/swipe/action", h.HandleAction)

	// Invalid action
	payload := SwipeActionRequest{
		ClipID: "cand_1",
		Action: "invalid_action",
	}
	body, _ := json.Marshal(payload)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/swipe/action", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 Bad Request for invalid action, got %d", w.Code)
	}
}

func TestDefaultCuratedDeck(t *testing.T) {
	deck := defaultCuratedDeck()
	if len(deck) == 0 {
		t.Fatal("expected default curated deck to not be empty")
	}

	for _, item := range deck {
		if item.HookText == "" {
			t.Errorf("deck item %s missing hookText", item.ID)
		}
		if item.ViralScore <= 0 || item.ViralScore > 100 {
			t.Errorf("deck item %s has invalid viral score: %d", item.ID, item.ViralScore)
		}
		if item.DurationSeconds <= 0 {
			t.Errorf("deck item %s has invalid duration: %d", item.ID, item.DurationSeconds)
		}
	}
}
