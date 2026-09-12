package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Env         string
	Port        string
	BaseURL     string
	FrontendURL string

	MongoURI    string
	MongoDBName string

	RedisURL string

	SupabaseURL string
	SupabaseKey string

	GoogleClientID     string
	GoogleClientSecret string
	GoogleCallbackURL  string
	YoutubeAPIKey      string

	JWTSecret      string
	JWTExpiryHours int

	MLNLPServiceURL   string
	MLAudioServiceURL string

	InternalAPIKey string

	GroqKeys   []string
	GeminiKeys []string

	AllowedOrigins []string

	MLAPIKey string
}

func Load() (*Config, error) {
	v := viper.New()

	v.SetConfigFile(".env")
	v.AutomaticEnv()

	if err := v.ReadInConfig(); err != nil {
		fmt.Printf("warning: could not read .env file: %v\n", err)
	}

	cfg := &Config{
		Env:         v.GetString("ENV"),
		Port:        v.GetString("PORT"),
		BaseURL:     v.GetString("BASE_URL"),
		FrontendURL: v.GetString("FRONTEND_URL"),

		MongoURI:    v.GetString("MONGO_URI"),
		MongoDBName: v.GetString("MONGO_DB_NAME"),

		RedisURL: v.GetString("REDIS_URL"),

		SupabaseURL: v.GetString("SUPABASE_URL"),
		SupabaseKey: v.GetString("SUPABASE_KEY"),

		GoogleClientID:     v.GetString("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: v.GetString("GOOGLE_CLIENT_SECRET"),
		GoogleCallbackURL:  v.GetString("GOOGLE_CALLBACK_URL"),
		YoutubeAPIKey:      v.GetString("YOUTUBE_API_KEY"),

		JWTSecret:      v.GetString("JWT_SECRET"),
		JWTExpiryHours: v.GetInt("JWT_EXPIRY_HOURS"),

		MLNLPServiceURL:   v.GetString("ML_NLP_SERVICE_URL"),
		MLAudioServiceURL: v.GetString("ML_AUDIO_SERVICE_URL"),

		InternalAPIKey: v.GetString("INTERNAL_API_KEY"),
		MLAPIKey:       v.GetString("ML_API_KEY"),
	}

	for i := 1; i <= 5; i++ {
		if k := strings.TrimSpace(v.GetString(fmt.Sprintf("GROQ_KEY_%d", i))); k != "" {
			cfg.GroqKeys = append(cfg.GroqKeys, k)
		}
	}

	for i := 1; i <= 2; i++ {
		if k := strings.TrimSpace(v.GetString(fmt.Sprintf("GEMINI_KEY_%d", i))); k != "" {
			cfg.GeminiKeys = append(cfg.GeminiKeys, k)
		}
	}

	if raw := v.GetString("ALLOWED_ORIGINS"); raw != "" {
		for _, origin := range strings.Split(raw, ",") {
			if origin = strings.TrimSpace(origin); origin != "" {
				cfg.AllowedOrigins = append(cfg.AllowedOrigins, origin)
			}
		}
	}

	// Defaults
	if cfg.Env == "" {
		cfg.Env = "development"
	}

	if cfg.Port == "" {
		cfg.Port = "8080"
	}

	if cfg.BaseURL == "" {
		cfg.BaseURL = "http://localhost:" + cfg.Port
	}

	if cfg.FrontendURL == "" {
		cfg.FrontendURL = "http://localhost:3000"
	}

	if cfg.MongoDBName == "" {
		cfg.MongoDBName = "shortsyou"
	}

	if cfg.JWTExpiryHours == 0 {
		cfg.JWTExpiryHours = 168 // 7 days
	}

	if cfg.MLNLPServiceURL == "" {
		cfg.MLNLPServiceURL = "http://localhost:8000"
	}

	if cfg.MLAudioServiceURL == "" {
		cfg.MLAudioServiceURL = "http://localhost:8001"
	}

	if len(cfg.AllowedOrigins) == 0 && cfg.Env == "development" {
		cfg.AllowedOrigins = []string{
			"http://localhost:3000",
		}
	}

	return cfg, validate(cfg)
}

func validate(cfg *Config) error {
	required := []struct {
		key string
		val string
	}{
		{"MONGO_URI", cfg.MongoURI},
		{"REDIS_URL", cfg.RedisURL},
		{"JWT_SECRET", cfg.JWTSecret},

		{"GOOGLE_CLIENT_ID", cfg.GoogleClientID},
		{"GOOGLE_CLIENT_SECRET", cfg.GoogleClientSecret},
		{"GOOGLE_CALLBACK_URL", cfg.GoogleCallbackURL},

		{"INTERNAL_API_KEY", cfg.InternalAPIKey},
	}

	var missing []string

	for _, r := range required {
		if strings.TrimSpace(r.val) == "" {
			missing = append(missing, r.key)
		}
	}

	if len(missing) > 0 {
		return fmt.Errorf(
			"missing required environment variables: %s",
			strings.Join(missing, ", "),
		)
	}

	if len(cfg.GroqKeys) == 0 {
		return fmt.Errorf("at least one GROQ_KEY is required")
	}

	return nil
}
