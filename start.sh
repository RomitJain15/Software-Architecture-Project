#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Resource Sharing Platform Setup${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if Docker is installed
echo -e "${YELLOW}Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Start Docker and Docker Compose
echo -e "${YELLOW}Starting Docker containers...${NC}"
cd "$PROJECT_DIR"
if command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    docker compose up -d
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to start Docker containers${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker containers started successfully${NC}"

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 5

# Start the backend
echo -e "${YELLOW}Starting backend server...${NC}"
cd "$BACKEND_DIR"

# Check if mvnw has execute permissions
if [ ! -x "mvnw" ]; then
    chmod +x mvnw
fi

BACKEND_LOG="${TMPDIR:-/tmp}/backend.log"
./mvnw spring-boot:run > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to actually start (check if port 8080 is listening)
echo -e "${YELLOW}Waiting for backend to fully initialize...${NC}"
for i in {1..60}; do
    if command -v nc &> /dev/null; then
        if nc -z localhost 8080 2>/dev/null; then
            echo -e "${GREEN}✓ Backend is ready!${NC}"
            break
        fi
    else
        echo -e "${YELLOW}nc not found; skipping port check.${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${YELLOW}Backend startup timeout. Continuing anyway...${NC}"
    fi
    sleep 1
done

# Start the frontend
echo -e "${YELLOW}Starting frontend development server...${NC}"
cd "$FRONTEND_DIR"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

npm start &
FRONTEND_PID=$!

echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  All services are running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}Backend: http://localhost:8080${NC}"
echo -e "${GREEN}PostgreSQL: localhost:5432${NC}"
echo -e "${GREEN}Redis: localhost:6379${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}To stop all services, press Ctrl+C${NC}"
echo -e "${YELLOW}(Docker containers will be stopped but kept for reuse)${NC}"

# Handle graceful shutdown
trap cleanup EXIT

cleanup() {
    echo -e "${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    cd "$PROJECT_DIR"
    docker-compose stop
    echo -e "${GREEN}✓ All services stopped${NC}"
    echo -e "${GREEN}✓ Docker containers preserved (use 'docker-compose start' to resume)${NC}"
}

# Keep the script running
wait
