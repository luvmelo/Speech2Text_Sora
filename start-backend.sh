#!/bin/bash

# Dream Visualizer Backend Startup Script

echo "🚀 Starting Dream Visualizer Backend..."

# Check if .env file exists
if [ -f .env ]; then
    echo "📝 Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# Validate OpenAI API Key
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY is not set!"
    echo "Please set your OpenAI API key:"
    echo "  export OPENAI_API_KEY='your_api_key_here'"
    exit 1
fi

# Set default values if not provided
export OPENAI_AUDIO_MODEL="${OPENAI_AUDIO_MODEL:-gpt-4o-transcribe}"
export OPENAI_TEXT_MODEL="${OPENAI_TEXT_MODEL:-gpt-5-mini}"
export OPENAI_VIDEO_MODEL="${OPENAI_VIDEO_MODEL:-sora-2}"
export DREAM_SERVER_PORT="${DREAM_SERVER_PORT:-8080}"
export SKIP_VIDEO_GENERATION="${SKIP_VIDEO_GENERATION:-false}"
export REQUEST_TIMEOUT_SECONDS="${REQUEST_TIMEOUT_SECONDS:-300}"

echo "⚙️  Configuration:"
echo "   Audio Model: $OPENAI_AUDIO_MODEL"
echo "   Text Model: $OPENAI_TEXT_MODEL"
echo "   Video Model: $OPENAI_VIDEO_MODEL"
[ -n "$OPENAI_PROJECT" ] && echo "   OpenAI Project: $OPENAI_PROJECT"
echo "   Server Port: $DREAM_SERVER_PORT"
echo "   Skip Video Generation: $SKIP_VIDEO_GENERATION"

# Build the project if target directory doesn't exist
if [ ! -d "target/classes" ]; then
    echo "🔨 Building project..."
    mvn clean compile -DskipTests
    if [ $? -ne 0 ]; then
        echo "❌ Build failed!"
        exit 1
    fi
fi

# Run the server
echo "✨ Starting server on port $DREAM_SERVER_PORT..."
mvn exec:java -Dexec.mainClass="com.dreamvisualizer.server.DreamVisualizerServer" -q
