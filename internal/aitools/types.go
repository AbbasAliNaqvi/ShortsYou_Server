package aitools

type ClipDynamics struct {
	MusicMood    string `json:"music_mood"`
	EmotionType  string `json:"emotion_type"`
	ColorGrade   string `json:"color_grade"`
	CaptionStyle string `json:"caption_style"`
}

type SFXPlanningItem struct {
	Type     string  `json:"type"`
	AtSecond float64 `json:"at_second"`
	Reason   string  `json:"reason,omitempty"`
}
