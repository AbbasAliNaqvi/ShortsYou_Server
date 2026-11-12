# ShortsYou - Full Project Overview

## 1. Document purpose

This document is the business and technical overview of ShortsYou, a short-form
video intelligence and production platform. It is written from the source
available in:

- `ShortsYou_Server`: Go API, persistence, authentication, queue orchestration,
  YouTube integration, analytics, and integration contracts.
- `shortsyou-edit`: FastAPI media/AI worker for downloading media, extracting
  audio, transcription, analysis, editing, rendering, and Supabase uploads.
- `ShortsYou_Server/Web`: Next.js web application used by creators.

The Mayank repository and Sammyu's repository were not available during this
review. Their responsibilities are therefore represented only as external
integration boundaries when implied by the available source. They must not be
treated as verified implementation details until their repositories or API
contracts are reviewed.

## 2. Executive summary

ShortsYou helps a creator:

1. Authenticate with Google.
2. Discover a YouTube channel or video.
3. Add a channel to the creator studio or ingest a direct URL.
4. Download and register source video metadata.
5. Transcribe the source with word-level timestamps.
6. Analyze transcript segments for hooks, novelty, clarity, semantic labels,
   topics, and clip potential.
7. Generate candidate clips automatically or create a clip manually.
8. Review candidates in a swipe deck, approve/reject them, and edit metadata.
9. Render an export through the editor service.
10. Download or mark the clip as published.
11. Collect performance information and use it for creator analytics,
    experiments, and future scoring.

The platform is asynchronous at the expensive boundaries. The Go server is the
system of record and coordinator; Redis/Asynq carries background jobs; MongoDB
stores product state; Supabase stores media objects; external services provide
YouTube data, LLM responses, transcription, and media rendering.

## 3. Product capabilities

### Creator acquisition and source discovery

- Google OAuth login and callback handling.
- Current-user lookup through a JWT-protected endpoint.
- Public YouTube channel search.
- Public channel-video listing.
- Authenticated channel-to-studio registration.
- Direct YouTube URL ingestion.
- Channel synchronization into the user's studio.
- Processing of a public channel video.

### Video intelligence

- Video metadata persistence.
- Audio/video acquisition through `yt-dlp`.
- Word-level transcript persistence.
- Filler-word and silence-gap capture.
- Transcript segment analysis.
- Hook, semantic, novelty, and clarity scoring.
- Topic distribution and downstream creator intelligence.

### Short generation and editing

- Automatic short generation from an ingested video.
- Automatic short generation from a direct URL.
- AI auto-compose and hook generation.
- Manual clip creation using start/end times.
- Caption style and edit-setting persistence.
- Swipe-based candidate review.
- Clip approval and rejection.
- Asynchronous export and downloadable media URL.
- Publish-state tracking.

### Creator analytics

- Creator DNA.
- Knowledge graph.
- Content gaps.
- Audience personas.
- Trend forecasts.
- Performance analytics.
- Model accuracy.
- A/B experiment reporting.

### Telegram Assistant integration

- Authenticated creators can open **Settings -> Connect Telegram**.
- The Go API creates a one-time, ten-minute deep link to the configured bot.
- The bot asks the user to share their own Telegram contact before finalizing
  the link.
- The Go user record stores the Telegram identity; the phone number is private.
- Processing and rendered-Short events can be delivered to the bot through an
  authenticated internal webhook.
- Ready notifications can include Approve/Reject actions for a clip.
- The website remains the source of truth; Telegram is an additional control and
  notification surface.
- CPEP-related training/retraining callbacks.

## 4. Users and actors

| Actor | Responsibilities |
|---|---|
| Creator | Authenticates, imports content, reviews clips, edits, exports, publishes, and reads analytics. |
| Web application | Presents product workflows, stores/forwards the JWT, polls jobs, and calls the Go API. |
| Go API server | Authenticates requests, validates ownership, coordinates services, persists state, and exposes the public contract. |
| Queue worker | Executes long-running video processing, clip exporting, analytics collection, and retraining tasks. |
| MongoDB | Stores users, videos, clips, jobs, transcripts, analytics, experiments, and model outputs. |
| Redis/Asynq | Provides the task queue and delayed task scheduling. |
| Editor FastAPI service | Downloads media, transcribes, analyzes, composes, edits, renders, and uploads media. |
| YouTube APIs / `yt-dlp` | Provide channel/video metadata and source media. |
| LLM providers | Groq and Gemini keys are rotated by the Go LLM rotator and used by AI tools. |
| Supabase Storage | Stores source/processed media and returns public or signed URLs according to configuration. |
| Unavailable companion services | Mayank/Sammyu components are not source-verified; integration must use an agreed contract. |

