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
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/llm"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/ml"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/queue"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/repository"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/server"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/storage"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/logger"
)

var (
	version   = "1.0.0"
	buildTime = "unknown"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		os.Stderr.WriteString("[shortsyou] config error: " + err.Error() + "\n")
		os.Exit(1)
	}

	log := logger.New(cfg.Env)
	log.Info().
		Str("version", version).
		Str("buildTime", buildTime).
		Str("env", cfg.Env).
		Msg("ShortsYou_Server starting")

	log.Info().Msg("connecting to mongodb")
	mongo, err := database.NewMongo(cfg.MongoURI, cfg.MongoDBName)
	if err != nil {
		log.Fatal().Err(err).Msg("mongodb connection failed")
	}
	defer func() {
		if err := mongo.Disconnect(); err != nil {
			log.Error().Err(err).Msg("mongodb disconnect error")
			return
		}
		log.Info().Msg("mongodb disconnected")
	}()
	if err := mongo.CreateIndexes(context.Background()); err != nil {
		log.Fatal().Err(err).Msg("mongodb index creation failed")
	}
	log.Info().Str("db", cfg.MongoDBName).Msg("mongodb ready")

	log.Info().Msg("connecting to redis")
	redis, err := database.NewRedis(cfg.RedisURL)
	if err != nil {
		log.Fatal().Err(err).Msg("redis connection failed")
	}
	defer func() {
		if err := redis.Close(); err != nil {
			log.Error().Err(err).Msg("redis close error")
			return
		}
		log.Info().Msg("redis disconnected")
	}()
	log.Info().Msg("redis ready")

	log.Info().Msg("initializing queue client")
	queueClient, err := queue.NewClient(cfg.RedisURL)
	if err != nil {
		log.Fatal().Err(err).Msg("queue client init failed")
	}
	defer func() {
		queueClient.Close()
		log.Info().Msg("queue client closed")
	}()
	log.Info().Msg("queue client ready")

	log.Info().Msg("initializing queue worker")
	worker, err := queue.NewWorker(cfg.RedisURL, log)
	if err != nil {
		log.Fatal().Err(err).Msg("queue worker init failed")
	}

	// Repositories
	userRepo := repository.NewUserRepository(mongo)
	videoRepo := repository.NewVideoRepository(mongo)
	clipRepo := repository.NewClipRepository(mongo)
	fmRepo := repository.NewFeatureMatrixRepository(mongo)
	dnaRepo := repository.NewCreatorDNARepository(mongo)
	personaRepo := repository.NewPersonaRepository(mongo)
	trendRepo := repository.NewTrendForecastRepository(mongo)
	abRepo := repository.NewABExperimentRepository(mongo)

	// Services
	oauthCfg := auth.NewOAuthConfig(cfg)
	llmRotator := llm.NewRotator(cfg.GroqKeys, cfg.GeminiKeys)
	var mlClient ml.Service

	if cfg.Env == "development" {
		mlClient = ml.NewMockService()
	} else {
		mlClient = ml.NewClient(
			cfg.MLNLPServiceURL,
			cfg.MLAudioServiceURL,
		)
	}

	supabase := storage.NewSupabase(cfg.SupabaseURL, cfg.SupabaseKey)

	taskHandlers := queue.NewTaskHandlers(
		log, videoRepo, clipRepo, fmRepo, userRepo,
		mlClient, supabase, llmRotator, queueClient, cfg,
	)
	worker.Register(queue.TypeProcessVideo, taskHandlers.HandleProcessVideo)
	worker.Register(queue.TypeExportClip, taskHandlers.HandleExportClip)
	worker.Register(queue.TypeCollectAnalytics, taskHandlers.HandleCollectAnalytics)
	worker.Register(queue.TypeRetrainCPEP, taskHandlers.HandleRetrainCPEP)

	go func() {
		log.Info().Msg("queue worker starting")
		if err := worker.Start(); err != nil {
			log.Error().Err(err).Msg("queue worker stopped")
		}
	}()

	srv := server.New(
		cfg, log, mongo, redis,
		oauthCfg,
		userRepo, videoRepo, clipRepo, fmRepo,
		dnaRepo, personaRepo, trendRepo, abRepo,
		queueClient,
		llmRotator,
	)

	go func() {
		if err := srv.Start(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Error().Err(err).Msg("server stopped unexpectedly")
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("shutdown signal received")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Error().Err(err).Msg("server shutdown error")
	}

	log.Info().Msg("stopping queue worker")
	worker.Stop()
	log.Info().Msg("queue worker stopped")
	log.Info().Msg("server stopped cleanly")
}
