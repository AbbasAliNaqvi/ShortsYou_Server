package repository

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/database"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/models"
)

type TelegramLinkRepository struct {
	col *mongo.Collection
}

func NewTelegramLinkRepository(db *database.MongoDB) *TelegramLinkRepository {
	return &TelegramLinkRepository{col: db.Collection("telegram_links")}
}

func HashTelegramLinkToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func (r *TelegramLinkRepository) Create(ctx context.Context, link models.TelegramLink) error {
	_, err := r.col.InsertOne(ctx, link)
	if err != nil {
		return fmt.Errorf("TelegramLinkRepository.Create: %w", err)
	}
	return nil
}

func (r *TelegramLinkRepository) Consume(ctx context.Context, token string) (*models.TelegramLink, error) {
	now := time.Now()
	var link models.TelegramLink
	err := r.col.FindOneAndUpdate(
		ctx,
		bson.M{
			"tokenHash":  HashTelegramLinkToken(token),
			"expiresAt":  bson.M{"$gt": now},
			"consumedAt": bson.M{"$exists": false},
		},
		bson.M{"$set": bson.M{"consumedAt": now}},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&link)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("TelegramLinkRepository.Consume: %w", err)
	}
	return &link, nil
}

func (r *TelegramLinkRepository) EnsureIndexes(ctx context.Context) error {
	_, err := r.col.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "tokenHash", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	return err
}

func (r *TelegramLinkRepository) UserID(ctx context.Context, linkID primitive.ObjectID) (primitive.ObjectID, error) {
	var link models.TelegramLink
	if err := r.col.FindOne(ctx, bson.M{"_id": linkID}).Decode(&link); err != nil {
		return primitive.NilObjectID, err
	}
	return link.UserID, nil
}
