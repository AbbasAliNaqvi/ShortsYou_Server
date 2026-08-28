package downloader

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

type Result struct {
	FilePath    string
	ContentType string
	Cleanup     func()
}

func Download(ctx context.Context, youtubeVideoID string) (*Result, error) {
	url := "https://www.youtube.com/watch?v=" + youtubeVideoID

	tmp, err := os.CreateTemp("", "shortsyou-*.mp4")
	if err != nil {
		return nil, fmt.Errorf("create temp file: %w", err)
	}

	tmpPath := tmp.Name()
	tmp.Close()

	cmd := exec.CommandContext(ctx,
		"yt-dlp",
		"--quiet",
		"--no-warnings",

		// Prefer MP4 video + M4A audio.
		"--format", "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b",

		"--output", tmpPath,
		"--no-part",

		// Ensure the final output is MP4 when merging is required.
		"--merge-output-format", "mp4",

		url,
	)

	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		os.Remove(tmpPath)
		return nil, fmt.Errorf("yt-dlp: %w", err)
	}

	if _, err := os.Stat(tmpPath); err != nil {
		os.Remove(tmpPath)
		return nil, fmt.Errorf("yt-dlp output not found: %w", err)
	}

	return &Result{
		FilePath:    tmpPath,
		ContentType: "video/mp4",
		Cleanup: func() {
			os.Remove(tmpPath)
		},
	}, nil
}

// VideoKey returns the Supabase object path for a raw downloaded video.
func VideoKey(userID, videoID string) string {
	return filepath.Join("raw-videos", userID, videoID+".mp4")
}

// ShortKey returns the Supabase object path for a processed 9:16 short clip.
func ShortKey(userID, clipID string) string {
	return filepath.Join("processed-clips", userID, clipID+".mp4")
}
