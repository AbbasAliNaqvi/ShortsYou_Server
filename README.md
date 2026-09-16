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

## Transcription and analysis integration

The server treats ML work as an asynchronous, callback-driven pipeline. Configure
the friend service without committing its bearer token:

```bash
ML_NLP_SERVICE_URL=https://shortsyou.onrender.com/api/v1
ML_API_KEY=your_transcription_service_bearer_token
BASE_URL=https://your-public-go-server.example
INTERNAL_API_KEY=a-long-shared-callback-secret
```

For each video the server sends `/transcribe` `job_id`, `videoId`, `userId`,
`audioUrl`, and `language`. Once a transcript is ready, the ML service must POST
the transcript to `BASE_URL/api/internal/transcription/done`; the Go server then
persists the full word timestamps and starts `/analyze`. Analysis must POST its
results to `BASE_URL/api/internal/analysis/done`.

Callbacks are authenticated with either `X-Internal-Key`,
`X-Internal-API-Key`, or `Authorization: Bearer <INTERNAL_API_KEY>`. Both callback
URLs must be public HTTPS URLs reachable by the Render service. The pasted ML
router only acknowledges `/transcribe`; if its background service does not send
the transcription callback, it needs that callback added before the pipeline can
complete—the database entry in the ML service alone is not visible to this Go
server.
