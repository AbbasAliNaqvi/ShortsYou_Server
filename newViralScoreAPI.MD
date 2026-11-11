# ShortsYou — Frontend ML ViralScore Integration Plan (Chat Spec Aligned)

> **Document Status**: Production Architecture & UI Implementation Blueprint  
> **Source Alignment**: Aligned with Mayank (ML) & Abbas (Backend) Specification  
> **Backend Status**: **ZERO Backend Changes** (Go Server, MongoDB, and Redis remain 100% untouched)  
> **Frontend Target**: `Web/` (Next.js 16 + TypeScript + Tailwind + Redux Toolkit)  
> **Target Experience**: Finalized Video Pre-Upload Screen with Dual CTA (`Upload on YouTube` vs `Check Viral Score`)

---

## 1. Specification from Core Team Chat

Based on the direct specification from Mayank (ML Engineer) and Abbas Ali (Backend):

```text
[10:34 pm] Mayank: Video puri final ho gyi before uploading there has to be two options: upload on yt or check viral score
[10:34 pm] Mayank: Then most probably on every viral score call do apis call hongi
[10:34 pm] Mayank: First one jo maine tujhe di hai training wali
[10:35 pm] Mayank: Usme uss person ki sari purani clips ka data jayega and model train hoga
[10:35 pm] Mayank: Then predict to get the final viral score
[10:35 pm] Mayank: Estimated time almost 4-10 seconds in the process (4 minimum and 10 maximum)
[10:36 pm] Abbas Ali: Yes yes
[10:38 pm] Mayank: And ager uski koi purani clip nhi hai then ye training wala step skip ho jayega. Simple.
```

### Core Requirements Derived from Chat
1. **Pre-Upload Dual CTA**: Once a video is final (rendered/edited), the creator must see two clear primary choices before publishing:
   - 🚀 **"Upload on YouTube"** (Direct publish to channel)
   - ⚡ **"Check Viral Score"** (Run AI Virality Prediction)
2. **2-Step Sequential API Orchestration**:
   - **Step 1 (Personalized Training)**: If the creator has past clips (`previousClips.length > 0`), send historical clip data to train the creator-specific CPEP (Creator-Personalized Engagement Predictor) model.
   - **Condition (Cold-Start)**: If the creator has **no previous clips** (`previousClips.length === 0`), **skip Step 1** entirely and proceed straight to prediction.
   - **Step 2 (Prediction)**: Call the prediction endpoint with the finalized video data to compute the final Viral Score (0–100), confidence bounds, and retention curves.
3. **4–10 Second Interactive Progress UX**:
   - Because the 2-step process takes 4 to 10 seconds, the frontend must render an engaging, multi-stage loading experience so the user never feels a delay.
4. **Zero Backend Changes**:
   - Orchestrated entirely on the Next.js frontend using the existing Go client data (`GET /api/v1/clips`) and the external ML service.

---

## 2. Architecture & Data Flow

```
                                  CREATOR ACTIONS
                        (Video Finalized / Ready to Upload)
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
          [ Upload on YouTube ]                   [ Check Viral Score ]
         (Direct to YouTube API)                            │
                                                            ▼
                                                Check User Past Clips
                                                (from existing Redux state)
                                                            │
                                         ┌──────────────────┴──────────────────┐
                                         │                                     │
                             If clips.length > 0                     If clips.length === 0
                                         │                                 (New Creator)
                                         ▼                                     │
                                ┌─────────────────┐                            │
                                │  Step 1: Train  │                            │
                                │   /train-cpep   │                            │
                                │  (Personalize)  │                            │
                                └────────┬────────┘                            │
                                         │ (takes ~3-5s)                       │
                                         ▼                                     │
                                ┌──────────────────────────────────────────────┴───────┐
                                │                    Step 2: Predict                   │
                                │                /calculate-viral-score                │
                                │                (takes ~2-4s)                         │
                                └──────────────────────────┬───────────────────────────┘
                                                           ▼
                                           ┌───────────────────────────────┐
                                           │  Reveal Viral Intelligence    │
                                           │  • Viral Score (e.g. 94/100)  │
                                           │  • 3s / 15s Retention Curves  │
                                           │  • SHAP Attribution Vectors   │
                                           │  • [Proceed to Upload on YT]  │
                                           └───────────────────────────────┘
```

---

## 3. Two-Step API Contracts

### Step 1: Model Training API (`/train-cpep` or `/api/viral-score/train`)
- **Trigger**: Only when `userClips.length > 0`.
- **Request Payload**:
```typescript
export interface TrainCPEPPayload {
  userId: string;
  historicalClips: Array<{
    clipId: string;
    durationSeconds: number;
    viralScore: number;
    views48h?: number;
    retentionRate?: number;
    category?: string;
    features?: {
      emotionScore?: number;
      semanticScore?: number;
      hookScore?: number;
      clarityScore?: number;
      noveltyScore?: number;
    };
  }>;
}
```
- **Response**:
```typescript
export interface TrainCPEPResponse {
  status: "trained" | "skipped";
  modelVersion: string; // e.g. "xgb-cpep-v2.4"
  samplesTrained: number;
  pearsonR?: number;
  r2?: number;
}
```

---

