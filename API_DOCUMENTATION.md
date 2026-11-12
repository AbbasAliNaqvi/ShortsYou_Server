# ShortsYou API Documentation

## 1. API conventions

### Base URLs

The web application resolves the Go API from `NEXT_PUBLIC_API_URL`. The source
contains local and deployed defaults; deployments should set the variable
explicitly.

- Go API: `http://localhost:5050` in local configuration, or the deployed API
  URL.
- Editor API: the value configured by `EDIT_SERVICE_URL` /
  `ML_AUDIO_SERVICE_URL`.

### Response envelope

The web client expects successful Go API responses in this shape:

```json
{
  "success": true,
  "data": {}
}
```

Errors are expected to contain an error message:

```json
{
  "success": false,
  "error": "human-readable error"
}
```

The exact status code and error body should be read from the handler for any
new client behavior. The frontend rejects non-2xx responses and also rejects a
response whose `success` field is false.

### Authentication

Protected `/api/v1` endpoints require:

```http
Authorization: Bearer <JWT>
```

The JWT is issued after the Google OAuth callback. Internal callback endpoints
under `/api/internal` require the configured internal API key through the
supported internal-key header(s). Never expose the internal key to the browser.

### Cross-cutting behavior

All routes pass through recovery, request logging, CORS, and rate limiting.
Protected routes additionally pass through JWT authentication. IDs are

## 3A. Telegram account integration

The website-to-Telegram connection is a one-time, short-lived deep-link flow.
The browser never receives or stores the Telegram bot token.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/integrations/telegram` | JWT | Returns whether the current creator has a linked Telegram account. |
| POST | `/api/v1/integrations/telegram/connect` | JWT | Creates a single-use connection link valid for 10 minutes. |
| POST | `/api/internal/telegram/link` | Bot internal key | Consumes the connection token after the bot verifies the user's Telegram contact. |

### Connect response

```json
{
  "success": true,
  "data": {
    "url": "https://t.me/<configured-bot>?start=<one-time-token>",
    "expiresAt": "2026-11-13T01:00:00Z"
  }
}
```

The bot opens the deep link, asks the user to share their own Telegram contact,
and submits this server-to-server payload:

```json
{
  "token": "<one-time-token>",
  "telegramId": 123456789,
  "username": "creator",
  "phone": "+..."
}
```

The Go service hashes tokens at rest, checks expiry and single use, prevents a
Telegram account from being linked to two ShortsYou accounts, and stores the
Telegram ID/username/phone on the existing user record. Phone numbers are never
returned by the public user API.

### Bot notification webhook

The Go service calls the configured bot service:

```http
POST /internal/notifications
X-Internal-API-Key: <service-key>
```

```json
{
  "telegramId": 123456789,
  "type": "processing_started|processing_failed|clip_exported|clip_export_failed",
  "title": "Your Short is ready",
  "message": "Your Short finished rendering and is ready to review or download.",
  "clipId": "<optional-clip-id>",
  "jobId": "<optional-job-id>",
  "videoUrl": "<optional-rendered-url>"
}
```

The bot presents notification messages in Telegram and, when `clipId` is
present, displays Approve/Reject actions. Notification delivery is best effort;
the Go job state remains authoritative and visible through the website. IDs are
URL-encoded by the frontend client.

## 2. System and documentation endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | Public | Checks service/dependency health. |
| GET | `/version` | Public | Returns service version/build information. |
| GET | `/openapi.json` | Public | Returns the embedded OpenAPI document. |
| GET | `/docs` | Public | Serves Scalar API documentation. |
| GET | `/debug/config` | Development only | Displays debug configuration information; unavailable in production. |

## 4. Authentication endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/auth/google` | Public | Starts Google OAuth. |
| GET | `/api/v1/auth/google/callback` | Public | Completes OAuth, creates/updates the user, and returns/redirects with authenticated session information. |
| GET | `/api/v1/auth/me` | JWT | Returns the authenticated user. |

The callback URL must be registered with Google and must match the configured
`GOOGLE_CALLBACK_URL`.

## 5. Channel and discovery endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/channels/search?q={query}` | Public | Searches public YouTube channels. |
| GET | `/api/v1/channels/{channelId}/videos` | Public | Lists videos for a public channel. |
| PUT | `/api/v1/channels/{channelId}/studio` | JWT | Adds/updates a channel in the authenticated user's studio. |

The public endpoints are discovery operations. They do not automatically make a
video part of a user's persisted processing pipeline until a protected process
or ingest operation is requested.

