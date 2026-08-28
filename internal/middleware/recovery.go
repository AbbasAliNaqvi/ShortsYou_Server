package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
)

func Recovery(log zerolog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				log.Error().
					Interface("error", err).
					Str("path", c.Request.URL.Path).
					Str("method", c.Request.Method).
					Msg("panic recovered")

				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"error": "Internal Server Error",
				})
			}
		}()

		c.Next()
	}
}
