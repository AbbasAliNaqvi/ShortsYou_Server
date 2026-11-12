package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/database"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/models"
)

type UserRepository struct {
	col *mongo.Collection
}

func NewUserRepository(db *database.MongoDB) *UserRepository {
	return &UserRepository{col: db.Collection("users")}
}

func (r *UserRepository) FindByGoogleID(ctx context.Context, googleID string) (*models.User, error) {
	var user models.User
	err := r.col.FindOne(ctx, bson.M{"googleId": googleID}).Decode(&user)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("FindByGoogleID: %w", err)
	}
	return &user, nil
}

func (r *UserRepository) FindByID(ctx context.Context, id string) (*models.User, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}
	var user models.User
	err = r.col.FindOne(ctx, bson.M{"_id": oid}).Decode(&user)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("FindByID: %w", err)
	}
	return &user, nil
}

func (r *UserRepository) FindByTelegramID(ctx context.Context, telegramID int64) (*models.User, error) {
	var user models.User
	err := r.col.FindOne(ctx, bson.M{"telegramId": telegramID}).Decode(&user)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("FindByTelegramID: %w", err)
	}
	return &user, nil
}

func (r *UserRepository) UpdateChannel(ctx context.Context, userID, channelID, channelName string) error {
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("UpdateChannel invalid id: %w", err)
	}
	result, err := r.col.UpdateByID(ctx, oid, bson.M{"$set": bson.M{
		"channelId": channelID, "channelName": channelName, "updatedAt": time.Now(),
	}})
	if err != nil {
		return err
	}
	if result.MatchedCount == 0 {
		return mongo.ErrNoDocuments
	}
	return nil
}

func (r *UserRepository) LinkTelegram(ctx context.Context, userID string, telegramID int64, username, phone string) error {
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("LinkTelegram invalid id: %w", err)
	}
	now := time.Now()
	result, err := r.col.UpdateByID(ctx, oid, bson.M{"$set": bson.M{
		"telegramId": telegramID, "telegramUsername": username,
		"telegramPhone": phone, "telegramLinkedAt": now, "updatedAt": now,
	}})
	if err != nil {
		return fmt.Errorf("LinkTelegram: %w", err)
	}
	if result.MatchedCount == 0 {
		return mongo.ErrNoDocuments
	}
	return nil
}

func (r *UserRepository) Upsert(ctx context.Context, googleID string, update models.User) (*models.User, error) {
	now := time.Now()
	setFields := bson.M{
		"name": update.Name, "email": update.Email, "googleId": googleID,
		"channelId": update.ChannelID, "channelName": update.ChannelName,
		"profilePicture": update.ProfilePicture, "accessToken": update.AccessToken,
		"refreshToken": update.RefreshToken, "tokenExpiry": update.TokenExpiry,
		"updatedAt": now,
	}
	if update.TelegramID != 0 {
		setFields["telegramId"] = update.TelegramID
		setFields["telegramUsername"] = update.TelegramUsername
		setFields["telegramPhone"] = update.TelegramPhone
		setFields["telegramLinkedAt"] = update.TelegramLinkedAt
	}
	var result models.User
	err := r.col.FindOneAndUpdate(
		ctx,
		bson.M{"googleId": googleID},
		bson.M{"$set": setFields, "$setOnInsert": bson.M{"createdAt": now}},
		options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After),
	).Decode(&result)
	if err != nil {
		return nil, fmt.Errorf("Upsert: %w", err)
	}
	return &result, nil
}
