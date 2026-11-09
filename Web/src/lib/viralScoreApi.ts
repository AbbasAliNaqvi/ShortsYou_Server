/**
 * ShortsYou — ML ViralScore API Client & Sequential Pipeline Orchestrator
 *
 * Implements the 2-step workflow:
 * 1. Step 1 (Train): If user has past clips, call /api/viral-score/train to personalize CPEP.
 *    If user has 0 past clips, skip Step 1 (cold-start mode).
 * 2. Step 2 (Predict): Call /api/viral-score/predict to compute the final ViralScore (0–100),
 *    retention curve, and SHAP vectors.
 *
 * Timing: 4 to 10 seconds total with interactive progress callbacks.
 */

import type { Clip } from "./api";

export interface PredictedRetention {
  hook3sPct: number;
  hold15sPct: number;
  completionPct: number;
}

export interface ShapContributions {
  hookStrength: number;
  creatorTopicAffinity: number;
  pacingSpeechRate: number;
  emotionalResonance: number;
  novelty: number;
}

export interface PredictViralScoreResponse {
  viralScore: number; // 0.0 - 1.0 (clamped)
  genericPredictionScore: number;
  personalizedPredictionScore: number;
  confidenceInterval: {
    low: number;
    high: number;
  };
  predictedRetention: PredictedRetention;
  shapContributions: ShapContributions;
  performanceBand: "viral" | "high" | "medium" | "low";
  recommendations: string[];
}

export interface PipelineProgress {
  stage: "idle" | "analyzing" | "training" | "predicting" | "complete" | "error";
  progressPercent: number; // 0 - 100
  statusMessage: string;
}

export type ProgressCallback = (progress: PipelineProgress) => void;

/**
 * Format viral score into UI display properties
 */
export function formatViralScore(rawScore: number): {
  scoreInt: number;
  label: string;
  colorClass: string;
  badgeBg: string;
} {
  const scoreInt = rawScore > 1 ? Math.round(rawScore) : Math.round(rawScore * 100);

  if (scoreInt >= 92) {
    return {
      scoreInt,
      label: "Viral Velocity Peak",
      colorClass: "text-amber-500",
      badgeBg: "bg-amber-500/10 border-amber-500/30 text-amber-600",
    };
  }
  if (scoreInt >= 80) {
    return {
      scoreInt,
      label: "High Algorithmic Momentum",
      colorClass: "text-emerald-500",
      badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600",
    };
  }
  return {
    scoreInt,
    label: "Moderate Retention",
    colorClass: "text-sky-500",
    badgeBg: "bg-sky-500/10 border-sky-500/30 text-sky-600",
  };
}

/**
 * Executes the full sequential 2-step ML ViralScore Pipeline:
 * - Step 1: Train CPEP model (skipped if 0 past clips)
 * - Step 2: Predict viral score
 * - Estimated duration: 4-10 seconds
 */
export async function runFullViralScorePipeline(
  userId: string,
  videoId: string,
  videoMetadata: {
    title: string;
    durationSeconds: number;
    videoUrl?: string;
    transcriptText?: string;
  },
  segment: {
    startTime: number;
    endTime: number;
    hookText?: string;
    features?: Record<string, number | string>;
  },
  pastClips: Clip[] = [],
  onProgress?: ProgressCallback
): Promise<PredictViralScoreResponse> {
  const hasPastClips = pastClips && pastClips.length > 0;

  // ── Phase 1: Analyzing creator history ──
  onProgress?.({
    stage: "analyzing",
    progressPercent: 15,
    statusMessage: hasPastClips
      ? `Analyzing creator profile & ${pastClips.length} historical clips…`
      : "New creator detected — calibrating global viral benchmark…",
  });

  // Artificial smooth pacing so fast local mocks still feel like an authentic 4-10s ML run
  await new Promise((resolve) => setTimeout(resolve, 1400));

  // ── Step 1: Model Training (Skipped if no past clips) ──
  if (hasPastClips) {
    onProgress?.({
      stage: "training",
      progressPercent: 45,
      statusMessage: "Training personalized CPEP virality model (XGBoost)…",
    });

    try {
      await fetch("/api/viral-score/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          historicalClips: pastClips.slice(0, 25).map((c) => ({
            clipId: c.id,
            durationSeconds: c.durationSeconds,
            viralScore: c.viralScore,
            views48h: c.performanceData?.views48h,
            retentionRate: c.performanceData?.avgWatchTimeSec,
            category: c.category,
            features: c.scores,
          })),
        }),
      });
    } catch (trainErr) {
      console.warn("Training step warning (non-fatal, continuing to predict):", trainErr);
    }

    await new Promise((resolve) => setTimeout(resolve, 1800));
  } else {
    onProgress?.({
      stage: "training",
      progressPercent: 45,
      statusMessage: "Skipped training step (no previous clips). Initializing baseline…",
    });
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  // ── Step 2: Prediction ──
  onProgress?.({
    stage: "predicting",
    progressPercent: 80,
    statusMessage: "Simulating audience retention curve & forecasting Viral Score…",
  });

  const predictResponse = await fetch("/api/viral-score/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      videoId,
      videoMetadata,
      segment,
    }),
  });

  if (!predictResponse.ok) {
    throw new Error(`Prediction API failed with HTTP ${predictResponse.status}`);
  }

  const json = await predictResponse.json();
  if (!json.success || !json.data) {
    throw new Error(json.error ?? "Failed to calculate viral score");
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  onProgress?.({
    stage: "complete",
    progressPercent: 100,
    statusMessage: "Viral score calculation complete!",
  });

  return json.data as PredictViralScoreResponse;
}
