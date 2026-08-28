package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/auth"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/config"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/database"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/repository"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/server"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/logger"
)

const version = "0.1.0"

func main() {
	// Load configuration.
	cfg, err := config.Load()
	if err != nil {
		os.Stderr.WriteString(
			"[shortsyou] config error: " + err.Error() + "\n",
		)
		os.Exit(1)
	}

	// Initialize logger.
	log := logger.New(cfg.Env)

	log.Info().
		Str("version", version).
		Str("env", cfg.Env).
		Msg("ShortsYou_Server starting")

	// Connect to MongoDB.
	log.Info().
		Msg("connecting to mongodb")

	mongo, err := database.NewMongo(
		cfg.MongoURI,
		cfg.MongoDBName,
	)
	if err != nil {
		log.Fatal().
			Err(err).
			Msg("mongodb connection failed")
	}

	defer func() {
		ctx, cancel := context.WithTimeout(
			context.Background(),
			5*time.Second,
		)
		defer cancel()

		if err := mongo.Disconnect(ctx); err != nil {
			log.Error().
				Err(err).
				Msg("mongodb disconnect error")

			return
		}

		log.Info().
			Msg("mongodb disconnected")
	}()

	// Create MongoDB indexes.
	ctx, cancel := context.WithTimeout(
		context.Background(),
		30*time.Second,
	)

	if err := mongo.CreateIndexes(ctx); err != nil {
		cancel()

		log.Fatal().
			Err(err).
			Msg("mongodb index creation failed")
	}

	cancel()

	log.Info().
		Str("db", cfg.MongoDBName).
		Msg("mongodb ready")

	// Connect to Redis.
	log.Info().
		Msg("connecting to redis")

	redis, err := database.NewRedis(cfg.RedisURL)
	if err != nil {
		log.Fatal().
			Err(err).
			Msg("redis connection failed")
	}

	defer func() {
		if err := redis.Close(); err != nil {
			log.Error().
				Err(err).
				Msg("redis close error")

			return
		}

		log.Info().
			Msg("redis disconnected")
	}()

	log.Info().
		Msg("redis ready")

	// Configure Google OAuth.
	oauthCfg := auth.NewOAuthConfig(cfg)

	// Create user repository.
	userRepo := repository.NewUserRepository(mongo)

	// Create HTTP server.
	srv := server.New(
		cfg,
		log,
		mongo,
		redis,
		oauthCfg,
		userRepo,
	)

	// Start HTTP server.
	go func() {
		if err := srv.Start(); err != nil &&
			!errors.Is(err, http.ErrServerClosed) {
			log.Error().
				Err(err).
				Msg("server stopped unexpectedly")

			os.Exit(1)
		}
	}()

	log.Info().
		Str("port", cfg.Port).
		Msg("HTTP server started")

	// Wait for termination signal.
	quit := make(chan os.Signal, 1)

	signal.Notify(
		quit,
		syscall.SIGINT,
		syscall.SIGTERM,
	)

	<-quit

	log.Info().
		Msg("shutdown signal received")

	// Gracefully shut down HTTP server.
	shutdownCtx, shutdownCancel := context.WithTimeout(
		context.Background(),
		30*time.Second,
	)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Error().
			Err(err).
			Msg("server shutdown error")
	}

	log.Info().
		Msg("server stopped cleanly")
}