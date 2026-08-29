package handler

import (
	"log"

	"github.com/gin-gonic/gin"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/config"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/youtube"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/response"
)

type ChannelHandler struct {
	cfg *config.Config
}

func NewChannelHandler(cfg *config.Config) *ChannelHandler {
	return &ChannelHandler{cfg: cfg}
}

func (h *ChannelHandler) SearchChannel(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		response.BadRequest(c, "query parameter q is required")
		return
	}

	client, err := youtube.NewPublicClient(
		c.Request.Context(),
		h.cfg.YoutubeAPIKey,
	)
	if err != nil {
		log.Printf("YouTube client error: %v", err)
		response.InternalError(c)
		return
	}

	channel, err := client.SearchChannel(c.Request.Context(), query)
	if err != nil {
		log.Printf("YouTube SearchChannel error: %v", err)
		response.InternalError(c)
		return
	}

	response.OK(c, channel)
}

// GetChannelVideos returns public videos for any channel.
func (h *ChannelHandler) GetChannelVideos(c *gin.Context) {
	channelID := c.Param("channelId")

	client, err := youtube.NewPublicClient(
		c.Request.Context(),
		h.cfg.YoutubeAPIKey,
	)
	if err != nil {
		log.Printf("YouTube client error: %v", err)
		response.InternalError(c)
		return
	}

	videos, err := client.FetchPublicVideos(
		c.Request.Context(),
		channelID,
		20,
	)
	if err != nil {
		log.Printf("YouTube FetchPublicVideos error: %v", err)
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{
		"channelId": channelID,
		"videos":    videos,
		"isOwned":   false,
		"mode":      "public",
	})
}
