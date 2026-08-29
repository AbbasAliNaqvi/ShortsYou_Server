package ml

import "context"

type Service interface {
	Transcribe(context.Context, TranscribeRequest) (*TranscribeResponse, error)
	Analyze(context.Context, AnalyzeRequest) (*AnalyzeResponse, error)
	DetectEmotion(context.Context, EmotionRequest) (*EmotionResponse, error)
	GenerateShort(context.Context, GenerateShortRequest) (*GenerateShortResponse, error)
	TrainCPEP(context.Context, TrainCPEPRequest) (*TrainCPEPResponse, error)
}
