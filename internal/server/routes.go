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

	healthHandler := handler.NewHealth(
		s.mongo,
		s.redis,
	)

	r.GET("/health", healthHandler.Check)
	r.GET("/version", handler.Version)

	authHandler := handler.NewAuthHandler(
		s.cfg,
		s.oauthCfg,
		s.userRepo,
	)

	r.GET(
		"/api/v1/auth/google",
		authHandler.GoogleLogin,
	)

	r.GET(
		"/api/v1/auth/google/callback",
		authHandler.GoogleCallback,
	)

	channelHandler := handler.NewChannelHandler(
		s.cfg,
	)

	r.GET(
		"/api/v1/channels/search",
		channelHandler.SearchChannel,
	)

	r.GET(
		"/api/v1/channels/:channelId/videos",
		channelHandler.GetChannelVideos,
	)
	internalHandler := handler.NewInternalHandler(
		s.clipRepo,
		s.videoRepo,
		s.fmRepo,
		s.dnaRepo,
		s.personaRepo,
		s.trendRepo,
		s.transcriptRepo,
		s.llmRotator,
		s.cfg,
		s.log,
	)
	internal := r.Group("/api/internal")

	internal.Use(
		middleware.InternalKeyAuth(
			s.cfg.InternalAPIKey,
		),
	)

	{
		internal.POST(
			"/short/done",
			internalHandler.ShortDone,
		)

		internal.POST(
			"/cpep/done",
			internalHandler.CPEPDone,
		)

		internal.POST(
			"/dna/done",
			internalHandler.DNADone,
		)

		internal.POST(
			"/personas/done",
			internalHandler.PersonasDone,
		)

		internal.POST(
			"/forecast/done",
			internalHandler.ForecastDone,
		)

		internal.POST(
			"/transcription/done",
			internalHandler.TranscriptionDone,
		)

		internal.POST(
			"/analysis/done",
			internalHandler.AnalysisDone,
		)
	}

	protected := r.Group("/api/v1")

	protected.Use(
		middleware.JWTAuth(s.cfg.JWTSecret),
	)

	{
		protected.GET(
			"/auth/me",
			authHandler.Me,
		)

		videoHandler := handler.NewVideoHandler(
			s.videoRepo,
			s.userRepo,
			s.queueClient,
			s.oauthCfg,
			s.jobRepo,
			s.cfg,
		)

		protected.POST(
			"/videos/sync",
			videoHandler.SyncChannel,
		)

		protected.GET(
			"/videos",
			videoHandler.ListVideos,
		)

		protected.POST(
			"/channels/:channelId/videos/:youtubeVideoId/process",
			videoHandler.ProcessPublicVideo,
		)

		protected.GET(
			"/jobs/:jobId",
			videoHandler.GetJobStatus,
		)

		clipHandler := handler.NewClipHandler(
			s.clipRepo,
			s.queueClient,
			s.supabase,
		)

		protected.POST(
			"/clips/:id/export",
			clipHandler.ExportClip,
		)

		protected.GET(
			"/clips/:id/download",
			clipHandler.GetDownloadURL,
		)

		protected.POST(
			"/clips/:id/published",
			clipHandler.MarkPublished,
		)

		protected.GET(
			"/clips/pending",
			clipHandler.ListPendingClips,
		)

		protected.GET(
			"/clips/approved",
			clipHandler.ListApprovedClips,
		)

		protected.PATCH(
			"/clips/:id/approve",
			clipHandler.ApproveClip,
		)

		protected.PATCH(
			"/clips/:id/reject",
			clipHandler.RejectClip,
		)

		protected.GET(
			"/clips",
			clipHandler.ListClips,
		)

		protected.GET(
			"/clips/:id",
			clipHandler.GetClip,
		)

		protected.PATCH(
			"/clips/:id",
			clipHandler.UpdateClip,
		)

		analyticsHandler := handler.NewAnalyticsHandler(
			s.dnaRepo,
			s.personaRepo,
			s.trendRepo,
			s.fmRepo,
			s.clipRepo,
			s.abRepo,
		)

		protected.GET(
			"/analytics/dna",
			analyticsHandler.GetDNA,
		)

		protected.GET(
			"/analytics/knowledge-graph",
			analyticsHandler.GetKnowledgeGraph,
		)

		protected.GET(
			"/analytics/content-gaps",
			analyticsHandler.GetContentGaps,
		)

		protected.GET(
			"/analytics/personas",
			analyticsHandler.GetPersonas,
		)

		protected.GET(
			"/analytics/trend-forecast",
			analyticsHandler.GetTrendForecast,
		)

		protected.GET(
			"/analytics/performance",
			analyticsHandler.GetPerformance,
		)

		protected.GET(
			"/analytics/model-accuracy",
			analyticsHandler.GetModelAccuracy,
		)

		protected.GET(
			"/analytics/ab-tests",
			analyticsHandler.GetABTests,
		)

		// Admin

		adminHandler := handler.NewAdminHandler(
			s.llmRotator,
		)

		protected.GET(
			"/admin/key-health",
			adminHandler.KeyHealth,
		)
	}
}
