package middleware

import (
	"crypto/subtle"
	"net/http"
	"strings"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/response"
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

		// Try X-Internal-Key first.
		providedKey := c.GetHeader("X-Internal-Key")

		// Fall back to X-Internal-API-Key.
		if providedKey == "" {
			providedKey = c.GetHeader("X-Internal-API-Key")
		}

		// Some service clients use the same Bearer convention as their public
		// API. Supporting it here keeps callbacks interoperable while retaining
		// constant-time key comparison below.
		if providedKey == "" {
			if authorization := c.GetHeader("Authorization"); strings.HasPrefix(authorization, "Bearer ") {
				providedKey = strings.TrimSpace(strings.TrimPrefix(authorization, "Bearer "))
			}
		}

		if providedKey == "" {
			response.Unauthorized(c)
			c.Abort()
			return
		}

		if subtle.ConstantTimeCompare(
			[]byte(providedKey),
			[]byte(expectedKey),
		) != 1 {
			response.Unauthorized(c)
			c.Abort()
			return
		}

		c.Next()
	}
}
