package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/config"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/database"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/server"
	"github.com/rs/zerolog"
)

func main() {
	log := zerolog.New(os.Stdout).With().
		Timestamp().
		Logger()

	// Load configuration.
	cfg, err := config.Load()
	if err != nil {
		log.Fatal().
			Err(err).
			Msg("failed to load configuration")
	}

	// Connect to MongoDB.
	mongoDB, err := database.NewMongo(
		cfg.MongoURI,
		cfg.MongoDBName,
	)
	if err != nil {
		log.Fatal().
			Err(err).
			Msg("failed to connect to MongoDB")
	}

	defer func() {
		if err := mongoDB.Disconnect(context.Background()); err != nil {
			log.Error().
				Err(err).
				Msg("failed to disconnect from MongoDB")
		}
	}()

	// Connect to Redis.
	redisClient, err := database.NewRedis(cfg.RedisURL)
	if err != nil {
		log.Fatal().
			Err(err).
			Msg("failed to connect to Redis")
	}

	defer func() {
		if err := redisClient.Close(); err != nil {
			log.Error().
				Err(err).
				Msg("failed to close Redis")
		}
	}()

	// Create MongoDB indexes.
	ctx, cancel := context.WithTimeout(
		context.Background(),
		30*time.Second,
	)

	if err := mongoDB.CreateIndexes(ctx); err != nil {
		cancel()

		log.Fatal().
			Err(err).
			Msg("failed to create MongoDB indexes")
	}

	cancel()

	// Create HTTP server.
	srv := server.New(
		cfg,
		log,
		mongoDB,
		redisClient,
	)

	// Start HTTP server in background.
	serverErr := make(chan error, 1)

	go func() {
		serverErr <- srv.Start()
	}()

	log.Info().
		Str("addr", ":"+cfg.Port).
		Msg("ShortsYou server started")

	// Wait for Ctrl+C / termination signal.
	sigChan := make(chan os.Signal, 1)
	signal.Notify(
		sigChan,
		syscall.SIGINT,
		syscall.SIGTERM,
	)

	select {
	case err := <-serverErr:
		if err != nil {
			log.Error().
				Err(err).
				Msg("server stopped")
		}

	case sig := <-sigChan:
		log.Info().
			Str("signal", sig.String()).
			Msg("shutdown signal received")
	}

	// Graceful shutdown.
	shutdownCtx, shutdownCancel := context.WithTimeout(
		context.Background(),
		10*time.Second,
	)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Error().
			Err(err).
			Msg("server shutdown failed")
	} else {
		log.Info().
			Msg("server shutdown complete")
	}
}
