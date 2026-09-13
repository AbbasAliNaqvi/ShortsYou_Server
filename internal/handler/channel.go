package handler

import (
	"errors"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/config"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/repository"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/youtube"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/response"
)

type ChannelHandler struct {
	cfg      *config.Config
	userRepo *repository.UserRepository
}

func NewChannelHandler(cfg *config.Config, userRepo *repository.UserRepository) *ChannelHandler {
	return &ChannelHandler{cfg: cfg, userRepo: userRepo}
}

func (h *ChannelHandler) SearchChannel(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		response.BadRequest(c, "query parameter q is required")
		return
	}

	client, err := youtube.NewPublicClient(c.Request.Context(), h.cfg.YoutubeAPIKey)
	if err != nil {
		response.InternalError(c)
		return
	}

	channels, err := client.SearchChannels(c.Request.Context(), query, 5)
	if err != nil {
		response.NotFound(c, "channel")
		return
	}

	response.OK(c, channels)
}

func (h *ChannelHandler) GetChannelVideos(c *gin.Context) {
	channelID := c.Param("channelId")
	if channelID == "" {
		response.BadRequest(c, "channelId is required")
		return
	}

	limit := int64(20)

	client, err := youtube.NewPublicClient(c.Request.Context(), h.cfg.YoutubeAPIKey)
	if err != nil {
		response.InternalError(c)
		return
	}

	videos, err := client.FetchPublicVideos(c.Request.Context(), channelID, limit)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{
		"channelId": channelID,
		"videos":    videos,
		"count":     len(videos),
		"isOwned":   false,
		"mode":      "public",
	})
}

func (h *ChannelHandler) AddToStudio(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		response.Unauthorized(c)
		return
	}
	var body struct {
		Name string `json:"name"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Name == "" {
		response.BadRequest(c, "channel name is required")
		return
	}
	if err := h.userRepo.UpdateChannel(c.Request.Context(), userID.(string), c.Param("channelId"), body.Name); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			response.NotFound(c, "user")
			return
		}
		response.InternalError(c)
		return
	}
	response.OK(c, gin.H{"channelId": c.Param("channelId"), "channelName": body.Name, "message": "channel added to studio"})
}
