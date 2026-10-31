export type SwipeDirection = "left" | "right" | "up";

export interface SwipeItemScores {
  emotion: number;
  semanticImpact: number;
  speechEmphasis: number;
  clarity: number;
  novelty: number;
  trendAlignment: number;
}

export interface SwipeItem {
  id: string;
  videoId: string;
  videoTitle: string;
  hookText: string;
  reasoning: string;
  viralScore: number; // 0 - 100
  durationSeconds: number;
  startTime: number;
  endTime: number;
  category: string;
  thumbnailUrl: string;
  playableUrl?: string;
  audioTrackTitle?: string;
  tags?: string[];
  emotionType?: string;
  isExistingClip?: boolean;
  status?: string;
  scores?: SwipeItemScores;
}

export interface SwipeHistoryItem {
  item: SwipeItem;
  direction: SwipeDirection;
  timestamp: number;
}
