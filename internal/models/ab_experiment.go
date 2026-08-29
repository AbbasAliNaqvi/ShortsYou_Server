package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ABExperiment struct {
	ID            primitive.ObjectID `bson:"_id,omitempty"         json:"id"`
	UserID        primitive.ObjectID `bson:"userId"                json:"userId"`
	ClipID        primitive.ObjectID `bson:"clipId"                json:"clipId"`
	OriginalHook  string             `bson:"originalHook"          json:"originalHook"`
	GeneratedHook string             `bson:"generatedHook"         json:"generatedHook"`
	OriginalCTR   float64            `bson:"originalCtr"           json:"originalCtr"`
	GeneratedCTR  float64            `bson:"generatedCtr"          json:"generatedCtr"`
	NOriginal     int                `bson:"nOriginal"             json:"nOriginal"`
	NGenerated    int                `bson:"nGenerated"            json:"nGenerated"`
	TStatistic    float64            `bson:"tStatistic"            json:"tStatistic"`
	IsSignificant bool               `bson:"isSignificant"         json:"isSignificant"`
	LiftPercent   float64            `bson:"liftPercent"           json:"liftPercent"`
	Status        string             `bson:"status"                json:"status"`
	CreatedAt     time.Time          `bson:"createdAt"             json:"createdAt"`
	CompletedAt   *time.Time         `bson:"completedAt,omitempty" json:"completedAt,omitempty"`
}
