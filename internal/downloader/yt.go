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

func Download(ctx context.Context, youtubeVideoID string) (*Result, error) {
	url := "https://www.youtube.com/watch?v=" + youtubeVideoID

	tmpDir, err := os.MkdirTemp("", "shortsyou-download-*")
	if err != nil {
		return nil, fmt.Errorf("create temp directory: %w", err)
	}

	cleanup := func() {
		_ = os.RemoveAll(tmpDir)
	}

	outputTemplate := filepath.Join(tmpDir, "video.%(ext)s")
	finalPath := filepath.Join(tmpDir, "video.mp4")

	cmd := exec.CommandContext(ctx,
		"yt-dlp",

		"--quiet",
		"--no-warnings",

		"--format",
		"bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b",

		"--output",
		outputTemplate,

		"--merge-output-format",
		"mp4",

		url,
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

// VideoKey returns the Supabase object path relative to the raw-videos bucket.
func VideoKey(userID, videoID string) string {
	return filepath.Join(userID, videoID+".mp4")
}

// ShortKey returns the Supabase object path relative to the processed-clips bucket.
func ShortKey(userID, clipID string) string {
	return filepath.Join(userID, clipID+".mp4")
}
