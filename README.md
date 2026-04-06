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
- QUICK_START.md: quick setup instructions
- docs: detailed architecture and reference documentation

## Getting Started

1. Start infrastructure: docker-compose up -d
2. Start backend from backend:
	- Linux/macOS: ./mvnw spring-boot:run
	- Windows: mvnw.cmd spring-boot:run
3. Start frontend from frontend:
	- npm install
	- npm start

Optional helper script:

- ./start.sh starts Docker, backend, and frontend together (bash environments).

Default local URLs:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Documentation

- Architecture: docs/architecture.md
- Configuration and Environment Guide: docs/config-env-guide.md
- API Reference: docs/api-reference.md

## Current Frontend Scope

- Sign in page and sign up page
- Token and user payload are saved in localStorage after sign in
- Dashboard, profile page, and course workspace after sign in
- Course page with file upload/download, ratings, and live online user list per course
- Login sessions are tracked server-side and logout revokes the current session immediately
