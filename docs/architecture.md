# DreamVisualizer Architecture Notes

```
┌────────────────────┐   audio file   ┌──────────────────────────┐
│ User (voice input) │ ─────────────▶ │ SpeechTranscriptionService│
└────────────────────┘                └──────────┬───────────────┘
                                                transcript text
                                     ┌──────────────────────────┐
                                     │ DreamPromptEngineer      │
                                     └──────────┬───────────────┘
                                         engineered prompt
                                     ┌──────────────────────────┐
                                     │ SoraVideoService         │
                                     └──────────┬───────────────┘
                                             video job metadata
                                     ┌──────────────────────────┐
                                     │ DreamVisualizationPipeline│
                                     └──────────────────────────┘
```

## Modules

| Package | Responsibility |
|---------|----------------|
| `com.dreamvisualizer.config` | Loads API configuration from environment. |
| `com.dreamvisualizer.http` | Shared HTTP client & error handling. |
| `com.dreamvisualizer.speech` | Audio transcription request/response handling. |
| `com.dreamvisualizer.prompt` | Prompt engineering logic and schemas. |
| `com.dreamvisualizer.video` | Sora video submission & job mapping. |
| `com.dreamvisualizer.orchestrator` | High-level pipeline & CLI entry point. |

## Layer Detailing

### 1. Speech Transcription
- Uses `gpt-4o-mini-transcribe` by default (override via `OPENAI_AUDIO_MODEL`).
- Accepts optional `language` + `temperature`.
- Returns full text + per-segment metadata for future UI timelines.

### 2. Prompt Engineering
- Responses API with deterministic JSON schema (`PromptEngineeringConfig.defaultResponseFormat`).
- System prompt biases toward hazy, dreamcore visuals, referencing conceptual inspirations.
- `DreamPromptResult` carries narrative beats, keywords, mood + cinematic guidance.

### 3. Video Generation
- Generates payload for `videos` endpoint with optional `duration`, `aspect_ratio`, `format`, `seed`.
- Propagates metadata (beats, tone) for analytics/persistence.
- Returns `SoraVideoJob` with job status and eventual download URL.

## Orchestration / Future Integrations

- `DreamVisualizationPipeline` glues the layers together; callers can intercept results after each stage if they want manual editing before video submission.
- For web UX: add asynchronous polling for video completion, plus editing UI for `DreamPromptResult` before submitting to Sora.
- For dream journaling: store `DreamVisualizationOutcome` with a human-readable summary (`narrative_beats`) and allow re-rendering from saved prompts.

## Error Handling & Resilience

- Underlying `OpenAIClient` throws `OpenAIException` on non-2xx responses, ensuring quick surfacing of API issues.
- Input validation prevents unreadable files or missing API keys.
- Since the Responses API output is schema-bound, malformed assistant replies immediately trigger parsing errors, avoiding silently corrupted prompts.
