BINARY  := shortsyou-server
BIN_DIR := bin
CMD     := ./cmd/server

.DEFAULT_GOAL := help
.PHONY: build run clean test tidy help

## build       Compile the server binary
build:
	@mkdir -p $(BIN_DIR)
	go build -ldflags="-s -w" -o $(BIN_DIR)/$(BINARY) $(CMD)
	@echo "ready: $(BIN_DIR)/$(BINARY)"

## run         Build and run (requires .env)
run: build
	./$(BIN_DIR)/$(BINARY)

## clean       Remove compiled binaries
clean:
	@rm -rf $(BIN_DIR)
	@echo "cleaned"

## test        Run all tests with race detector
test:
	go test -race ./...

## tidy        Tidy and verify go modules
tidy:
	go mod tidy
	go mod verify

## help        Show available targets
help:
	@grep -E '^## ' Makefile | awk '{ printf "  %-12s %s\n", $$2, substr($$0, index($$0,$$3)) }'