## 5. Repository map

### Go backend: `ShortsYou_Server`

| Area | Source location | Responsibility |
|---|---|---|
| Process entry point | `cmd/server/main.go` | Loads configuration, connects dependencies, starts HTTP server and worker, handles shutdown. |
| HTTP composition | `internal/server/server.go` | Builds the server dependency graph and HTTP timeouts. |
| Routes | `internal/server/routes.go` | Registers public, protected, internal, and documentation routes. |
| API description | `internal/server/openapi.go` | Serves the OpenAPI JSON and Scalar documentation page. |
| Handlers | `internal/handler/` | HTTP validation, authorization, orchestration, and response mapping. |
| Middleware | `internal/middleware/` | Recovery, request logging, CORS, rate limiting, JWT, and internal-key authentication. |
| Repositories | `internal/repository/` | MongoDB persistence access per aggregate/entity. |
| Models | `internal/models/` | BSON/JSON data structures. |
| Queue | `internal/queue/` | Asynq task definitions, client, worker registration, and task handlers. |
| ML contracts | `internal/ml/` | HTTP client and request/response types for asynchronous transcription and analysis. |
| YouTube | `internal/youtube/` | YouTube public API, analytics, and metadata clients. |
| Storage | `internal/storage/` | Supabase storage integration. |
| AI tools | `internal/aitools/`, `internal/llm/`, `internal/scoring/` | LLM rotation, clip composition, scoring, and model-facing logic. |
| Configuration | `internal/config/` | Environment loading, defaults, and startup validation. |
| Telegram integration | `internal/telegram/`, `internal/handler/telegram.go` | One-time account linking and authenticated notification delivery. |

### Web application: `ShortsYou_Server/Web`

The web app is a Next.js 16 / React 19 TypeScript application. It contains:

- App Router pages for dashboard, discovery, swipe review, clips, editor,
  analytics, login, and registration.
- RTK Query API slices under `Web/src/store/api/`.
- A shared request wrapper under `Web/src/lib/api.ts`.
- Redux state and React Query/RTK Query integrations.
- Tailwind CSS and reusable UI components.
- A configurable `NEXT_PUBLIC_API_URL`, with local and deployed defaults.

### Editor service: `shortsyou-edit`

The editor is a Python 3 FastAPI service. Its processing modules include:

- `audio.py`: YouTube audio download and extraction.
- `transcription.py`: Groq Whisper transcription with local Whisper fallback.
- `ai_director.py`: transcript/segment reasoning and execution blueprint generation.
- `cleaner.py`: silence/filler cleanup.
- `cropper.py`: vertical reframing and speaker-aware crop.
- `captions.py`: script-aware caption rendering and word grouping.
- `audio_mixer.py`: dialogue normalization, music mixing, and ducking.
- `backgrounds.py`: blur, gradient, solid, or unchanged backgrounds.
- `sfx.py`: emotion-driven sound-effect selection and placement.
- `pacing.py`: camera punch-in effects.
- `grader.py`: color grading.
- `two_frame.py`: speaker/panel layout rendering.
- `renderer.py`: clip extraction, composition, FFmpeg execution, thumbnails,
  and Supabase upload.

## 6. Runtime and deployment topology

The Go service listens on its configured port (default `5050` in config; the
provided Docker Compose mapping exposes container port `8080`, so deployment
configuration must keep the actual process port and container mapping aligned).
The frontend normally runs on port `3000`. The editor service exposes FastAPI
HTTP endpoints, commonly on port `8000` or the deployment-provided port.

Required runtime dependencies:

- MongoDB/MongoDB Atlas.
- Redis/Upstash Redis.
- Supabase Storage.
- Google OAuth credentials.
- YouTube API key where API metadata is used.
- At least one Groq key; Gemini keys are optional for paths that use Gemini.
- JWT secret and internal callback key.
- Public HTTPS callback URL in production.

## 7. Configuration categories

Configuration is environment-based. Do not copy real values into documentation,
source control, or issue comments.

