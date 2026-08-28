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

type PersonaRepository struct {
	col *mongo.Collection
}

func NewPersonaRepository(db *database.MongoDB) *PersonaRepository {
	return &PersonaRepository{col: db.Collection("audience_personas")}
}

func (r *PersonaRepository) FindByUserID(ctx context.Context, userID primitive.ObjectID) (*models.AudiencePersona, error) {
	var p models.AudiencePersona
	err := r.col.FindOne(ctx, bson.M{"userId": userID}).Decode(&p)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("FindByUserID: %w", err)
	}
	return &p, nil
}

func (r *PersonaRepository) Upsert(ctx context.Context, persona models.AudiencePersona) error {
	now := time.Now()
	filter := bson.M{"userId": persona.UserID}
	update := bson.M{
		"$set": bson.M{
			"personas":       persona.Personas,
			"clusterMetrics": persona.ClusterMetrics,
			"lastUpdatedAt":  now,
		},
		"$setOnInsert": bson.M{"createdAt": now},
	}
	_, err := r.col.UpdateOne(ctx, filter, update, options.Update().SetUpsert(true))
	if err != nil {
		return fmt.Errorf("Upsert: %w", err)
	}
	return nil
}