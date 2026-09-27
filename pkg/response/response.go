package response

import "github.com/gin-gonic/gin"

type envelope struct {
	Success bool   `json:"success"`
	Data    any    `json:"data"`
	Error   string `json:"error,omitempty"`
}

func JSON(c *gin.Context, status int, success bool, data any, errMsg string) {
	body := envelope{Success: success, Data: data}
	if !success && errMsg != "" {
		body.Error = errMsg
	}
	c.JSON(status, body)
}

func OK(c *gin.Context, data any)              { JSON(c, 200, true, data, "") }
func Created(c *gin.Context, data any)         { JSON(c, 201, true, data, "") }
func BadRequest(c *gin.Context, msg string)    { JSON(c, 400, false, nil, msg) }
func Unauthorized(c *gin.Context)              { JSON(c, 401, false, nil, "authentication required") }
func Forbidden(c *gin.Context)                 { JSON(c, 403, false, nil, "access denied") }
func NotFound(c *gin.Context, resource string) { JSON(c, 404, false, nil, resource+" not found") }
func InternalError(c *gin.Context)             { JSON(c, 500, false, nil, "internal server error") }
