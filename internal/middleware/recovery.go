package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
)

func Recovery(logger zerolog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Error().
					Interface("panic", rec).
					Str("method", c.Request.Method).
					Str("path", c.Request.URL.Path).
					Msg("Recovered from panic")

				c.AbortWithStatus(http.StatusInternalServerError , gin.H{
					"success": false,
					"message": "Internal Server Error",
				})
			}
		}()
		c.Next()
	}
}