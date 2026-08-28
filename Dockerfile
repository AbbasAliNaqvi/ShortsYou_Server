FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build \
    -ldflags="-s -w -X main.version=1.0.0 -X main.buildTime=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    -trimpath \
    -o bin/shortsyou-server \
    ./cmd/server

FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata yt-dlp ffmpeg

WORKDIR /app

COPY --from=builder /app/bin/shortsyou-server .

RUN addgroup -S shortsyou && adduser -S shortsyou -G shortsyou
USER shortsyou

EXPOSE 8080

ENTRYPOINT ["./shortsyou-server"]