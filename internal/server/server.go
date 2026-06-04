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
	http *http.Server
	log zerolog.Logger
	cfg *config.Config
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
	s:= &Server{
		cfg: cfg,
		log: log,
		mongo: mongo,
		redis: redis,
	}

	s.http = &http.Server{
		Addr: fmt.Sprintf(":%d", cfg.Port),
		Handler: router,
		ReadTimeout: 15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout: 60 * time.Second,
		ReadHeaderTimeout: 5 * time.Second,
	}

	return s
}

func (s *Server) Start() error {
	s.log.Info().Str("addr", s.http.Addr).Msg("Http Server Listensing")
	return s.http.ListenAndServe()
}

func (s *Server) Shutdown(ctx context.Context) error {
	s.log.Info().Msg("Http Server Shutting Down")
	return s.http.Shutdown(ctx)
}