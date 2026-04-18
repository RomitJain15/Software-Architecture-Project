# Start Guide

## Prerequisites

- Docker Desktop installed and running
- Node.js and npm installed
- Java 17 or later installed

## Start the System

Open three terminals.

### Terminal 1: Start the database and cache

Run this from the project root:

```bash
docker-compose up -d
```

This starts PostgreSQL and Redis.

### Terminal 2: Start the backend

Run this from the backend folder:

```bash
cd backend
./mvnw spring-boot:run
```

On Windows, use:

```bash
cd backend
mvnw.cmd spring-boot:run
```

### Terminal 3: Start the frontend

Run this from the frontend folder:

```bash
cd frontend
npm install
npm start
```

If dependencies are already installed, you can skip `npm install`.

## Open the App

Open your browser and go to:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

## Stop the System

Press `Ctrl+C` in the backend and frontend terminals.

Then stop the containers from the project root:

```bash
docker-compose down
```