## 6. Video endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/videos/sync` | JWT | Synchronizes the user's configured channel and queues applicable work. |
| POST | `/api/v1/videos/ingest` | JWT | Ingests a direct URL. Typical request: `{ "url": "...", "transcribe": true }`. |
| POST | `/api/v1/videos/auto-create` | JWT | Ingests a direct URL and starts automatic short creation. Typical request: `{ "url": "..." }`. |
| GET | `/api/v1/videos` | JWT | Lists the user's videos. Optional `sort` query parameter is supported by the frontend. |
| GET | `/api/v1/videos/search?q={query}` | JWT | Searches YouTube videos for authenticated workflows. |
| DELETE | `/api/v1/videos/{id}` | JWT | Deletes a user-owned video. |
| GET | `/api/v1/videos/{id}/transcript` | JWT | Returns the persisted transcript and timestamps. |
| POST | `/api/v1/videos/{id}/generate` | JWT | Queues automatic candidate generation for an existing video. |
| POST | `/api/v1/videos/{id}/auto-create` | JWT | Queues automatic end-to-end short creation for an existing video. |
| POST | `/api/v1/channels/{channelId}/videos/{youtubeVideoId}/process` | JWT | Imports/processes a public channel video. Typical body: `{ "transcribe": true }`. |

Typical asynchronous responses contain `jobId`, `videoId`, `status`, `title`, or
an acknowledgement message. The client must poll the job endpoint.

## 7. Job endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/jobs` | JWT | Lists the authenticated user's processing jobs. |
| GET | `/api/v1/jobs/{jobId}` | JWT | Returns one job's status, progress, error, and completion information. |

Queue task types currently defined in the Go service:

| Task | Meaning |
|---|---|
| `video:process` | Download/process/transcribe/analyze video and optionally create clips. |
| `clip:export` | Render/export a clip through the editor service and persist output. |
| `clip:collect_analytics` | Delayed collection of publication/performance data. |
| `user:retrain_cpep` | Retrain creator prediction/scoring data. |

## 8. Clip and editor endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/clips` | JWT | Lists the user's clips. |
| GET | `/api/v1/clips/daily-reels` | JWT | Returns daily reel-oriented clip items. |
| GET | `/api/v1/clips/pending` | JWT | Lists pending/review clips. |
| GET | `/api/v1/clips/approved` | JWT | Lists approved clips. |
| GET | `/api/v1/clips/{id}` | JWT | Gets one clip. |
| PATCH | `/api/v1/clips/{id}` | JWT | Updates clip status, selected hook, and/or edit settings. |
| DELETE | `/api/v1/clips/{id}` | JWT | Deletes a user-owned clip. |
| POST | `/api/v1/videos/{id}/clips/manual` | JWT | Creates a manual clip. Typical body: `{ "startTime": 0, "endTime": 30, "hookText": "...", "editSettings": {} }`. |
| POST | `/api/v1/editor/auto-compose` | JWT | Generates an AI composition proposal. Typical body: `{ "videoId": "..." }`. |
| POST | `/api/v1/editor/generate-hooks` | JWT | Generates hook variations. Body can include `videoId`, `clipText`, and `tone`. |
| PATCH | `/api/v1/clips/{id}/approve` | JWT | Approves a candidate. |
| PATCH | `/api/v1/clips/{id}/reject` | JWT | Rejects a candidate. |
| POST | `/api/v1/clips/{id}/export` | JWT | Enqueues/render-starts clip export. |
| GET | `/api/v1/clips/{id}/download` | JWT | Returns a download URL for exported media. |
| POST | `/api/v1/clips/{id}/published` | JWT | Marks a clip as published. |
| GET | `/api/v1/edit/health` | JWT | Checks connectivity to the configured editor service. |

## 9. Swipe review endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/swipe/deck` | JWT | Returns the next candidate deck. |
| POST | `/api/v1/swipe/action` | JWT | Records a review action such as approval/rejection/skip. |
| POST | `/api/v1/swipe/undo` | JWT | Reverts the most recent supported swipe action. |
| GET | `/api/v1/swipe/stats` | JWT | Returns review statistics. |

The swipe operation is a review surface over persisted clips; it should not be
implemented as a separate source of truth.

## 10. Analytics endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/analytics/dna/generate` | JWT | Generates creator DNA asynchronously or according to handler behavior. |
| POST | `/api/v1/analytics/dna/generate/sync` | JWT | Forces the synchronous generation path. |
| GET | `/api/v1/analytics/dna` | JWT | Returns creator DNA. |
| GET | `/api/v1/analytics/knowledge-graph` | JWT | Returns topic/content relationship data. |
| GET | `/api/v1/analytics/content-gaps` | JWT | Returns content opportunity gaps. |
| GET | `/api/v1/analytics/personas` | JWT | Returns audience persona analysis. |
| GET | `/api/v1/analytics/trend-forecast` | JWT | Returns trend forecasts. |
| GET | `/api/v1/analytics/performance` | JWT | Returns clip/content performance. |
| GET | `/api/v1/analytics/model-accuracy` | JWT | Returns model evaluation information. |
| GET | `/api/v1/analytics/ab-tests` | JWT | Returns hook/variant experiment data. |

