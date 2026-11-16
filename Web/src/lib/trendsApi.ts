export interface TrendItem {
  genre: string;
  name: string;
  whyTrending: string;
  momentum: "rising" | "emerging" | "peaking" | string;
  keywords: string[];
}

export interface VideoIdeaItem {
  title: string;
  hook: string;
  genres: string[];
  trends: string[];
}

export interface PredictTrendsData {
  userId: string;
  genres: string[];
  trends: TrendItem[];
  videoIdeas: VideoIdeaItem[];
  usedWebSearch: boolean;
  generatedAt: string;
}

export const FALLBACK_TRENDS_DATA: PredictTrendsData = {
  userId: "6a9881707a0426c73af163e5",
  genres: ["tech", "education", "motivation", "news"],
  trends: [
    {
      genre: "tech",
      name: "Generative Video AI for Shorts",
      whyTrending: "Creators need instant, high-quality reels and AI can auto-edit in seconds",
      momentum: "rising",
      keywords: ["generative AI", "video synthesis", "shorts"],
    },
    {
      genre: "tech",
      name: "Edge AI Chips for Wearables",
      whyTrending: "On-device inference is powering real-time health and AR features",
      momentum: "emerging",
      keywords: ["edge computing", "wearable AI", "low latency"],
    },
    {
      genre: "tech",
      name: "Quantum Cloud Services for Developers",
      whyTrending: "Major cloud providers now offer on-demand quantum processors for experiments",
      momentum: "emerging",
      keywords: ["quantum computing", "cloud", "developer tools"],
    },
    {
      genre: "education",
      name: "AI-Powered Microlearning Paths",
      whyTrending: "Learners crave bite-sized, adaptive lessons that fit into busy schedules",
      momentum: "rising",
      keywords: ["microlearning", "adaptive AI", "skill badges"],
    },
    {
      genre: "education",
      name: "VR Lab Simulations for STEM",
      whyTrending: "Schools are adopting immersive labs to replace costly physical equipment",
      momentum: "emerging",
      keywords: ["VR", "STEM education", "lab simulations"],
    },
    {
      genre: "education",
      name: "Blockchain Credential Verification",
      whyTrending: "Employers demand tamper-proof certificates for remote hiring",
      momentum: "emerging",
      keywords: ["blockchain", "credentials", "verification"],
    },
    {
      genre: "motivation",
      name: "Neurofeedback Habit Loop Apps",
      whyTrending: "Wearables now provide brainwave data that can trigger habit cues",
      momentum: "emerging",
      keywords: ["neurofeedback", "habit building", "biofeedback"],
    },
    {
      genre: "motivation",
      name: "Digital Minimalism Challenge 30 Days",
      whyTrending: "App overload is driving a wave of structured digital-detox challenges",
      momentum: "rising",
      keywords: ["digital detox", "minimalism", "challenge"],
    },
    {
      genre: "motivation",
      name: "AI-Generated Personal Mantras",
      whyTrending: "AI can craft daily affirmations tailored to mood and goals",
      momentum: "emerging",
      keywords: ["AI", "affirmations", "motivation"],
    },
    {
      genre: "news",
      name: "AI Regulation Updates Globally",
      whyTrending: "New AI laws in the US, EU, and Asia are reshaping product roadmaps",
      momentum: "peaking",
      keywords: ["AI policy", "regulation", "legislation"],
    },
    {
      genre: "news",
      name: "Climate Disaster Early Warning Tech",
      whyTrending: "Satellite AI networks are delivering real-time flood and wildfire alerts",
      momentum: "rising",
      keywords: ["climate tech", "early warning", "disaster prediction"],
    },
    {
      genre: "news",
      name: "Space Tourism Milestones 2026",
      whyTrending: "Commercial suborbital flights are hitting record bookings this year",
      momentum: "rising",
      keywords: ["space tourism", "commercial flight", "2026"],
    },
  ],
  videoIdeas: [
    {
      title: "Turn AI Video Magic into a 30-Day Minimalism Boost",
      hook: "What if your phone could auto-create viral reels while you ditch screen clutter?",
      genres: ["tech", "motivation"],
      trends: [
        "Generative Video AI for Shorts",
        "Digital Minimalism Challenge 30 Days",
      ],
    },
    {
      title: "Visualizing Quantum Computing in VR",
      hook: "Step inside a quantum world—no PhD required!",
      genres: ["education", "tech"],
      trends: [
        "Quantum Cloud Services for Developers",
        "VR Lab Simulations for STEM",
      ],
    },
    {
      title: "AI Regulation: What the New EU AI Act Means for Your Apps",
      hook: "Your favorite apps are about to change—here's the rulebook you need now!",
      genres: ["news", "tech"],
      trends: ["AI Regulation Updates Globally"],
    },
    {
      title: "Microlearning Mastery: Learn a New Skill in 5 Minutes a Day",
      hook: "I'll prove you can become fluent in Python with just a coffee break each morning!",
      genres: ["motivation", "education"],
      trends: ["AI-Powered Microlearning Paths"],
    },
    {
      title: "Stay Ahead of the Next Flood: Real-Time Early Warning Hacks",
      hook: "Get the alert before the water—your 60-second survival plan!",
      genres: ["news", "motivation"],
      trends: ["Climate Disaster Early Warning Tech"],
    },
    {
      title: "Neurofeedback Apps That Actually Change Your Habits",
      hook: "Turn brainwaves into a habit streak—watch the data flip in real time!",
      genres: ["tech", "motivation"],
      trends: ["Neurofeedback Habit Loop Apps"],
    },
  ],
  usedWebSearch: false,
  generatedAt: new Date().toISOString(),
};

export async function fetchPredictedTrends(
  userId: string = "6a9881707a0426c73af163e5"
): Promise<PredictTrendsData> {
  try {
    const res = await fetch("/api/trends/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data) {
        return json.data as PredictTrendsData;
      }
    }
    return FALLBACK_TRENDS_DATA;
  } catch (err) {
    console.warn("Error fetching predicted trends, using fallback:", err);
    return FALLBACK_TRENDS_DATA;
  }
}
