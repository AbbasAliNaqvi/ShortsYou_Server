package handler

import (
	"net/http"
	"runtime"

	"github.com/gin-gonic/gin"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/config"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/response"
)

var (
	BuildVersion = "1.0.0"
	BuildTime    = "unknown"
)

func Version(c *gin.Context) {
	response.JSON(c, http.StatusOK, true, gin.H{
		"version":   BuildVersion,
		"buildTime": BuildTime,
		"runtime":   runtime.Version(),
		"os":        runtime.GOOS,
		"arch":      runtime.GOARCH,
	}, "")
}

func Debug(c *gin.Context, cfg *config.Config) {
	c.JSON(200, gin.H{
		"ml_audio_url": cfg.MLAudioServiceURL,
		"ml_nlp_url":   cfg.MLNLPServiceURL,
		"base_url":     cfg.BaseURL,
	})
}
