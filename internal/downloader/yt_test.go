package downloader

import "testing"

func TestWatchURL(t *testing.T) {
	if got, want := WatchURL("abc_123"), "https://www.youtube.com/watch?v=abc_123"; got != want {
		t.Fatalf("WatchURL() = %q, want %q", got, want)
	}
}
