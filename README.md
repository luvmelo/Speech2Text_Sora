# DreamVisualizer Three-Layer Pipeline

DreamVisualizer converts an oral dream recollection into a dreamlike Sora 2 video prompt and submits the job to OpenAI's video API. The system is intentionally modular so it can later power a web front-end or other experiences.

## Quick Start

⚠️ **Important:** You must start the backend server first before using the frontend!

See [QUICKSTART.md](./QUICKSTART.md) for detailed step-by-step instructions.

### Prerequisites
- Java 17+
- Node.js 18+
- OpenAI API key

### Quick Commands

1. **Set your OpenAI API key:**
   ```bash
   export OPENAI_API_KEY="your_api_key_here"
   ```

2. **Start Backend (Terminal 1):**
   ```bash
   ./start-backend.sh
   # Wait until you see: "DreamVisualizerServer listening on port 8080"
   ```

3. **Start Frontend (Terminal 2):**
   ```bash
   cd web && ./start-frontend.sh
   ```

4. **Use the App:**
   - Open http://localhost:3000
   - Click microphone and describe your dream
   - Watch the processing animation
   - View results in real-time

**💾 Dream records are auto-saved to:** `web/dream-records/`

**Note:** Sora video generation is disabled by default. Set `SKIP_VIDEO_GENERATION=false` to enable it.

### Troubleshooting

If you see "Cannot connect to backend server":
```bash
# Check if backend is running
lsof -ti:8080

# If not, start it
./start-backend.sh
```

See [QUICKSTART.md](./QUICKSTART.md) for complete troubleshooting guide.

## Architecture

- **Layer 1 – Speech transcription** (`SpeechTranscriptionService`): Uploads an audio file to `audio/transcriptions`, returning a full transcript plus optional time-coded segments.
- **Layer 2 – Prompt engineering** (`DreamPromptEngineer`): Uses the Responses API with a strict JSON schema and a dramaturg-focused system prompt to extract story beats, keywords, tone, and the final `sora_prompt`.
- **Layer 3 – Video submission** (`SoraVideoService`): Submits the engineered prompt and optional generation controls (duration, aspect ratio, seed, format) to the Sora video API and returns a job handle + download URL when available.
- **Orchestration** (`DreamVisualizationPipeline`): Chains the services and yields the combined `DreamVisualizationOutcome`.

## Prompt Engineering Defaults

The system prompt (see `PromptEngineeringConfig.DEFAULT_SYSTEM_PROMPT`) is crafted to mirror hazy, dream-core aesthetics inspired by conceptual dream recorder projects. The Responses API is constrained by a JSON schema so that every run yields:

- `sora_prompt`: Final prompt tailored for Sora 2 (present tense, hazy, diffuse visuals, dream logic preserved).
- `narrative_beats`: 3–6 key beats preserving the dream arc.
- `visual_keywords`: Anchor elements to keep Sora grounded.
- `emotional_tone`, `color_palette`, `camera_style`, `motion_style`.
- `negative_prompts`: Elements Sora should avoid.

## Getting Started

1. Install a Java 17 runtime and Maven.
2. Populate environment variables (recommended via `.env`):
   - `OPENAI_API_KEY` – required.
   - Optional overrides: `OPENAI_BASE_URL`, `OPENAI_AUDIO_MODEL`, `OPENAI_TEXT_MODEL`, `OPENAI_VIDEO_MODEL`, `OPENAI_REQUEST_TIMEOUT_SECONDS`.
3. Package the CLI:
   ```bash
   mvn package
   ```
4. Run the pipeline with an audio file recorded by the dreamer:
   ```bash
   java -jar target/tts-sora-0.1.0-SNAPSHOT.jar /path/to/dream.m4a en
   ```
   (Second argument is an optional BCP-47 language code.)

The CLI prints the transcript, engineered prompt, and the response metadata from the video API. Integrate `DreamVisualizationPipeline` directly if you are building a web or desktop front-end.

## HTTP Server for Web Clients

`com.dreamvisualizer.server.DreamVisualizerServer` exposes the pipeline at `POST /dreams` (multipart form upload) and a health probe at `GET /health`.

```bash
mvn package
java -cp target/tts-sora-0.1.0-SNAPSHOT.jar com.dreamvisualizer.server.DreamVisualizerServer
```

Environment variables:

- `DREAM_SERVER_PORT` (default `8080`)
- `OPENAI_*` variables as described above

The server response matches the JSON contract consumed by the new web UI (transcript, engineered prompt, and Sora job metadata).

## Web Experience (Next.js)

The `web/` directory contains a Next.js 15 app whose layout mirrors the dream-recorder aesthetic referenced in the HDR Image Generator project. The landing screen immediately presents a glassmorphism voice recorder, an animated status panel, and the structured prompt output.

```bash
cd web
npm install
npm run dev
```

Configuration:

- `BACKEND_URL` – optional environment variable (default `http://localhost:8080`) used by the API proxy route (`/api/dreams`) to reach the Java server.
- The client records audio with `MediaRecorder` and streams it to `/api/dreams`; responses update the cinematic prompt panels in real-time.

## Extending Toward a Richer Product

- Persist `DreamVisualizationOutcome` objects to give users a history of recorded dreams.
- Add polling logic for the Sora job until the video asset is ready; expose the eventual download URL to the client.
- Introduce frontend controls for mood overrides (e.g., slider affecting `color_palette`, toggles for `camera_style`).

## Testing Hooks

- Mock the `OpenAIClient` for unit testing the services without making real API calls.
- `SpeechTranscriptionService` exposes the segment list, which you can feed into a UI timeline.
- `DreamPromptEngineer` consumes plain text, so you can seed fixtures for regression testing of prompt evolution.

## Safety Checks

- Every layer validates inputs (readable audio path, non-empty transcripts).
- The response schema forces the GPT layer to populate all required fields, reducing prompt drift.
- The video submission layer propagates the narrative metadata as `metadata` for traceability (and future analytics).
