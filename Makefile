BINARY    := shortsyou-server
BIN_DIR   := bin
CMD       := ./cmd/server
VERSION   := 1.0.0
BUILD_TIME := $(shell date -u +%Y-%m-%dT%H:%M:%SZ)

LDFLAGS := -s -w \
	-X main.version=$(VERSION) \
	-X main.buildTime=$(BUILD_TIME) \
	-X github.com/AbbasAliNaqvi/ShortsYou_Server/internal/handler.BuildVersion=$(VERSION) \
	-X github.com/AbbasAliNaqvi/ShortsYou_Server/internal/handler.BuildTime=$(BUILD_TIME)

.DEFAULT_GOAL := help
.PHONY: build run clean test tidy docker help


build:
	@mkdir -p $(BIN_DIR)
	go build -ldflags="$(LDFLAGS)" -trimpath -o $(BIN_DIR)/$(BINARY) $(CMD)
	@echo "ready: $(BIN_DIR)/$(BINARY)"


run: build
	./$(BIN_DIR)/$(BINARY)

docker:
	docker build -t shortsyou-server:$(VERSION) .

clean:
	@rm -rf $(BIN_DIR)
	@echo "cleaned"

test:
	go test -race ./...

tidy:
	go mod tidy
	go mod verify

help:
	@grep -E '^## ' Makefile | awk '{ printf "  %-12s %s\n", $$2, substr($$0, index($$0,$$3)) }'