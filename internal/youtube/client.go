package youtube

import (
	"context"
	"fmt"
	"regexp"
	"strconv"
	"time"

	"golang.org/x/oauth2"
	"google.golang.org/api/option"
	yt "google.golang.org/api/youtube/v3"
)

type Client struct {
	svc   *yt.Service
	token *oauth2.Token
}

func NewClientWithToken(
	ctx context.Context,
	accessToken string,
	refreshToken string,
	tokenExpiry time.Time,
	oauthConfig *oauth2.Config,
) (*Client, error) {
	token := &oauth2.Token{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		Expiry:       tokenExpiry,
	}

	ts := oauthConfig.TokenSource(ctx, token)

	svc, err := yt.NewService(
		ctx,
		option.WithTokenSource(ts),
	)
	if err != nil {
		return nil, fmt.Errorf("youtube.NewService: %w", err)
	}

	return &Client{
		svc:   svc,
		token: token,
	}, nil
}

func (c *Client) Token() *oauth2.Token {
	return c.token
}

type VideoMeta struct {
	YouTubeVideoID  string
	Title           string
	Description     string
	ThumbnailURL    string
	PublishedAt     time.Time
	DurationSeconds int64
	ViewCount       int64
	LikeCount       int64
	CommentCount    int64
}

func (c *Client) FetchMyVideos(ctx context.Context) ([]VideoMeta, error) {
	// First resolve the authenticated user's channel ID.
	channelResp, err := c.svc.Channels.
		List([]string{"id"}).
		Mine(true).
		Context(ctx).
		Do()
	if err != nil {
		return nil, fmt.Errorf("channels.list: %w", err)
	}
	if len(channelResp.Items) == 0 {
		return nil, fmt.Errorf("no youtube channel found for this account")
	}

	channelID := channelResp.Items[0].Id
	return c.fetchVideosForChannel(ctx, channelID)
}

func (c *Client) fetchVideosForChannel(ctx context.Context, channelID string) ([]VideoMeta, error) {
	var allIDs []string
	pageToken := ""

	for {
		req := c.svc.Search.
			List([]string{"id"}).
			ChannelId(channelID).
			Type("video").
			Order("date").
			MaxResults(50).
			Context(ctx)

		if pageToken != "" {
			req = req.PageToken(pageToken)
		}

		resp, err := req.Do()
		if err != nil {
			return nil, fmt.Errorf("search.list: %w", err)
		}

		for _, item := range resp.Items {
			allIDs = append(allIDs, item.Id.VideoId)
		}

		if resp.NextPageToken == "" {
			break
		}
		pageToken = resp.NextPageToken
	}

	if len(allIDs) == 0 {
		return nil, nil
	}

	var results []VideoMeta
	for i := 0; i < len(allIDs); i += 50 {
		end := i + 50
		if end > len(allIDs) {
			end = len(allIDs)
		}

		batch, err := c.fetchDetails(ctx, allIDs[i:end])
		if err != nil {
			return nil, err
		}
		results = append(results, batch...)
	}

	return results, nil
}

func (c *Client) fetchDetails(ctx context.Context, ids []string) ([]VideoMeta, error) {
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

func bestThumbnail(t *yt.ThumbnailDetails) string {
	if t == nil {
		return ""
	}
	for _, thumb := range []*yt.Thumbnail{t.Maxres, t.Standard, t.High, t.Medium, t.Default} {
		if thumb != nil {
			return thumb.Url
		}
	}
	return ""
}

var isoDurationRe = regexp.MustCompile(`PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?`)

func parseISO8601(d string) int64 {
	m := isoDurationRe.FindStringSubmatch(d)
	if m == nil {
		return 0
	}
	parse := func(s string) int64 {
		if s == "" {
			return 0
		}
		n, _ := strconv.ParseInt(s, 10, 64)
		return n
	}
	return parse(m[1])*3600 + parse(m[2])*60 + parse(m[3])
}
