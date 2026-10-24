package downloader

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type Result struct {
	FilePath    string
	ContentType string
	Cleanup     func()
}

func WatchURL(youtubeVideoID string) string {
	return "https://www.youtube.com/watch?v=" + youtubeVideoID
}

// playerClients contains YouTube player clients in priority order.
// These public session clients bypass bot challenges without requiring browser cookies.
var playerClients = []string{"tv_embedded", "mweb", "web_safari", "android"}

func Download(ctx context.Context, youtubeVideoID string) (*Result, error) {
	url := WatchURL(youtubeVideoID)

	tmpDir, err := os.MkdirTemp("", "shortsyou-download-*")
	if err != nil {
		return nil, fmt.Errorf("create temp directory: %w", err)
	}

	cleanup := func() {
		_ = os.RemoveAll(tmpDir)
	}

	outputTemplate := filepath.Join(tmpDir, "video.%(ext)s")
	finalPath := filepath.Join(tmpDir, "video.mp4")

	proxy := strings.TrimSpace(os.Getenv("YOUTUBE_PROXY"))
	if proxy == "" {
		proxy = strings.TrimSpace(os.Getenv("HTTP_PROXY"))
	}

	var failures []string

	for _, client := range playerClients {
		if ctx.Err() != nil {
			cleanup()
			return nil, ctx.Err()
		}

		_ = os.Remove(finalPath)

		args := []string{
			"--quiet",
			"--no-warnings",
			"--no-playlist",
			"--extractor-args", fmt.Sprintf("youtube:player_client=%s", client),
			"--format", "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b",
			"--output", outputTemplate,
			"--merge-output-format", "mp4",
		}

		if proxy != "" {
			args = append(args, "--proxy", proxy)
		}

		args = append(args, url)

		cmd := exec.CommandContext(ctx, "yt-dlp", args...)
		var stderr bytes.Buffer
		cmd.Stderr = &stderr

		if err := cmd.Run(); err == nil {
			if fi, statErr := os.Stat(finalPath); statErr == nil && fi.Size() > 1024 {
				return &Result{
					FilePath:    finalPath,
					ContentType: "video/mp4",
					Cleanup:     cleanup,
				}, nil
			}
		}

		errMsg := strings.TrimSpace(stderr.String())
		if errMsg == "" {
			errMsg = "empty video output"
		}
		failures = append(failures, fmt.Sprintf("%s: %s", client, errMsg))
	}

	cleanup()
	return nil, fmt.Errorf("yt-dlp download failed across all clients: %s", strings.Join(failures, " | "))
}

// DownloadAudio downloads an audio-only M4A rendition suitable for a remote
// speech-to-text provider using multi-client public session fallback.
func DownloadAudio(ctx context.Context, youtubeVideoID string) (*Result, error) {
	url := WatchURL(youtubeVideoID)
	tmpDir, err := os.MkdirTemp("", "shortsyou-audio-*")
	if err != nil {
		return nil, fmt.Errorf("create temp directory: %w", err)
	}
	cleanup := func() { _ = os.RemoveAll(tmpDir) }

	finalPath := filepath.Join(tmpDir, "audio.m4a")

	proxy := strings.TrimSpace(os.Getenv("YOUTUBE_PROXY"))
	if proxy == "" {
		proxy = strings.TrimSpace(os.Getenv("HTTP_PROXY"))
	}

	var failures []string

	for _, client := range playerClients {
		if ctx.Err() != nil {
			cleanup()
			return nil, ctx.Err()
		}

		_ = os.Remove(finalPath)

		args := []string{
			"--quiet",
			"--no-warnings",
			"--no-playlist",
			"--extractor-args", fmt.Sprintf("youtube:player_client=%s", client),
			"--format", "bestaudio[ext=m4a]/bestaudio/best",
			"--extract-audio",
			"--audio-format", "m4a",
			"--audio-quality", "5",
			"--output", finalPath,
		}

		if proxy != "" {
			args = append(args, "--proxy", proxy)
		}

		args = append(args, url)

		cmd := exec.CommandContext(ctx, "yt-dlp", args...)
		var stderr bytes.Buffer
		cmd.Stderr = &stderr

		if err := cmd.Run(); err == nil {
			if fi, statErr := os.Stat(finalPath); statErr == nil && fi.Size() > 1024 {
				return &Result{
					FilePath:    finalPath,
					ContentType: "audio/mp4",
					Cleanup:     cleanup,
				}, nil
			}
		}

		errMsg := strings.TrimSpace(stderr.String())
		if errMsg == "" {
			errMsg = "empty audio output"
		}
		failures = append(failures, fmt.Sprintf("%s: %s", client, errMsg))
	}

	cleanup()
	return nil, fmt.Errorf("yt-dlp audio download failed across all clients: %s", strings.Join(failures, " | "))
}

// VideoKey returns the Supabase object path relative to the raw-videos bucket.
func VideoKey(userID, videoID string) string {
	return filepath.Join(userID, videoID+".mp4")
}

// ShortKey returns the Supabase object path relative to the processed-clips bucket.
func ShortKey(userID, clipID string) string {
	return filepath.Join(userID, clipID+".mp4")
}
