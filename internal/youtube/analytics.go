package youtube

import (
	"context"
	"fmt"
	"time"

	"golang.org/x/oauth2"
	"google.golang.org/api/option"
	ytanalytics "google.golang.org/api/youtubeanalytics/v2"
)

type AnalyticsClient struct {
	svc *ytanalytics.Service
}

func NewAnalyticsClient(ctx context.Context, accessToken string) (*AnalyticsClient, error) {
	ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: accessToken})
	svc, err := ytanalytics.NewService(ctx, option.WithTokenSource(ts))
	if err != nil {
		return nil, fmt.Errorf("youtubeanalytics.NewService: %w", err)
	}
	return &AnalyticsClient{svc: svc}, nil
}

type ClipMetrics struct {
	Views        int64
	CTR          float64
	AvgWatchTime float64
}

func (c *AnalyticsClient) FetchClipMetrics(ctx context.Context, videoID, channelID string, publishedAt time.Time) (*ClipMetrics, error) {
	startDate := publishedAt.Format("2006-01-02")
	endDate   := publishedAt.Add(48 * time.Hour).Format("2006-01-02")

	resp, err := c.svc.Reports.Query().
		Ids("channel==" + channelID).
		StartDate(startDate).
		EndDate(endDate).
		Metrics("views,averageViewDuration,annotationClickThroughRate").
		Filters("video==" + videoID).
		Context(ctx).
		Do()
	if err != nil {
		return nil, fmt.Errorf("analytics.query: %w", err)
	}

	if len(resp.Rows) == 0 {
		return &ClipMetrics{}, nil
	}

	row := resp.Rows[0]

	extract := func(i int) float64 {
		if len(row) <= i {
			return 0
		}
		if v, ok := row[i].(float64); ok {
			return v
		}
		return 0
	}

	return &ClipMetrics{
		Views:        int64(extract(0)),
		AvgWatchTime: extract(1),
		CTR:          extract(2),
	}, nil
}