package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

func pagination(c *gin.Context) (int64, int64, bool) {
	page := int64(1)
	limit := int64(100)
	if raw := c.Query("page"); raw != "" {
		parsed, err := strconv.ParseInt(raw, 10, 64)
		if err != nil || parsed < 1 {
			return 0, 0, false
		}
		page = parsed
	}
	if raw := c.Query("limit"); raw != "" {
		parsed, err := strconv.ParseInt(raw, 10, 64)
		if err != nil || parsed < 1 || parsed > 200 {
			return 0, 0, false
		}
		limit = parsed
	}
	return limit, (page - 1) * limit, true
}
