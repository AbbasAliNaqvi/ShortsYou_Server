package server

import (
	"github.com/gin-gonic/gin"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/handler"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/middleware"
)

func (s *Server) registerRoutes(r *gin.Engine) {
	r.Use(middleware.Recovery(s.log))
	r.Use(middleware.RequestLogger(s.log))
	r.Use(middleware.CORS(s.cfg.AllowedOrigins))
	r.Use(middleware.RateLimit(100))

	// System
	h := handler.NewHealth(s.mongo, s.redis)
	r.GET("/health",  h.Check)
	r.GET("/version", handler.Version)

	// Auth — public
	authHandler := handler.NewAuthHandler(s.cfg, s.oauthCfg, s.userRepo)
	r.GET("/api/v1/auth/google",          authHandler.GoogleLogin)
	r.GET("/api/v1/auth/google/callback", authHandler.GoogleCallback)

	// Protected
	protected := r.Group("/api/v1")
	protected.Use(middleware.JWTAuth(s.cfg.JWTSecret))
	{
		protected.GET("/auth/me", authHandler.Me)

		videoHandler := handler.NewVideoHandler(s.videoRepo, s.userRepo, s.queueClient)
		protected.POST("/videos/sync", videoHandler.SyncChannel)
		protected.GET("/videos",       videoHandler.ListVideos)
	}
}