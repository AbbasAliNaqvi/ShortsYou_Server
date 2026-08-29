package youtube

import (
	"context"
	"fmt"
	"time"

	"google.golang.org/api/option"
	yt "google.golang.org/api/youtube/v3"
)

type PublicClient struct {
	svc    *yt.Service
	apiKey string
}

func NewPublicClient(ctx context.Context, apiKey string) (*PublicClient, error) {
	svc, err := yt.NewService(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, fmt.Errorf("youtube.NewPublicClient: %w", err)
	}
	return &PublicClient{svc: svc, apiKey: apiKey}, nil
}

type ChannelResult struct {
	ChannelID       string `json:"channelId"`
	Title           string `json:"title"`
	Description     string `json:"description"`
	ThumbnailURL    string `json:"thumbnailUrl"`
	SubscriberCount uint64 `json:"subscriberCount"`
	VideoCount      uint64 `json:"videoCount"`
	ViewCount       uint64 `json:"viewCount"`
	CustomURL       string `json:"customUrl"`
	IsOwned         bool   `json:"isOwned"`
}

func (c *PublicClient) SearchChannel(ctx context.Context, query string) (*ChannelResult, error) {
	resp, err := c.svc.Search.
		List([]string{"snippet"}).
		Q(query).
		Type("channel").
		MaxResults(1).
		Context(ctx).
		Do()
	if err != nil {
		return nil, fmt.Errorf("search.list: %w", err)
	}
	if len(resp.Items) == 0 {
		return nil, fmt.Errorf("channel not found: %s", query)
	}

	item := resp.Items[0]
	channelID := item.Snippet.ChannelId

	// Fetch full channel details
	details, err := c.svc.Channels.
		List([]string{"snippet", "statistics"}).
		Id(channelID).
		Context(ctx).
		Do()
	if err != nil {
		return nil, fmt.Errorf("channels.list: %w", err)
	}
	if len(details.Items) == 0 {
		return nil, fmt.Errorf("channel details not found")
	}

	ch := details.Items[0]
	return &ChannelResult{
		ChannelID:       ch.Id,
		Title:           ch.Snippet.Title,
		Description:     ch.Snippet.Description,
		ThumbnailURL:    ch.Snippet.Thumbnails.High.Url,
		SubscriberCount: ch.Statistics.SubscriberCount,
		VideoCount:      ch.Statistics.VideoCount,
		ViewCount:       ch.Statistics.ViewCount,
		CustomURL:       ch.Snippet.CustomUrl,
		IsOwned:         false, // only true when accessed via OAuth
	}, nil
}

// FetchPublicVideos returns videos from any public channel using only API key.
func (c *PublicClient) FetchPublicVideos(ctx context.Context, channelID string, maxResults int64) ([]VideoMeta, error) {
	resp, err := c.svc.Search.
		List([]string{"id"}).
		ChannelId(channelID).
		Type("video").
		Order("viewCount").
		MaxResults(maxResults).
		Context(ctx).
		Do()
	if err != nil {
		return nil, fmt.Errorf("search.list: %w", err)
	}

	ids := make([]string, 0, len(resp.Items))
	for _, item := range resp.Items {
		ids = append(ids, item.Id.VideoId)
	}

	if len(ids) == 0 {
		return nil, nil
	}

	return c.fetchDetails(ctx, ids)
}

func (c *PublicClient) fetchDetails(ctx context.Context, ids []string) ([]VideoMeta, error) {
	resp, err := c.svc.Videos.
		List([]string{"snippet", "statistics", "contentDetails"}).
		Id(ids...).
		Context(ctx).
		Do()
	if err != nil {
		return nil, fmt.Errorf("videos.list: %w", err)
	}

	videos := make([]VideoMeta, 0, len(resp.Items))
	for _, item := range resp.Items {
		publishedAt, _ := time.Parse(time.RFC3339, item.Snippet.PublishedAt)
		videos = append(videos, VideoMeta{
			YouTubeVideoID:  item.Id,
			Title:           item.Snippet.Title,
			Description:     item.Snippet.Description,
			ThumbnailURL:    bestThumbnail(item.Snippet.Thumbnails),
			PublishedAt:     publishedAt,
			DurationSeconds: parseISO8601(item.ContentDetails.Duration),
			ViewCount:       int64(item.Statistics.ViewCount),
			LikeCount:       int64(item.Statistics.LikeCount),
			CommentCount:    int64(item.Statistics.CommentCount),
		})
	}
	return videos, nil
}
