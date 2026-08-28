package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/response"
)

func InternalKeyAuth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.GetHeader("X-Internal-Key") != secret {
			response.Unauthorized(c)
			c.Abort()
			return
		}
		c.Next()
	}
}