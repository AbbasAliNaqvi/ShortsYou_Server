package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type VocabWord struct {
	Word       string  `bson:"word"       json:"word"`
	TFIDFScore float64 `bson:"tfidfScore" json:"tfidfScore"`
}

type SentimentProfile struct {
	Positive float64 `bson:"positive" json:"positive"`
	Negative float64 `bson:"negative" json:"negative"`
	Neutral  float64 `bson:"neutral"  json:"neutral"`
}

type Persona struct {
	PersonaID            string           `bson:"personaId"            json:"personaId"`
	Name                 string           `bson:"name"                 json:"name"`
	CommentCount         int              `bson:"commentCount"         json:"commentCount"`
	PercentOfAudience    float64          `bson:"percentOfAudience"    json:"percentOfAudience"`
	Vocabulary           []VocabWord      `bson:"vocabulary"           json:"vocabulary"`
	QuestionTypes        []string         `bson:"questionTypes"        json:"questionTypes"`
	SentimentProfile     SentimentProfile `bson:"sentimentProfile"     json:"sentimentProfile"`
	EngagementRate       float64          `bson:"engagementRate"       json:"engagementRate"`
	TopEngagedCategories []string         `bson:"topEngagedCategories" json:"topEngagedCategories"`
}

type ClusterMetrics struct {
	SilhouetteScore float64 `bson:"silhouetteScore" json:"silhouetteScore"`
	NClusters       int     `bson:"nClusters"       json:"nClusters"`
}

type AudiencePersona struct {
	ID             primitive.ObjectID `bson:"_id,omitempty"  json:"id"`
	UserID         primitive.ObjectID `bson:"userId"         json:"userId"`
	Personas       []Persona          `bson:"personas"       json:"personas"`
	ClusterMetrics ClusterMetrics     `bson:"clusterMetrics" json:"clusterMetrics"`
	LastUpdatedAt  time.Time          `bson:"lastUpdatedAt"  json:"lastUpdatedAt"`
	CreatedAt      time.Time          `bson:"createdAt"      json:"createdAt"`
}