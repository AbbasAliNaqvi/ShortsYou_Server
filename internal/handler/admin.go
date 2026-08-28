package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/llm"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/response"
)

type AdminHandler struct {
	llmRotator *llm.Rotator
}

func NewAdminHandler(llmRotator *llm.Rotator) *AdminHandler {
	return &AdminHandler{llmRotator: llmRotator}
}

func (h *AdminHandler) KeyHealth(c *gin.Context) {
	response.OK(c, gin.H{
		"keys": h.llmRotator.KeyStatus(),
	})
}