## 11. Administrative endpoint

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/admin/key-health` | JWT | Returns health/rotation information for configured LLM keys. |

This endpoint should be restricted further at deployment time if the JWT alone
does not represent an administrator role.

## 12. Internal callback endpoints

All internal endpoints are under `/api/internal` and use internal-key
authentication. They are service-to-service contracts, not browser APIs.

| Method | Path | Producer | Purpose |
|---|---|---|---|
| POST | `/api/internal/transcription/done` | ML/editor service | Persists transcript segments, words, filler words, and silence gaps; advances processing. |
| POST | `/api/internal/analysis/done` | ML/editor service | Persists analyzed segment scores, labels, embeddings, and topic data. |
| POST | `/api/internal/short/done` | Short-generation service | Records generated short result. |
| POST | `/api/internal/cpep/done` | CPEP service | Records model-training result. |
| POST | `/api/internal/dna/done` | Analytics service | Persists creator DNA result. |
| POST | `/api/internal/personas/done` | Analytics service | Persists audience personas. |
| POST | `/api/internal/forecast/done` | Analytics service | Persists trend forecast. |

### Transcription request/result contract

The Go ML client posts an asynchronous request to the configured editor/ML
`/transcribe` endpoint with the following fields:

```json
{
  "job_id": "job-id",
  "videoId": "video-id",
  "video_id": "video-id",
  "userId": "user-id",
  "user_id": "user-id",
  "audioUrl": "https://...",
  "audio_url": "https://...",
  "videoUrl": "https://...",
  "language": "en",
  "task": "transcribe",
  "translate": false,
  "callbackUrl": "https://go-api/api/internal/transcription/done",
  "callback_url": "https://go-api/api/internal/transcription/done",
  "internalKey": "<shared-secret>"
}
```

The editor returns an immediate accepted response. Its later callback contains
segments with `index`, `start`, `end`, `text`, and word timestamps, plus
`fillerWords`, `silenceGaps`, and `language`.

### Analysis request/result contract

The Go ML client posts transcript segments, filler words, silence gaps, video
and user IDs, job ID, language, callback URL, and internal key to `/analyze`.
The callback returns:

- analyzed segments;
- semantic labels;
- semantic, novelty, clarity, and hook scores;
- suggested hooks;
- optional embeddings;
- topic distribution with topic, label, and weight.

Callbacks must be idempotent or safely deduplicated because a producer may retry
after a timeout.

## 13. Editor FastAPI endpoints

These are defined in `shortsyou-edit/main.py`.

| Method | Path | Auth/Key | Purpose |
|---|---|---|---|
| GET | `/health` | Public | Service health. |
| POST | `/create-short` | Callback key in request | Runs the full asynchronous short-rendering pipeline and calls back with success/failure. |
| POST | `/extract-audio` | Service contract | Extracts/downloads audio for a source. |
| POST | `/transcribe` | Optional internal key | Starts background transcription; callback URL may be supplied in camelCase or snake_case. |
| POST | `/analyze` | Optional internal key | Starts background transcript analysis and callback delivery. |

Editor processing uses FFmpeg and can include:

1. source download;
2. clip extraction;
3. cleanup of silence/fillers;
4. vertical crop or speaker layout;
5. transcription and word timestamps;
6. captions;
7. music and dialogue mixing;
8. background treatment;
9. sound effects;
10. pacing/camera effects;
11. color grade;
12. thumbnail creation;
13. Supabase upload.

## 14. Error and retry guidance

- Treat non-2xx as a failed operation unless the endpoint explicitly documents
  an accepted asynchronous response.
- For accepted async operations, persist and poll the returned `jobId`.
- Do not retry a callback blindly without an idempotency strategy.
- Do not expose internal keys, provider keys, or signed storage credentials.
- Preserve ownership checks for every user-scoped video, clip, job, and analytics
  resource.
- Use `/openapi.json` from the running Go service as the final machine-readable
  contract when a discrepancy exists between this document and source.

## 15. Contract gaps requiring confirmation

The following should be finalized before external clients are generated:

1. Exact status codes and error schemas for every handler.
2. Complete request/response schemas for analytics and clip edit settings.
3. External publication provider and its callback contract.
4. Mayank repository endpoints and ownership model.
5. Sammyu repository endpoints and ownership model.
6. Whether editor `/create-short` is used directly in production or only through
   Go's queue-driven integration.
