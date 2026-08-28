package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID string `json:"userId"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

func GenerateToken(
	userID string,
	email string,
	secret string,
	expiryHours int,
) (string, error) {
	if userID == "" {
		return "", fmt.Errorf("userID cannot be empty")
	}

	if email == "" {
		return "", fmt.Errorf("email cannot be empty")
	}

	if secret == "" {
		return "", fmt.Errorf("JWT secret cannot be empty")
	}

	if expiryHours <= 0 {
		return "", fmt.Errorf("expiryHours must be greater than zero")
	}

	now := time.Now()

	claims := Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(
				now.Add(time.Duration(expiryHours) * time.Hour),
			),
			IssuedAt: jwt.NewNumericDate(now),
			Issuer:   "shortsyou-server",
		},
	}

	token := jwt.NewWithClaims(
		jwt.SigningMethodHS256,
		claims,
	)

	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("sign token: %w", err)
	}

	return signed, nil
}

// ValidateToken parses and verifies a JWT string.
// Returns the decoded Claims if the token is valid.
func ValidateToken(
	tokenString string,
	secret string,
) (*Claims, error) {
	if tokenString == "" {
		return nil, fmt.Errorf("token cannot be empty")
	}

	if secret == "" {
		return nil, fmt.Errorf("JWT secret cannot be empty")
	}

	token, err := jwt.ParseWithClaims(
		tokenString,
		&Claims{},
		func(t *jwt.Token) (any, error) {
			// Only accept the exact signing algorithm used by this server.
			if t.Method != jwt.SigningMethodHS256 {
				return nil, fmt.Errorf(
					"unexpected signing method: %v",
					t.Header["alg"],
				)
			}

			return []byte(secret), nil
		},
		jwt.WithIssuer("shortsyou-server"),
	)

	if err != nil {
		return nil, fmt.Errorf("parse token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, fmt.Errorf("invalid token claims")
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}