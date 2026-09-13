package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/edit"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/response"
)

// EditHandler exposes renderer availability to authenticated studio clients.
type EditHandler struct{ client *edit.Client }

func NewEditHandler(serviceURL string) *EditHandler {
	return &EditHandler{client: edit.NewClient(serviceURL)}
}

func (h *EditHandler) Health(c *gin.Context) {
	status, err := h.client.Health(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"success": false, "error": err.Error()})
		return
	}
	response.OK(c, status)
}
