package server

import "net/http"

// This intentionally lives with the HTTP routes instead of adding a Swagger
// generator/dependency. It documents the routes implemented by this service
// while leaving their handlers and response envelopes unchanged.
const openAPISpec = `{
  "openapi":"3.1.0",
  "info":{"title":"ShortsYou API","version":"1.0.0","description":"Video ingestion, AI short creation, and creator-studio API."},
  "servers":[{"url":"/","description":"Current server"}],
  "tags":[{"name":"System"},{"name":"Authentication"},{"name":"Channels"},{"name":"Videos"},{"name":"Clips"},{"name":"Jobs"},{"name":"Analytics"},{"name":"Internal callbacks"},{"name":"Admin"}],
  "paths":{
    "/health":{"get":{"tags":["System"],"summary":"Get service health","responses":{"200":{"description":"Service health"}}}},
    "/version":{"get":{"tags":["System"],"summary":"Get service version","responses":{"200":{"description":"Service version"}}}},
    "/api/v1/auth/google":{"get":{"tags":["Authentication"],"summary":"Start Google sign-in","responses":{"302":{"description":"Google authorization redirect"}}}},
    "/api/v1/auth/google/callback":{"get":{"tags":["Authentication"],"summary":"Complete Google sign-in","responses":{"302":{"description":"Studio redirect"}}}},
    "/api/v1/auth/me":{"get":{"tags":["Authentication"],"summary":"Get the authenticated user","security":[{"bearerAuth":[]}],"responses":{"200":{"description":"Current user"}}}},
    "/api/v1/channels/search":{"get":{"tags":["Channels"],"summary":"Search YouTube channels","parameters":[{"$ref":"#/components/parameters/query"}],"responses":{"200":{"description":"Matching channels"}}}},
    "/api/v1/channels/{channelId}/videos":{"get":{"tags":["Channels"],"summary":"List a channel's videos","parameters":[{"$ref":"#/components/parameters/channelId"}],"responses":{"200":{"description":"Channel videos"}}}},
    "/api/v1/channels/{channelId}/studio":{"put":{"tags":["Channels"],"summary":"Add a channel to the studio","security":[{"bearerAuth":[]}],"parameters":[{"$ref":"#/components/parameters/channelId"}],"responses":{"200":{"description":"Channel saved"}}}},
    "/api/v1/channels/{channelId}/videos/{youtubeVideoId}/process":{"post":{"tags":["Videos"],"summary":"Process a public video","security":[{"bearerAuth":[]}],"parameters":[{"$ref":"#/components/parameters/channelId"},{"$ref":"#/components/parameters/youtubeVideoId"}],"responses":{"200":{"description":"Processing queued"}}}},
    "/api/v1/videos":{"get":{"tags":["Videos"],"summary":"List studio videos","security":[{"bearerAuth":[]}],"responses":{"200":{"description":"Videos"}}}},
    "/api/v1/videos/search":{"get":{"tags":["Videos"],"summary":"Search YouTube videos","security":[{"bearerAuth":[]}],"parameters":[{"$ref":"#/components/parameters/query"}],"responses":{"200":{"description":"Search results"}}}},
    "/api/v1/videos/sync":{"post":{"tags":["Videos"],"summary":"Sync the connected YouTube channel","security":[{"bearerAuth":[]}],"responses":{"200":{"description":"Sync queued"}}}},
    "/api/v1/videos/ingest":{"post":{"tags":["Videos"],"summary":"Ingest a YouTube URL","security":[{"bearerAuth":[]}],"requestBody":{"$ref":"#/components/requestBodies/ingest"},"responses":{"200":{"description":"Ingest queued"}}}},
    "/api/v1/videos/auto-create":{"post":{"tags":["Videos"],"summary":"Ingest and automatically create shorts","security":[{"bearerAuth":[]}],"requestBody":{"$ref":"#/components/requestBodies/autoCreate"},"responses":{"200":{"description":"Full pipeline queued"}}}},
    "/api/v1/videos/{id}":{"delete":{"tags":["Videos"],"summary":"Delete a video and its clips","security":[{"bearerAuth":[]}],"parameters":[{"$ref":"#/components/parameters/id"}],"responses":{"200":{"description":"Video deleted"}}}},
    "/api/v1/videos/{id}/generate":{"post":{"tags":["Videos"],"summary":"Detect clips from a saved video","security":[{"bearerAuth":[]}],"parameters":[{"$ref":"#/components/parameters/id"}],"responses":{"200":{"description":"Generation queued"}}}},
    "/api/v1/videos/{id}/auto-create":{"post":{"tags":["Videos"],"summary":"Automatically create ready-to-download shorts","security":[{"bearerAuth":[]}],"parameters":[{"$ref":"#/components/parameters/id"}],"responses":{"200":{"description":"Full pipeline queued"}}}},
    "/api/v1/videos/{id}/transcript":{"get":{"tags":["Videos"],"summary":"Get a video transcript","security":[{"bearerAuth":[]}],"parameters":[{"$ref":"#/components/parameters/id"}],"responses":{"200":{"description":"Transcript"}}}},
    "/api/v1/videos/{id}/clips/manual":{"post":{"tags":["Clips"],"summary":"Create a manual clip","security":[{"bearerAuth":[]}],"parameters":[{"$ref":"#/components/parameters/id"}],"responses":{"200":{"description":"Clip queued"}}}},
    "/api/v1/jobs":{"get":{"tags":["Jobs"],"summary":"List processing jobs","security":[{"bearerAuth":[]}],"responses":{"200":{"description":"Jobs"}}}},
    "/api/v1/jobs/{jobId}":{"get":{"tags":["Jobs"],"summary":"Get a processing job","security":[{"bearerAuth":[]}],"parameters":[{"$ref":"#/components/parameters/jobId"}],"responses":{"200":{"description":"Job"}}}},
    "/api/v1/clips":{"get":{"tags":["Clips"],"summary":"List clips","security":[{"bearerAuth":[]}],"responses":{"200":{"description":"Clips"}}}},
    "/api/v1/clips/pending":{"get":{"tags":["Clips"],"summary":"List pending clips","security":[{"bearerAuth":[]}],"responses":{"200":{"description":"Pending clips"}}}},
    "/api/v1/clips/approved":{"get":{"tags":["Clips"],"summary":"List approved clips","security":[{"bearerAuth":[]}],"responses":{"200":{"description":"Approved clips"}}}},
    "/api/v1/clips/{id}":{"get":{"tags":["Clips"],"summary":"Get a clip","security":[{"bearerAuth":[]}],"parameters":[{"$ref":"#/components/parameters/id"}],"responses":{"200":{"description":"Clip"}}},"patch":{"tags":["Clips"],"summary":"Update a clip","security":[{"bearerAuth":[]}],"parameters":[{"$ref":"#/components/parameters/id"}],"responses":{"200":{"description":"Clip updated"}}},"delete":{"tags":["Clips"],"summary":"Delete a clip","security":[{"bearerAuth":[]}],"parameters":[{"$ref":"#/components/parameters/id"}],"responses":{"200":{"description":"Clip deleted"}}}},
    "/api/v1/clips/{id}/export":{"post":{"tags":["Clips"],"summary":"Export a clip","security":[{"bearerAuth":[]}],"parameters":[{"$ref":"#/components/parameters/id"}],"responses":{"200":{"description":"Export queued"}}}},
    "/api/v1/clips/{id}/download":{"get":{"tags":["Clips"],"summary":"Get a signed clip download URL","security":[{"bearerAuth":[]}],"parameters":[{"$ref":"#/components/parameters/id"}],"responses":{"200":{"description":"Download URL"}}}},
    "/api/v1/clips/{id}/published":{"post":{"tags":["Clips"],"summary":"Mark a clip published","security":[{"bearerAuth":[]}],"parameters":[{"$ref":"#/components/parameters/id"}],"responses":{"200":{"description":"Clip published"}}}},
    "/api/v1/clips/{id}/approve":{"patch":{"tags":["Clips"],"summary":"Approve a clip","security":[{"bearerAuth":[]}],"parameters":[{"$ref":"#/components/parameters/id"}],"responses":{"200":{"description":"Clip approved"}}}},
    "/api/v1/clips/{id}/reject":{"patch":{"tags":["Clips"],"summary":"Reject a clip","security":[{"bearerAuth":[]}],"parameters":[{"$ref":"#/components/parameters/id"}],"responses":{"200":{"description":"Clip rejected"}}}},
    "/api/v1/edit/health":{"get":{"tags":["System"],"summary":"Get renderer health","security":[{"bearerAuth":[]}],"responses":{"200":{"description":"Renderer health"}}}},
    "/api/v1/analytics/dna":{"get":{"tags":["Analytics"],"summary":"Get creator DNA","security":[{"bearerAuth":[]}],"responses":{"200":{"description":"Creator DNA"}}}},
    "/api/v1/analytics/knowledge-graph":{"get":{"tags":["Analytics"],"summary":"Get knowledge graph","security":[{"bearerAuth":[]}],"responses":{"200":{"description":"Knowledge graph"}}}},
    "/api/v1/analytics/content-gaps":{"get":{"tags":["Analytics"],"summary":"Get content gaps","security":[{"bearerAuth":[]}],"responses":{"200":{"description":"Content gaps"}}}},
    "/api/v1/analytics/personas":{"get":{"tags":["Analytics"],"summary":"Get audience personas","security":[{"bearerAuth":[]}],"responses":{"200":{"description":"Audience personas"}}}},
    "/api/v1/analytics/trend-forecast":{"get":{"tags":["Analytics"],"summary":"Get trend forecast","security":[{"bearerAuth":[]}],"responses":{"200":{"description":"Trend forecast"}}}},
    "/api/v1/analytics/performance":{"get":{"tags":["Analytics"],"summary":"Get performance","security":[{"bearerAuth":[]}],"responses":{"200":{"description":"Performance"}}}},
    "/api/v1/analytics/model-accuracy":{"get":{"tags":["Analytics"],"summary":"Get model accuracy","security":[{"bearerAuth":[]}],"responses":{"200":{"description":"Model accuracy"}}}},
    "/api/v1/analytics/ab-tests":{"get":{"tags":["Analytics"],"summary":"Get A/B tests","security":[{"bearerAuth":[]}],"responses":{"200":{"description":"A/B tests"}}}},
    "/api/v1/admin/key-health":{"get":{"tags":["Admin"],"summary":"Get API key health","security":[{"bearerAuth":[]}],"responses":{"200":{"description":"Key health"}}}}
  },
  "components":{"securitySchemes":{"bearerAuth":{"type":"http","scheme":"bearer","bearerFormat":"JWT"}},"parameters":{"id":{"name":"id","in":"path","required":true,"schema":{"type":"string"}},"jobId":{"name":"jobId","in":"path","required":true,"schema":{"type":"string"}},"channelId":{"name":"channelId","in":"path","required":true,"schema":{"type":"string"}},"youtubeVideoId":{"name":"youtubeVideoId","in":"path","required":true,"schema":{"type":"string"}},"query":{"name":"q","in":"query","required":true,"schema":{"type":"string"}}},"requestBodies":{"ingest":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["url"],"properties":{"url":{"type":"string","format":"uri"},"transcribe":{"type":"boolean"}}}}}},"autoCreate":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["url"],"properties":{"url":{"type":"string","format":"uri"}}}}}}}}
}`

const scalarHTML = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ShortsYou API Reference</title></head><body><script id="api-reference" data-url="/openapi.json"></script><script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script></body></html>`

func openAPISpecHandler(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=300")
	_, _ = w.Write([]byte(openAPISpec))
}

func scalarDocsHandler(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	_, _ = w.Write([]byte(scalarHTML))
}
