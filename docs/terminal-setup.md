# Dream Visualizer CLI Setup Checklist

Follow these terminal commands when bringing the project onto a fresh machine. Run them from the directory where you want the repository to live.

## 1. Clone & Enter the Project

```bash
git clone <your-repo-url>
cd TTS_Sora
```

## 2. Configure Environment Variables

Create a fresh `.env` or export the required variables in your shell. Replace the placeholder values with your own keys and project identifiers.

```bash
cat <<'EOF' > .env
OPENAI_API_KEY="sk-..."          # required
OPENAI_AUDIO_MODEL="gpt-4o-transcribe"
OPENAI_TEXT_MODEL="gpt-5-mini"
OPENAI_VIDEO_MODEL="sora-2"
OPENAI_PROJECT="your-project-id" # optional, only if your key is project-scoped

# Backend behaviour toggles
SKIP_VIDEO_GENERATION=false      # set true if you want to skip actual video renders
EOF
```

Expose the variables to the current shell session (repeat each time you open a new terminal unless you rely on `start-backend.sh` to read `.env`).

```bash
export $(grep -v '^#' .env | xargs)
```

## 3. Backend Dependencies

Install Java packages once (Java 17+ required):

```bash
mvn clean compile -DskipTests
```

## 4. Frontend Dependencies

Install Node modules once:

```bash
cd web
npm install
cd ..
```

## 5. Start the Backend

From the project root:

```bash
./start-backend.sh
```

This script re-reads `.env`, validates keys, builds if needed, and launches the server on port `8080` (override with `DREAM_SERVER_PORT` before running if desired).

## 6. Start the Frontend (in a second terminal)

```bash
cd TTS_Sora/web
npm run dev
```

The Next.js app listens on `http://localhost:3000` and forwards API calls to the backend.

## 7. Optional Runtime Flags

- Skip video generation: `export SKIP_VIDEO_GENERATION=true`
- Change video length/format defaults: adjust `web/src/app/page.tsx` or `VideoGenerationOptions` as needed before building.

Repeat steps 5–6 whenever you reboot or need to rerun the services. Adjust any exports before invoking the scripts to change models, ports, or skipping behaviour.


 mvn -q compile   

     mvn org.codehaus.mojo:exec-maven-plugin:3.1.0:java \
    -Dexec.mainClass=com.dreamvisualizer.server.DreamVisualizerServer \
    -Dexec.cleanupDaemonThreads=false