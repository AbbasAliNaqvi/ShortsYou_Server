package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name           string             `bson:"name" json:"name"`
	Email          string             `bson:"email" json:"email"`
	GoogleID       string             `bson:"googleId" json:"-"`
	ChannelID      string             `bson:"channelId" json:"channelId"`
	ChannelName    string             `bson:"channelName" json:"channelName"`
	ProfilePicture string             `bson:"profilePicture" json:"profilePicture"`
	AccessToken    string             `bson:"accessToken" json:"-"`
	RefreshToken   string             `bson:"refreshToken" json:"-"`
	TokenExpiry    time.Time          `bson:"tokenExpiry" json:"-"`
	CreatedAt      time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt      time.Time          `bson:"updatedAt" json:"updatedAt"`
}
