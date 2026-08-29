package handler

import (
	"math"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/AbbasAliNaqvi/ShortsYou_Server/internal/repository"
	"github.com/AbbasAliNaqvi/ShortsYou_Server/pkg/response"
)

type AnalyticsHandler struct {
	dnaRepo     *repository.CreatorDNARepository
	personaRepo *repository.PersonaRepository
	trendRepo   *repository.TrendForecastRepository
	fmRepo      *repository.FeatureMatrixRepository
	clipRepo    *repository.ClipRepository
	abRepo      *repository.ABExperimentRepository
}

func NewAnalyticsHandler(
	dnaRepo *repository.CreatorDNARepository,
	personaRepo *repository.PersonaRepository,
	trendRepo *repository.TrendForecastRepository,
	fmRepo *repository.FeatureMatrixRepository,
	clipRepo *repository.ClipRepository,
	abRepo *repository.ABExperimentRepository,
) *AnalyticsHandler {
	return &AnalyticsHandler{
		dnaRepo:     dnaRepo,
		personaRepo: personaRepo,
		trendRepo:   trendRepo,
		fmRepo:      fmRepo,
		clipRepo:    clipRepo,
		abRepo:      abRepo,
	}
}

func (h *AnalyticsHandler) GetDNA(c *gin.Context) {
	userID := extractUserID(c)

	dna, err := h.dnaRepo.FindByUserID(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c)
		return
	}
	if dna == nil {
		response.OK(c, gin.H{"ready": false, "message": "process videos first to generate dna profile"})
		return
	}
	response.OK(c, dna)
}

// GetKnowledgeGraph powers VIZ-01 D3.js force-directed topic graph.
func (h *AnalyticsHandler) GetKnowledgeGraph(c *gin.Context) {
	userID := extractUserID(c)

	dna, err := h.dnaRepo.FindByUserID(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c)
		return
	}
	if dna == nil {
		response.OK(c, gin.H{"nodes": []any{}, "edges": []any{}, "contentGaps": []any{}})
		return
	}
	response.OK(c, gin.H{
		"nodes":       dna.TopicGraph.Nodes,
		"edges":       dna.TopicGraph.Edges,
		"contentGaps": dna.ContentGaps,
	})
}

// GetContentGaps powers VIZ-10 opportunity score radar and table.
func (h *AnalyticsHandler) GetContentGaps(c *gin.Context) {
	userID := extractUserID(c)

	dna, err := h.dnaRepo.FindByUserID(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c)
		return
	}
	if dna == nil {
		response.OK(c, gin.H{"gaps": []any{}})
		return
	}
	response.OK(c, gin.H{"gaps": dna.ContentGaps})
}

// GetPersonas powers VIZ-06 audience persona bubble chart.
func (h *AnalyticsHandler) GetPersonas(c *gin.Context) {
	userID := extractUserID(c)

	persona, err := h.personaRepo.FindByUserID(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c)
		return
	}
	if persona == nil {
		response.OK(c, gin.H{"personas": []any{}, "clusterMetrics": nil})
		return
	}
	response.OK(c, persona)
}

// GetTrendForecast powers VIZ-03 Prophet time-series chart.
func (h *AnalyticsHandler) GetTrendForecast(c *gin.Context) {
	userID := extractUserID(c)

	forecasts, err := h.trendRepo.FindByUserID(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.OK(c, gin.H{"forecasts": forecasts})
}

type perfPoint struct {
	ClipID         string  `json:"clipId"`
	PredictedScore float64 `json:"predictedScore"`
	ActualViews    int64   `json:"actualViews"`
	Category       string  `json:"category"`
}

// GetPerformance powers VIZ-05 actual vs predicted scatter plot.
func (h *AnalyticsHandler) GetPerformance(c *gin.Context) {
	userID := extractUserID(c)

	clips, err := h.clipRepo.FindByUserID(c.Request.Context(), userID, 200, 0)
	if err != nil {
		response.InternalError(c)
		return
	}

	points := make([]perfPoint, 0, len(clips))
	for _, clip := range clips {
		if clip.PerformanceData == nil {
			continue
		}
		points = append(points, perfPoint{
			ClipID:         clip.ID.Hex(),
			PredictedScore: clip.GenericPredScore,
			ActualViews:    clip.PerformanceData.Views48h,
			Category:       string(clip.Category),
		})
	}

	response.OK(c, gin.H{
		"points":   points,
		"pearsonR": computePearsonR(points),
		"n":        len(points),
	})
}

// GetModelAccuracy powers VIZ-08 learning curve and VIZ-09 SHAP feature importance.
func (h *AnalyticsHandler) GetModelAccuracy(c *gin.Context) {
	userID := extractUserID(c)

	labeled, err := h.fmRepo.CountLabeledForUser(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c)
		return
	}

	dna, err := h.dnaRepo.FindByUserID(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c)
		return
	}

	// Return empty but valid shapes so the frontend never crashes on missing data.
	if dna == nil {
		response.OK(c, gin.H{
			"accuracyHistory":    []any{},
			"featureImportances": []any{},
			"labeledSamples":     labeled,
			"modelReady":         false,
		})
		return
	}

	response.OK(c, gin.H{
		"accuracyHistory":    dna.ModelAccuracyHistory,
		"featureImportances": dna.FeatureImportances,
		"labeledSamples":     labeled,
		"modelReady":         labeled >= 10,
	})
}

// GetABTests powers VIZ-07 A/B hook test results dashboard.
func (h *AnalyticsHandler) GetABTests(c *gin.Context) {
	userID := extractUserID(c)

	experiments, err := h.abRepo.FindByUserID(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.OK(c, gin.H{"experiments": experiments})
}

func extractUserID(c *gin.Context) primitive.ObjectID {
	raw, _ := c.Get("userID")
	id, _ := primitive.ObjectIDFromHex(raw.(string))
	return id
}

func computePearsonR(points []perfPoint) float64 {
	n := float64(len(points))
	if n < 2 {
		return 0
	}

	var sumX, sumY, sumXY, sumX2, sumY2 float64
	for _, p := range points {
		x := p.PredictedScore
		y := float64(p.ActualViews)
		sumX += x
		sumY += y
		sumXY += x * y
		sumX2 += x * x
		sumY2 += y * y
	}

	num := n*sumXY - sumX*sumY
	den := math.Sqrt((n*sumX2 - sumX*sumX) * (n*sumY2 - sumY*sumY))
	if den == 0 {
		return 0
	}
	return math.Round((num/den)*10000) / 10000
}