### Step 2: Prediction API (`/calculate-viral-score` or `/api/viral-score/predict`)
- **Trigger**: Always (whether training ran or was skipped).
- **Request Payload**:
```typescript
export interface PredictViralScorePayload {
  userId: string;
  videoId: string;
  videoMetadata: {
    title: string;
    durationSeconds: number;
    videoUrl?: string;
    transcriptText?: string;
  };
  segment: {
    startTime: number;
    endTime: number;
    hookText?: string;
    features?: {
      emotionScore?: number;
      emotionType?: string;
      semanticScore?: number;
      clarityScore?: number;
      hookScore?: number;
      speechEmphasisScore?: number;
    };
  };
}
```
- **Response**:
```typescript
export interface PredictViralScoreResponse {
  viralScore: number;                 // Normalized 0.0 - 1.0 (0 - 100 on frontend)
  genericPredictionScore: number;     // Baseline score
  personalizedPredictionScore: number;// CPEP score
  confidenceInterval: {
    low: number;
    high: number;
  };
  predictedRetention: {
    hook3sPct: number;      // e.g. 84.5%
    hold15sPct: number;     // e.g. 69.2%
    completionPct: number;  // e.g. 52.8%
  };
  shapContributions: {
    hookStrength: number;
    creatorTopicAffinity: number;
    pacingSpeechRate: number;
    emotionalResonance: number;
    novelty: number;
  };
  performanceBand: "viral" | "high" | "medium" | "low";
  recommendations: string[];
}
```

---

## 4. UI/UX: 4–10 Second Animated Progress Stepper

Since Mayank estimated **4 to 10 seconds total execution time**, the UI renders a progressive status widget to keep creators engaged:

```
┌─────────────────────────────────────────────────────────────┐
│  ⚡ AI VIRAL MOMENTUM PREDICTOR                              │
│                                                             │
│  [✓] Phase 1: Analyzing creator profile & past clips        │
│  [●] Phase 2: Training personalized CPEP virality model...  │
│  [○] Phase 3: Forecasting audience retention & final score  │
│                                                             │
│  ██████████████████░░░░░░░░░░  68%                          │
│  "Extracting semantic hooks and calibrating against niche"  │
└─────────────────────────────────────────────────────────────┘
```

- **0s – 3s**: If past clips exist: *"Fetching 12 past clips & tuning creator profile..."* (or *"New creator detected — skipping personalized training & using viral baseline..."*).
- **3s – 6s**: *"Training personalized CPEP model weights (XGBoost)..."*
- **6s – 10s**: *"Forecasting 3s/15s retention curve & calculating Viral Score..."*
- **Done**: Modal morphs into the **Viral Intelligence Result Card** with direct **"Proceed to Upload on YouTube"** action!

---

## 5. Master TO-DO Checklist (Frontend Implementation)

### Phase 1: Next.js API Proxy Routes (BFF)
- [ ] Create `Web/src/app/api/viral-score/train/route.ts`
  - [ ] Forward `TrainCPEPPayload` to `${ML_SERVICE_URL}/train-cpep` with Bearer auth
  - [ ] Safe fallback: return `status: "skipped"` if external service is unreachable
- [ ] Create `Web/src/app/api/viral-score/predict/route.ts`
  - [ ] Forward `PredictViralScorePayload` to `${ML_SERVICE_URL}/calculate-viral-score`
  - [ ] Safe fallback: return calibrated local prediction score if service times out

### Phase 2: Client Service & RTK Query
- [ ] Create `Web/src/lib/viralScoreApi.ts`
  - [ ] TypeScript interfaces for `TrainCPEPPayload`, `PredictViralScorePayload`, `PredictViralScoreResponse`
  - [ ] Orchestrator function: `runFullViralScorePipeline(userId, video, segment, pastClips)`
    - [ ] If `pastClips.length > 0`: execute `train` API, then `predict` API
    - [ ] If `pastClips.length === 0`: skip `train`, execute `predict` API directly
    - [ ] Progress callback emitter (`onProgress(stage, percent, message)`) to drive UI animations
- [ ] Create `Web/src/store/api/viralScoreApi.ts`
  - [ ] Redux RTK Query endpoints for caching calculated scores per clip ID

### Phase 3: Final Pre-Upload UI Component (`PreUploadModal` / Dual CTA)
- [ ] Create `Web/src/components/Clips/PreUploadModal.tsx`
  - [ ] Displays final video thumbnail / preview
  - [ ] **Two primary CTAs**:
    - [ ] 🚀 **"Upload on YouTube"** (Triggers YouTube publish workflow)
    - [ ] ⚡ **"Check Viral Score"** (Triggers 4–10s ML prediction)
  - [ ] Animated 4–10s progress stepper with real-time feedback
  - [ ] Result View:
    - [ ] Large Frosted Virality Score Pill (`94/100`)
    - [ ] 3s Hook Retention, 15s Hold, Completion % bar graphs
    - [ ] Top positive attribution drivers (e.g., *Hook Strength +28%*, *Emotion +18%*)
    - [ ] Final "Upload to YouTube with this Score" button
- [ ] Integrate Dual CTA into:
  - [ ] `Web/src/components/Clips/ClipPreviewModal.tsx` (Pre-publish button column)
  - [ ] `Web/src/components/Editor/AgenticDirector.tsx` (`ApproachSuite` pre-render step)
  - [ ] `Web/src/components/Clips/ClipCard.tsx` (Card quick-action menu)

### Phase 4: Cold-Start Creator Logic Verification
- [ ] Test with user having 0 clips: verify Step 1 is cleanly skipped, total duration ~3-5s.
- [ ] Test with user having 5+ clips: verify Step 1 runs, historical features passed, total duration ~6-10s.

### Phase 5: Verification & Quality Assurance
- [ ] Typecheck: `./Web/node_modules/.bin/tsc -p Web/tsconfig.json --noEmit` (0 errors)
- [ ] Linter: `npm --prefix Web run lint` (0 errors)
- [ ] Test visual responsiveness on Desktop (1200px), Tablet (768px), and Mobile (480px)
