package handler

import (
	"context"
	"net/http"
	"runtime"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/database"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/response"
)

type Health struct {
	mongo *database.MongoDB
	redis *database.RedisClient
	boot  time.Time
}

func NewHealth(mongo *database.MongoDB, redis *database.RedisClient) *Health {
	return &Health{mongo: mongo, redis: redis, boot: time.Now()}
}

func (h *Health) Check(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	mongoStatus, mongoErr := "ok", ""
	if err := h.mongo.Ping(ctx); err != nil {
		mongoStatus = "unreachable"
		mongoErr = err.Error()
	}

	redisStatus, redisErr := "ok", ""
	if err := h.redis.Ping(ctx); err != nil {
		redisStatus = "unreachable"
		redisErr = err.Error()
	}

	allOK := mongoStatus == "ok" && redisStatus == "ok"

	data := gin.H{
		"status":  statusStr(allOK),
		"uptime":  time.Since(h.boot).Round(time.Second).String(),
		"runtime": runtime.Version(),
		"dependencies": gin.H{
			"mongodb": depStatus(mongoStatus, mongoErr),
			"redis":   depStatus(redisStatus, redisErr),
		},
	}

	code := http.StatusOK
	if !allOK {
		code = http.StatusServiceUnavailable
	}

	response.JSON(c, code, allOK, data, "")
}

func statusStr(ok bool) string {
	if ok {
		return "ok"
	}
	return "degraded"
}

func depStatus(status, errMsg string) gin.H {
	d := gin.H{"status": status}
	if errMsg != "" {
		d["error"] = errMsg
	}
	return d
}