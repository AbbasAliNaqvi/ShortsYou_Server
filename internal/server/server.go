package server

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/config"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/database"
)

type Server struct {
	http  *http.Server
	log   zerolog.Logger
	cfg   *config.Config
	mongo *database.MongoDB
	redis *database.RedisClient
}

func New(
	cfg *config.Config,
	log zerolog.Logger,
	mongo *database.MongoDB,
	redis *database.RedisClient,
) *Server {
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	router := gin.New()

	s := &Server{
		cfg:   cfg,
		log:   log,
		mongo: mongo,
		redis: redis,
	}

	// Register middleware and routes.
	s.registerRoutes(router)

	s.http = &http.Server{
		// cfg.Port is a string, so use %s, not %d.
		Addr:              fmt.Sprintf(":%s", cfg.Port),
		Handler:           router,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
		ReadHeaderTimeout: 5 * time.Second,
	}

	return s
}

func (s *Server) Start() error {
	s.log.Info().
		Str("addr", s.http.Addr).
		Msg("HTTP server listening")

	err := s.http.ListenAndServe()

	if err != nil && err != http.ErrServerClosed {
		return err
	}

	return nil
}

func (s *Server) Shutdown(ctx context.Context) error {
	s.log.Info().
		Msg("HTTP server shutting down")

	return s.http.Shutdown(ctx)
}