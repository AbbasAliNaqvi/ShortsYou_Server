package handler

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	googleoauth "google.golang.org/api/oauth2/v2"
	"google.golang.org/api/option"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/auth"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/config"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/models"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/repository"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/response"
)

type AuthHandler struct {
	cfg      *config.Config
	oauthCfg *oauth2.Config
	userRepo *repository.UserRepository
}

func NewAuthHandler(
	cfg *config.Config,
	oauthCfg *oauth2.Config,
	userRepo *repository.UserRepository,
) *AuthHandler {
	return &AuthHandler{
		cfg:      cfg,
		oauthCfg: oauthCfg,
		userRepo: userRepo,
	}
}

// GoogleLogin redirects the browser to Google's OAuth2 consent screen.
func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	state, err := generateState()
	if err != nil {
		response.InternalError(c)
		return
	}

	// Store state in a short-lived, HTTP-only cookie.
	c.SetCookie(
		"oauth_state",
		state,
		300,
		"/",
		"",
		false,
		true,
	)

	url := h.oauthCfg.AuthCodeURL(
		state,
		oauth2.AccessTypeOffline,
	)

	c.Redirect(http.StatusTemporaryRedirect, url)
}

// GoogleCallback handles the OAuth2 callback from Google.
func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	// Verify OAuth state to prevent CSRF.
	storedState, err := c.Cookie("oauth_state")
	if err != nil || storedState == "" {
		response.BadRequest(c, "invalid oauth state")
		return
	}

	queryState := c.Query("state")

	if queryState == "" || storedState != queryState {
		response.BadRequest(c, "invalid oauth state")
		return
	}

	// OAuth state is single-use.
	c.SetCookie(
		"oauth_state",
		"",
		-1,
		"/",
		"",
		false,
		true,
	)

	// Check for OAuth errors first.
	if oauthError := c.Query("error"); oauthError != "" {
		response.BadRequest(c, "google authorization failed")
		return
	}

	// Get authorization code.
	code := c.Query("code")
	if code == "" {
		response.BadRequest(c, "authorization code missing")
		return
	}

	// Exchange authorization code for Google tokens.
	token, err := h.oauthCfg.Exchange(
		c.Request.Context(),
		code,
	)
	if err != nil {
		response.BadRequest(c, "token exchange failed")
		return
	}

	if token.AccessToken == "" {
		response.InternalError(c)
		return
	}

	// Fetch Google user profile.
	userInfo, err := fetchGoogleUser(
		c.Request.Context(),
		token.AccessToken,
	)
	if err != nil {
		response.InternalError(c)
		return
	}

	// Build local user model.
	user := models.User{
		Name:           userInfo.Name,
		Email:          userInfo.Email,
		GoogleID:       userInfo.Id,
		ProfilePicture: userInfo.Picture,
		AccessToken:    token.AccessToken,
		RefreshToken:   token.RefreshToken,
	}

	// Create or update user.
	saved, err := h.userRepo.Upsert(
		c.Request.Context(),
		userInfo.Id,
		user,
	)
	if err != nil {
		response.InternalError(c)
		return
	}

	// Generate ShortsYou JWT.
	jwtToken, err := auth.GenerateToken(
		saved.ID.Hex(),
		saved.Email,
		h.cfg.JWTSecret,
		h.cfg.JWTExpiryHours,
	)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, gin.H{
		"token": jwtToken,
		"user":  saved,
	})
}

// Me returns the authenticated user's profile.
func (h *AuthHandler) Me(c *gin.Context) {
	value, exists := c.Get("userID")
	if !exists {
		response.Unauthorized(c)
		return
	}

	userID, ok := value.(string)
	if !ok || userID == "" {
		response.Unauthorized(c)
		return
	}

	user, err := h.userRepo.FindByID(
		c.Request.Context(),
		userID,
	)
	if err != nil {
		response.InternalError(c)
		return
	}

	if user == nil {
		response.NotFound(c, "user")
		return
	}

	response.OK(c, user)
}

// fetchGoogleUser calls Google's userinfo API.
func fetchGoogleUser(
	ctx context.Context,
	accessToken string,
) (*googleoauth.Userinfo, error) {
	svc, err := googleoauth.NewService(
		ctx,
		option.WithTokenSource(
			oauth2.StaticTokenSource(
				&oauth2.Token{
					AccessToken: accessToken,
				},
			),
		),
	)
	if err != nil {
		return nil, err
	}

	return svc.Userinfo.Get().Do()
}

// generateState creates a cryptographically secure random
// value used for OAuth CSRF protection.
func generateState() (string, error) {
	b := make([]byte, 32)

	if _, err := rand.Read(b); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(b), nil
}
