# Dream Visualizer Setup Guide

## Prerequisites

- Java 17 or higher
- Node.js 18 or higher
- OpenAI API key with access to Sora (for speech, prompt engineering, and video generation)

## Backend Setup

### 1. Set Environment Variables

Create a `.env` file in the project root or export these variables:

```bash
# OpenAI API (speech, prompt engineering, and Sora video)
export OPENAI_API_KEY="your_openai_api_key_here"
export OPENAI_AUDIO_MODEL="gpt-4o-transcribe"
export OPENAI_TEXT_MODEL="gpt-5-mini"
export OPENAI_VIDEO_MODEL="sora-2"
# export OPENAI_PROJECT="your_project_id"   # Required if your key is scoped to a specific project

# Server Configuration
export DREAM_SERVER_PORT=8080
export SKIP_VIDEO_GENERATION=false  # Set to true to temporarily disable video generation
export REQUEST_TIMEOUT_SECONDS=300
```

**Getting API Keys:**
- OpenAI API Key: https://platform.openai.com/api-keys (ensure Sora access is enabled)

### 2. Build and Run Java Backend

```bash
# Build the project
mvn clean package

# Run the server
java -jar target/tts-sora-0.1.0-SNAPSHOT.jar
```

Or use Maven directly:

```bash
mvn clean compile exec:java -Dexec.mainClass="com.dreamvisualizer.server.DreamVisualizerServer"
```

The server will start on port 8080 (or the port specified in DREAM_SERVER_PORT).

## Frontend Setup

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the `web` directory:

```bash
BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_APP_NAME="Dream Visualizer"
```

### 3. Run Development Server

```bash
npm run dev
```

The frontend will be available at http://localhost:3000

## Testing the Integration

1. Start the Java backend server (should show "DreamVisualizerServer listening on port 8080")
2. Start the Next.js frontend
3. Open http://localhost:3000
4. Click the microphone button and record your dream description
5. The system will:
   - Transcribe your audio using Whisper
   - Engineer a cinematic prompt using GPT-4
   - Display the results (Sora video generation is currently skipped)

## Enabling Sora Video Generation

When ready to enable Sora video generation:

1. Set `SKIP_VIDEO_GENERATION=false` in your environment
2. Ensure your OpenAI API key has access to Sora API
3. Restart the Java backend server

## Troubleshooting

### Backend not responding

- Check that port 8080 is not in use
- Verify your OpenAI API key is valid
- Check backend logs for errors

### Frontend can't connect to backend

- Verify BACKEND_URL in `.env.local` matches the backend port
- Ensure the backend server is running
- Check CORS settings if accessing from different domains

### Audio recording issues

- Ensure microphone permissions are granted in browser
- Check browser console for errors
- Verify audio format is supported (WebM)



export SKIP_VIDEO_GENERATION=true   

export $(grep -v '^#' .env | xargs)  

mvn -q compile   

mvn org.codehaus.mojo:exec-maven-plugin:3.1.0:java \
    -Dexec.mainClass=com.dreamvisualizer.server.DreamVisualizerServer \
    -Dexec.cleanupDaemonThreads=false