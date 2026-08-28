package handler

import (
	"net/http"
	"runtime"

	"github.com/gin-gonic/gin"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/response"
)

const buildVersion = "0.1.0"

func Version(c *gin.Context) {
	response.JSON(c, http.StatusOK, true, gin.H{
		"version": buildVersion,
		"runtime": runtime.Version(),
		"os":      runtime.GOOS,
		"arch":    runtime.GOARCH,
	}, "")
}