#!/bin/bash

# Dream Visualizer Frontend Startup Script

echo "🚀 Starting Dream Visualizer Frontend..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env.local exists, create from example if not
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        echo "📝 Creating .env.local from .env.example..."
        cp .env.example .env.local
    else
        echo "📝 Creating .env.local with default settings..."
        cat > .env.local << EOF
BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_APP_NAME="Dream Visualizer"
EOF
    fi
fi

# Start the development server
echo "✨ Starting Next.js development server..."
npm run dev

