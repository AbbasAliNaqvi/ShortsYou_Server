package downloader

import "testing"

func TestWatchURL(t *testing.T) {
	if got, want := WatchURL("abc_123"), "https://www.youtube.com/watch?v=abc_123"; got != want {
		t.Fatalf("WatchURL() = %q, want %q", got, want)
	}
}

func TestPlayerClientsConfigured(t *testing.T) {
	if len(playerClients) == 0 {
		t.Fatal("expected at least one player client configured for cookie-free extraction")
	}
	expectedFirst := "tv_embedded"
	if playerClients[0] != expectedFirst {
		t.Errorf("expected primary player client %q, got %q", expectedFirst, playerClients[0])
	}
}
