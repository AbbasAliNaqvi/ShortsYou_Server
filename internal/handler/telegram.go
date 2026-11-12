package handler

import (
	"crypto/rand"
	"encoding/base64"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/config"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/models"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/repository"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/response"
)

type TelegramHandler struct {
	cfg   *config.Config
	users *repository.UserRepository
	links *repository.TelegramLinkRepository
	clips *repository.ClipRepository
}

func NewTelegramHandler(cfg *config.Config, users *repository.UserRepository, links *repository.TelegramLinkRepository, clips *repository.ClipRepository) *TelegramHandler {
	return &TelegramHandler{cfg: cfg, users: users, links: links, clips: clips}
}

func (h *TelegramHandler) Action(c *gin.Context) {
	var req struct {
		TelegramID int64  `json:"telegramId" binding:"required"`
		ClipID     string `json:"clipId" binding:"required"`
		Action     string `json:"action" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || (req.Action != "approve" && req.Action != "reject") {
		response.BadRequest(c, "telegramId, clipId, and action (approve or reject) are required")
		return
	}
	user, err := h.users.FindByTelegramID(c.Request.Context(), req.TelegramID)
	if err != nil || user == nil {
		response.Unauthorized(c)
		return
	}
	clipID, err := primitive.ObjectIDFromHex(req.ClipID)
	if err != nil {
		response.BadRequest(c, "invalid clip id")
		return
	}
	clip, err := h.clips.FindByID(c.Request.Context(), clipID)
	if err != nil || clip == nil || clip.UserID != user.ID {
		response.NotFound(c, "clip")
		return
	}
	status := models.ClipStatusDetected
	if req.Action == "reject" {
		status = models.ClipStatusRejected
	}
	if err := h.clips.UpdateStatus(c.Request.Context(), clipID, status); err != nil {
		response.InternalError(c)
		return
	}
	response.OK(c, gin.H{"clipId": req.ClipID, "status": status, "message": "Telegram action applied"})
}

func (h *TelegramHandler) Status(c *gin.Context) {
	userID, ok := c.Get("userID")
	if !ok {
		response.Unauthorized(c)
		return
	}
	user, err := h.users.FindByID(c.Request.Context(), userID.(string))
	if err != nil {
		response.InternalError(c)
		return
	}
	response.OK(c, gin.H{
		"connected":  user.TelegramID != 0,
		"telegramId": user.TelegramID,
		"username":   user.TelegramUsername,
		"linkedAt":   user.TelegramLinkedAt,
	})
}

func (h *TelegramHandler) Connect(c *gin.Context) {
	userID, ok := c.Get("userID")
	if !ok {
		response.Unauthorized(c)
		return
	}
	if h.cfg.TelegramBotUsername == "" {
		response.InternalError(c)
		return
	}
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		response.InternalError(c)
		return
	}
	token := base64.RawURLEncoding.EncodeToString(raw)
	expiresAt := time.Now().Add(10 * time.Minute)
	if err := h.links.Create(c.Request.Context(), repositoryTelegramLink(userID.(string), token, expiresAt)); err != nil {
		response.InternalError(c)
		return
	}
	response.OK(c, gin.H{
		"url":       "https://t.me/" + h.cfg.TelegramBotUsername + "?start=" + token,
		"expiresAt": expiresAt,
	})
}

func (h *TelegramHandler) Disconnect(c *gin.Context) {
	userID, ok := c.Get("userID")
	if !ok {
		response.Unauthorized(c)
		return
	}
	userIDString, ok := userID.(string)
	if !ok || userIDString == "" {
		response.Unauthorized(c)
		return
	}
	if err := h.users.UnlinkTelegram(c.Request.Context(), userIDString); err != nil {
		response.InternalError(c)
		return
	}
	userObjectID, err := primitive.ObjectIDFromHex(userIDString)
	if err != nil {
		response.InternalError(c)
		return
	}
	if err := h.links.DeleteByUserID(c.Request.Context(), userObjectID); err != nil {
		response.InternalError(c)
		return
	}
	response.OK(c, gin.H{
		"connected": false,
		"message":   "Telegram disconnected successfully",
	})
}

type telegramLinkRequest struct {
	Token      string `json:"token" binding:"required"`
	TelegramID int64  `json:"telegramId" binding:"required"`
	Username   string `json:"username"`
	Phone      string `json:"phone" binding:"required"`
}

func (h *TelegramHandler) Link(c *gin.Context) {
	var req telegramLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "token, telegramId, and phone are required")
		return
	}
	link, err := h.links.Consume(c.Request.Context(), req.Token)
	if err != nil {
		response.InternalError(c)
		return
	}
	if link == nil {
		response.BadRequest(c, "link token is invalid or expired")
		return
	}
	existing, err := h.users.FindByTelegramID(c.Request.Context(), req.TelegramID)
	if err != nil {
		response.InternalError(c)
		return
	}
	if existing != nil && existing.ID != link.UserID {
		response.BadRequest(c, "telegram account is already linked to another ShortsYou account")
		return
	}
	if err := h.users.LinkTelegram(c.Request.Context(), link.UserID.Hex(), req.TelegramID, req.Username, req.Phone); err != nil {
		response.InternalError(c)
		return
	}
	response.OK(c, gin.H{"linked": true, "userId": link.UserID.Hex(), "message": "Telegram connected successfully"})
}

func repositoryTelegramLink(userID, token string, expiresAt time.Time) models.TelegramLink {
	oid, _ := primitive.ObjectIDFromHex(userID)
	return models.TelegramLink{
		UserID:    oid,
		TokenHash: repository.HashTelegramLinkToken(token),
		ExpiresAt: expiresAt,
		CreatedAt: time.Now(),
	}
}
