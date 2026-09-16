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
	if s.cfg.Env != "production" {
		r.GET("/debug/config", func(c *gin.Context) {
			handler.Debug(c, s.cfg)
		})
	}

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

	channelHandler := handler.NewChannelHandler(s.cfg, s.userRepo)

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
		s.jobRepo,
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
	editHandler := handler.NewEditHandler(s.cfg.EditServiceURL)

	{
		protected.GET(
			"/edit/health",
			editHandler.Health,
		)

		protected.GET(
			"/auth/me",
			authHandler.Me,
		)

		protected.PUT(
			"/channels/:channelId/studio",
			channelHandler.AddToStudio,
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

		protected.POST(
			"/videos/ingest",
			videoHandler.IngestURL,
		)

		protected.GET(
			"/videos",
			videoHandler.ListVideos,
		)

		protected.GET(
			"/videos/:id/transcript",
			internalHandler.GetTranscript,
		)

		protected.POST(
			"/videos/:id/generate",
			videoHandler.GenerateVideo,
		)

		protected.POST(
			"/channels/:channelId/videos/:youtubeVideoId/process",
			videoHandler.ProcessPublicVideo,
		)

		protected.GET(
			"/jobs/:jobId",
			videoHandler.GetJobStatus,
		)

		protected.GET(
			"/jobs",
			videoHandler.ListJobs,
		)

		clipHandler := handler.NewClipHandler(
			s.clipRepo,
			s.videoRepo,
			s.queueClient,
			s.supabase,
		)
		protected.POST("/videos/:id/clips/manual", clipHandler.CreateManual)

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
