# Resource Sharing Platform

A full-stack application for sharing course resources with authentication, enrollments, file management, rating support, and realtime course presence.

## Tech Stack

- Backend: Spring Boot 3, Spring Security (JWT), Spring WebSocket/STOMP, Spring Data JPA, PostgreSQL, Redis, Actuator/Micrometer
- Frontend: React 18, React Router, Axios, STOMP WebSocket client
- Storage: Supabase bucket integration for files
- Local orchestration: Docker Compose

## Project Structure

- backend: Java Spring Boot API and business logic
- frontend: React client application
- docker-compose.yml: PostgreSQL and Redis services
- start.sh: local startup helper script
- docs/start-guide.md: start guide
- docs: detailed architecture and reference documentation

## Prerequisites

- Docker Desktop installed and running
- Java 17 or later
- Node.js 18+ and npm

## Setup

1. Start the infrastructure services from the project root:

```bash
docker compose up -d
```

2. Install frontend dependencies:

```bash
cd frontend
npm install
```

3. Make sure backend configuration values are set as needed in `backend/src/main/resources/application.yml` or your environment.

## Execution

Run the application in three terminals.

### Backend

From the `backend` folder:

```bash
./mvnw spring-boot:run
```

On Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

### Frontend

From the `frontend` folder:

```bash
npm start
```

### Stop the app

- Press `Ctrl+C` in the backend and frontend terminals.
- Shut down the containers from the project root:

```bash
docker compose down
```

### Optional build checks

- Frontend production build:

```bash
cd frontend
npm run build
```

- Backend compile check:

```bash
cd backend
./mvnw -q -DskipTests compile
```

## Optional Helper Script

- `./start.sh` starts Docker, backend, and frontend together in bash environments.

## Default Local URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Documentation

- Start Guide: docs/start-guide.md
- Architecture: docs/architecture.md
- Component and Connector View: docs/cc-view.md
- Module View: docs/module-view.md
- Allocation View: docs/allocation-view.md
- Rationale: docs/rationale.md
- Quality Attributes: docs/quality-attributes.md
- Configuration and Environment Guide: docs/config-env-guide.md
- API Reference: docs/api-reference.md

## Current Frontend Scope

- Sign in page and sign up page
- Token and user payload are saved in localStorage after sign in
- Dashboard, profile page, and course workspace after sign in
- Course page with file upload/download, ratings, and live online user list per course
- Login sessions are tracked server-side and logout revokes the current session immediately
