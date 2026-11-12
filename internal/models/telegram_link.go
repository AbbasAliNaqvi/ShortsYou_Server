package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TelegramLink struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID     primitive.ObjectID `bson:"userId" json:"userId"`
	TokenHash  string             `bson:"tokenHash" json:"-"`
	ExpiresAt  time.Time          `bson:"expiresAt" json:"expiresAt"`
	ConsumedAt *time.Time         `bson:"consumedAt,omitempty" json:"consumedAt,omitempty"`
	CreatedAt  time.Time          `bson:"createdAt" json:"createdAt"`
}
