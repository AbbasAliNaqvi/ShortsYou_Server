package middleware

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type ipStore struct {
	mu       sync.Mutex
	limiters map[string]*rate.Limiter
	rps      rate.Limit
}

var store *ipStore

func RateLimit(rps int) gin.HandlerFunc {
	store = &ipStore{
		limiters: make(map[string]*rate.Limiter),
		rps:      rate.Limit(rps),
	}

	return func(c *gin.Context) {
		if !store.allow(c.ClientIP()) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error":   "Rate limit exceeded",
			})
			return
		}
		c.Next()
	}
}

func (s *ipStore) allow(ip string) bool {
	s.mu.Lock()
	lim, ok := s.limiters[ip]
	if !ok {
		lim = rate.NewLimiter(s.rps, int(s.rps)*2)
		s.limiters[ip] = lim
	}
	s.mu.Unlock()
	return lim.Allow()
}
