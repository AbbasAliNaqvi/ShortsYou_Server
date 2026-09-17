package downloader

import (
	"bytes"
	"context"
	"encoding/base64"
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

	args := []string{
		"--quiet",
		"--no-warnings",
		"--format",
		"bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b",
		"--output",
		outputTemplate,
		"--merge-output-format",
		"mp4",
	}

	if encodedCookies := strings.TrimSpace(os.Getenv("YOUTUBE_COOKIES_BASE64")); encodedCookies != "" {
		cookies, err := base64.StdEncoding.DecodeString(encodedCookies)
		if err != nil {
			cleanup()
			return nil, fmt.Errorf("decode YOUTUBE_COOKIES_BASE64: %w", err)
		}

		cookiePath := filepath.Join(tmpDir, "youtube-cookies.txt")
		if err := os.WriteFile(cookiePath, cookies, 0o600); err != nil {
			cleanup()
			return nil, fmt.Errorf("write YouTube cookies: %w", err)
		}

		args = append(args, "--cookies", cookiePath)
	}

	args = append(args, url)

	cmd := exec.CommandContext(ctx,
		"yt-dlp",
		args...,
	)

	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		cleanup()

		errMsg := strings.TrimSpace(stderr.String())
		if errMsg == "" {
			errMsg = err.Error()
		}

		return nil, fmt.Errorf("yt-dlp: %s", errMsg)
	}

	if _, err := os.Stat(finalPath); err != nil {
		cleanup()
		return nil, fmt.Errorf("yt-dlp output not found at %s: %w", finalPath, err)
	}

	return &Result{
		FilePath:    finalPath,
		ContentType: "video/mp4",
		Cleanup:     cleanup,
	}, nil
}

// DownloadAudio downloads an audio-only M4A rendition suitable for a remote
// speech-to-text provider. A YouTube watch URL is an HTML document, not media;
// passing one directly to Deepgram (or a similar provider) results in a 415.
// The caller owns Cleanup and must call it after the file has been uploaded.
func DownloadAudio(ctx context.Context, youtubeVideoID string) (*Result, error) {
	url := WatchURL(youtubeVideoID)
	tmpDir, err := os.MkdirTemp("", "shortsyou-audio-*")
	if err != nil {
		return nil, fmt.Errorf("create temp directory: %w", err)
	}
	cleanup := func() { _ = os.RemoveAll(tmpDir) }

	finalPath := filepath.Join(tmpDir, "audio.m4a")
	args := []string{
		"--quiet", "--no-warnings", "--no-playlist",
		"--format", "bestaudio[ext=m4a]/bestaudio",
		"--extract-audio", "--audio-format", "m4a", "--audio-quality", "5",
		"--output", finalPath,
	}
	if err := appendCookies(&args, tmpDir); err != nil {
		cleanup()
		return nil, err
	}

	cmd := exec.CommandContext(ctx, "yt-dlp", append(args, url)...)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		cleanup()
		errMsg := strings.TrimSpace(stderr.String())
		if errMsg == "" {
			errMsg = err.Error()
		}
		return nil, fmt.Errorf("yt-dlp audio: %s", errMsg)
	}
	if _, err := os.Stat(finalPath); err != nil {
		cleanup()
		return nil, fmt.Errorf("yt-dlp audio output not found at %s: %w", finalPath, err)
	}
	return &Result{FilePath: finalPath, ContentType: "audio/mp4", Cleanup: cleanup}, nil
}

func appendCookies(args *[]string, tmpDir string) error {
	encodedCookies := strings.TrimSpace(os.Getenv("YOUTUBE_COOKIES_BASE64"))
	if encodedCookies == "" {
		return nil
	}
	cookies, err := base64.StdEncoding.DecodeString(encodedCookies)
	if err != nil {
		return fmt.Errorf("decode YOUTUBE_COOKIES_BASE64: %w", err)
	}
	cookiePath := filepath.Join(tmpDir, "youtube-cookies.txt")
	if err := os.WriteFile(cookiePath, cookies, 0o600); err != nil {
		return fmt.Errorf("write YouTube cookies: %w", err)
	}
	*args = append(*args, "--cookies", cookiePath)
	return nil
}

// VideoKey returns the Supabase object path relative to the raw-videos bucket.
func VideoKey(userID, videoID string) string {
	return filepath.Join(userID, videoID+".mp4")
}

// ShortKey returns the Supabase object path relative to the processed-clips bucket.
func ShortKey(userID, clipID string) string {
	return filepath.Join(userID, clipID+".mp4")
}
