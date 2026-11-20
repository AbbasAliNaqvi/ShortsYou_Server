export interface CreatorSettings {
  profile: {
    displayName: string;
    handle: string;
    email: string;
    avatarUrl: string;
    niche: string;
    bio: string;
    contentTone: "high-energy" | "analytical" | "storytelling" | "humorous";
    defaultHashtags: string;
  };
  engine: {
    aiModel: "gemini-1.5-flash" | "gemini-1.5-pro" | "claude-3-5-sonnet" | "gpt-4o";
    viralScoreThreshold: number;
    defaultDuration: 15 | 30 | 45 | 60;
    autoQueueViral: boolean;
    brollFrequency: "none" | "light" | "dynamic";
    audioEnhance: boolean;
    musicDucking: boolean;
    musicDuckingDb: number;
  };
  captions: {
    stylePreset: "mrbeast" | "hormozi" | "minimal" | "cyber";
    autoEmoji: boolean;
    framingMode: "face-track" | "center-crop" | "podcast-split";
    fontSize: "sm" | "md" | "lg";
    position: "bottom" | "center" | "lower-third";
    highlightColor: string;
  };
  integrations: {
    telegramNotifyNewClip: boolean;
    telegramInstantApproval: boolean;
    telegramDailyDigest: boolean;
    youtubeAutoDraft: boolean;
    webhookUrl: string;
    webhookOnHighVirality: boolean;
  };
  notifications: {
    browserPush: boolean;
    emailDigest: boolean;
    soundEffects: boolean;
    viralBreakoutAlert: boolean;
    jobCompletionAlert: boolean;
  };
  advanced: {
    geminiApiKey: string;
    elevenLabsApiKey: string;
    mlServiceUrl: string;
  };
}

export const DEFAULT_SETTINGS: CreatorSettings = {
  profile: {
    displayName: "Das Gajraj Sharma",
    handle: "dasgajraj",
    email: "creator@shortsyou.studio",
    avatarUrl: "/team/das-gajraj-sharma.png",
    niche: "Tech & Coding",
    bio: "Building automated viral short-form videos with agentic AI intelligence.",
    contentTone: "high-energy",
    defaultHashtags: "#Shorts #Viral #Tech #Coding #AI #Developer",
  },
  engine: {
    aiModel: "gemini-1.5-flash",
    viralScoreThreshold: 78,
    defaultDuration: 30,
    autoQueueViral: true,
    brollFrequency: "dynamic",
    audioEnhance: true,
    musicDucking: true,
    musicDuckingDb: -14,
  },
  captions: {
    stylePreset: "mrbeast",
    autoEmoji: true,
    framingMode: "face-track",
    fontSize: "md",
    position: "center",
    highlightColor: "#facc15",
  },
  integrations: {
    telegramNotifyNewClip: true,
    telegramInstantApproval: true,
    telegramDailyDigest: true,
    youtubeAutoDraft: true,
    webhookUrl: "",
    webhookOnHighVirality: true,
  },
  notifications: {
    browserPush: true,
    emailDigest: false,
    soundEffects: true,
    viralBreakoutAlert: true,
    jobCompletionAlert: true,
  },
  advanced: {
    geminiApiKey: "",
    elevenLabsApiKey: "",
    mlServiceUrl: "https://shortsyou-server.onrender.com",
  },
};

const SETTINGS_KEY = "shortsyou_creator_settings";

export function loadSettings(): CreatorSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      profile: { ...DEFAULT_SETTINGS.profile, ...(parsed.profile || {}) },
      engine: { ...DEFAULT_SETTINGS.engine, ...(parsed.engine || {}) },
      captions: { ...DEFAULT_SETTINGS.captions, ...(parsed.captions || {}) },
      integrations: { ...DEFAULT_SETTINGS.integrations, ...(parsed.integrations || {}) },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...(parsed.notifications || {}) },
      advanced: { ...DEFAULT_SETTINGS.advanced, ...(parsed.advanced || {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: CreatorSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent("shortsyou_settings_updated", { detail: settings }));
  } catch (err) {
    console.error("Failed to persist settings:", err);
  }
}
