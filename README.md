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

## YouTube downloads on Render

If `yt-dlp` reports `Sign in to confirm you're not a bot`, add a Render secret
environment variable named `YOUTUBE_COOKIES_BASE64`. Set it to the base64-encoded
Netscape cookies file exported from a YouTube account that can view the video.
The server uses it only while downloading and removes the temporary cookie file
afterward. Do not commit the cookies file or its decoded contents.