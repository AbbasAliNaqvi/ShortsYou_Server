package middleware

import (
	"crypto/subtle"
	"net/http"

	"github.com/gin-gonic/gin"
)

func InternalKeyAuth(expectedKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if expectedKey == "" {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "internal API key is not configured",
			})
			return
		}

		providedKey := c.GetHeader("X-Internal-API-Key")

		if providedKey == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "missing internal API key",
			})
			return
		}

		if subtle.ConstantTimeCompare(
			[]byte(providedKey),
			[]byte(expectedKey),
		) != 1 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "invalid internal API key",
			})
			return
		}

		c.Next()
	}
}