| Category | Examples |
|---|---|
| Runtime | `ENV`, `PORT`, `BASE_URL`, `FRONTEND_URL`, `ALLOWED_ORIGINS` |
| Persistence | `MONGO_URI`, `MONGO_DB_NAME`, `REDIS_URL` |
| Storage | `SUPABASE_URL`, `SUPABASE_KEY` |
| OAuth/YouTube | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `YOUTUBE_API_KEY` |
| Security | `JWT_SECRET`, `JWT_EXPIRY_HOURS`, `INTERNAL_API_KEY`, `ML_API_KEY` |
| Services | `ML_NLP_SERVICE_URL`, `ML_AUDIO_SERVICE_URL`, `EDIT_SERVICE_URL` |
| Telegram | `TELEGRAM_BOT_URL`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_SERVICE_KEY` |
| AI | `GROQ_KEY_1..5`, `GEMINI_KEY_1..2`, editor model and timeout settings |
| Editor | `SUPABASE_URL`, editor callback settings, transcription provider/model settings |

## 8. Persistence overview

The verified MongoDB collections are:

| Collection | Purpose |
|---|---|
| `users` | Creator identity, Google identity, channel, and token metadata. |
| `videos` | Imported YouTube/source video metadata and processing state. |
| `processing_jobs` | Asynchronous job status, progress, errors, and completion time. |
| `transcripts` | Transcript segments, word timestamps, filler words, and silence gaps. |
| `clips` | Candidate and produced clips, scores, status, edit settings, export URL, and publication state. |
| `feature_matrix` | Clip/content features and performance bands. |
| `creator_dna` | Creator content style, topics, features, and emotional range. |
| `audience_personas` | Audience vocabulary, sentiment, percentage, and engagement signals. |
| `trend_forecasts` | Topic forecasts, confidence intervals, similarity, and predicted peaks. |
| `ab_experiments` | Hook variants, CTR observations, lift, and experiment completion. |
| `telegram_links` | Hashed, expiring, single-use website-to-bot connection tokens. |

The Go startup creates indexes for identity uniqueness, user-scoped access,
processing status, clip score/status, analytics lookups, and experiment lookups.

## 9. Important state transitions

### Video lifecycle

`discovered -> ingested -> queued/processing -> transcribed -> analyzed ->
clips_ready -> completed` with failure states possible at download,
transcription, analysis, or rendering boundaries.

The exact enum values should be treated as implementation-defined and read from
the current model/handler behavior when implementing a client.

### Clip lifecycle

`candidate -> pending/review -> approved OR rejected -> export queued ->
exported -> published`.

Approval, rejection, export, download, and publication are distinct operations;
publication does not necessarily mean that the external social-platform upload
itself is implemented in this repository.

### Job lifecycle

Jobs expose status and progress through `/api/v1/jobs` and
`/api/v1/jobs/:jobId`. The web UI should use the job status rather than assuming
that a `202` response means the media is ready.

## 10. Known integration truths and limitations

1. The Go server is the authoritative callback receiver for transcription and
   analysis results.
2. The editor service accepts asynchronous `/transcribe` and `/analyze` jobs and
   posts results to Go callback URLs.
3. Callback authentication uses the shared internal key through supported
   internal-key headers.
4. The editor service contains a local Whisper fallback, but local fallback
   availability depends on the deployment image and model runtime.
5. The Go repository exposes documentation at `/openapi.json` and `/docs`.
6. The current source does not prove that Mayank's or Sammyu's work is present
   in this repository.
7. External publication to social platforms is represented by clip publication
   state; the actual external publishing adapter requires separate confirmation.
8. Telegram is optional and requires `TELEGRAM_BOT_USERNAME`,
   `TELEGRAM_BOT_URL`, and `TELEGRAM_SERVICE_KEY`.
9. Any report generated from this overview must label unverified external
   services as assumptions or open integration contracts.

## 11. Recommended report framing

For a final architecture/report package, present ShortsYou as:

- a creator-facing web product;
- a Go API and orchestration layer;
- a durable MongoDB product store;
- a Redis/Asynq asynchronous execution layer;
- a Python/FastAPI media intelligence and rendering worker;
- external AI, YouTube, and object-storage providers;
- callback-driven boundaries for long-running ML work.

The strongest architectural theme is separation of concerns: the Go service
owns product state and workflow, while the editor service owns media computation
and returns artifacts/results through explicit HTTP contracts.
