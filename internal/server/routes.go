package server

import (
	"github.com/gin-gonic/gin"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/middleware"
)

func (s *Server) registerRoutes(r *gin.Engine) {
	r.Use(middleware.Recovery(s.log))
	r.Use(middleware.RequestLogger(s.log))
	r.Use(middleware.CORS(s.cfg.AllowedOrigins))
	r.Use(middleware.RateLimit(100))

	v1 := r.Group("/api/v1")
	_ = v1
}