package server

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
	"golang.org/x/oauth2"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/config"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/database"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/queue"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/repository"
)

type Server struct {
	http        *http.Server
	log         zerolog.Logger
	cfg         *config.Config
	mongo       *database.MongoDB
	redis       *database.RedisClient
	oauthCfg    *oauth2.Config
	userRepo    *repository.UserRepository
	videoRepo   *repository.VideoRepository
	queueClient *queue.Client
}

// New creates and configures the HTTP server.
func New(
	cfg *config.Config,
	log zerolog.Logger,
	mongo *database.MongoDB,
	redis *database.RedisClient,
	oauthCfg *oauth2.Config,
	userRepo *repository.UserRepository,
	videoRepo *repository.VideoRepository,
	queueClient *queue.Client,
) *Server {
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	router := gin.New()

	s := &Server{
		cfg:         cfg,
		log:         log,
		mongo:       mongo,
		redis:       redis,
		oauthCfg:    oauthCfg,
		userRepo:    userRepo,
		videoRepo:   videoRepo,
		queueClient: queueClient,
	}

	s.registerRoutes(router)

	s.http = &http.Server{
		Addr:              fmt.Sprintf(":%s", cfg.Port),
		Handler:           router,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
		ReadHeaderTimeout: 5 * time.Second,
	}

	return s
}

// Start starts the HTTP server.
func (s *Server) Start() error {
	s.log.Info().
		Str("addr", s.http.Addr).
		Msg("HTTP server listening")

	return s.http.ListenAndServe()
}

// Shutdown gracefully shuts down the HTTP server.
func (s *Server) Shutdown(ctx context.Context) error {
	s.log.Info().Msg("HTTP server shutting down")

	return s.http.Shutdown(ctx)
}
