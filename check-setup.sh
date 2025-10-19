#!/bin/bash

# Setup Checker for Dream Visualizer

echo "🔍 Dream Visualizer Setup Checker"
echo "=================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check Java
echo -n "Checking Java installation... "
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d. -f1)
    if [ "$JAVA_VERSION" -ge 17 ]; then
        echo -e "${GREEN}✓${NC} Java $JAVA_VERSION found"
    else
        echo -e "${RED}✗${NC} Java 17+ required, found version $JAVA_VERSION"
        ERRORS=$((ERRORS+1))
    fi
else
    echo -e "${RED}✗${NC} Java not found"
    ERRORS=$((ERRORS+1))
fi

# Check Node.js
echo -n "Checking Node.js installation... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d. -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        echo -e "${GREEN}✓${NC} Node.js v$NODE_VERSION found"
    else
        echo -e "${YELLOW}⚠${NC} Node.js 18+ recommended, found v$NODE_VERSION"
    fi
else
    echo -e "${RED}✗${NC} Node.js not found"
    ERRORS=$((ERRORS+1))
fi

# Check Maven
echo -n "Checking Maven installation... "
if command -v mvn &> /dev/null; then
    MVN_VERSION=$(mvn --version | head -n 1 | awk '{print $3}')
    echo -e "${GREEN}✓${NC} Maven $MVN_VERSION found"
else
    echo -e "${RED}✗${NC} Maven not found"
    ERRORS=$((ERRORS+1))
fi

# Check OpenAI API Key
echo -n "Checking OpenAI API Key... "
if [ -n "$OPENAI_API_KEY" ]; then
    echo -e "${GREEN}✓${NC} API key is set (${OPENAI_API_KEY:0:10}...)"
elif [ -f ".env" ] && grep -q "OPENAI_API_KEY" .env; then
    echo -e "${GREEN}✓${NC} API key found in .env file"
else
    echo -e "${RED}✗${NC} OPENAI_API_KEY not set"
    echo "   Set it with: export OPENAI_API_KEY='your_key'"
    ERRORS=$((ERRORS+1))
fi

# Check if backend is compiled
echo -n "Checking backend compilation... "
if [ -d "target/classes" ]; then
    echo -e "${GREEN}✓${NC} Backend is compiled"
else
    echo -e "${YELLOW}⚠${NC} Backend needs compilation"
    echo "   Run: mvn clean compile"
fi

# Check if frontend dependencies are installed
echo -n "Checking frontend dependencies... "
if [ -d "web/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Frontend dependencies not installed"
    echo "   Run: cd web && npm install"
fi

# Check if backend is running
echo -n "Checking backend server... "
if lsof -ti:8080 > /dev/null 2>&1; then
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Backend is running and healthy"
    else
        echo -e "${YELLOW}⚠${NC} Port 8080 in use but not responding"
        echo "   Kill and restart: kill \$(lsof -ti:8080) && ./start-backend.sh"
    fi
else
    echo -e "${YELLOW}⚠${NC} Backend is not running"
    echo "   Start it with: ./start-backend.sh"
fi

# Check if frontend is running
echo -n "Checking frontend server... "
if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Frontend is running"
else
    echo -e "${YELLOW}⚠${NC} Frontend is not running"
    echo "   Start it with: cd web && ./start-frontend.sh"
fi

# Check dream-records directory
echo -n "Checking dream records directory... "
if [ -d "web/dream-records" ]; then
    COUNT=$(find web/dream-records -name "dream-*.json" 2>/dev/null | wc -l)
    echo -e "${GREEN}✓${NC} Directory exists with $COUNT dream(s)"
else
    echo -e "${YELLOW}⚠${NC} Directory will be created on first use"
fi

echo ""
echo "=================================="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "🚀 Ready to start!"
    echo ""
    echo "Next steps:"
    echo "  1. Start backend:  ./start-backend.sh"
    echo "  2. Start frontend: cd web && ./start-frontend.sh"
    echo "  3. Open browser:   http://localhost:3000"
else
    echo -e "${RED}✗ Found $ERRORS error(s)${NC}"
    echo ""
    echo "Please fix the errors above and run this script again."
    exit 1
fi

