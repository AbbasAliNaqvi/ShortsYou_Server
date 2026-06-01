# ShortsYou_Server

Go backend for the ShortsYou platform.

## Stack

- **Language** — Go 1.22
- **Router** — Gin
- **Database** — MongoDB Atlas (free M0)
- **Queue** — Upstash Redis via Asynq
- **LLM** — Groq (6 keys) + Gemini (2 keys) with round-robin rotation

## Quick start

```bash
cp .env.example .env
# fill in credentials — see .env.example

go mod download
make run
```

## Commands

```
make build    compile binary to bin/
make run      build and run
make test     run all tests with race detector
make tidy     tidy go modules
make clean    remove build artifacts
```