package logger

import (
	"io"
	"os"
	"time"

	"github.com/rs/zerolog"
)

func New(env string) zerolog.Logger {
	zerolog.TimeFieldFormat = time.RFC3339

	var w io.Writer
	if env == "development" {
		w = zerolog.ConsoleWriter{
			Out:        os.Stderr,
			TimeFormat: time.RFC3339,
		}
	} else {
		w = os.Stderr
	}

	return zerolog.New(w).
		With().
		Timestamp().
		Str("service", "shortsyou-server").
		Logger()
}