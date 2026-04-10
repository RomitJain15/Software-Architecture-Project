# Configuration and Environment Guide

## Purpose

This guide describes the configuration currently used by the repository.

## Current Configuration Sources

- backend/src/main/resources/application.yml
- docker-compose.yml
- start.sh

## Backend Configuration Keys

From application.yml:

- spring.datasource.url
- spring.datasource.username
- spring.datasource.password
- spring.datasource.driver-class-name
- spring.jpa.hibernate.ddl-auto
- server.port
- management.endpoints.web.exposure.include
- app.admin.seed.enabled
- app.admin.seed.reset-users
- app.admin.seed.email
- app.admin.seed.password
- app.admin.seed.name
- app.supabase.url
- app.supabase.service-key
- app.supabase.bucket
- jwt.secret
- jwt.expiration

## Security Configuration (Current)

From SecurityConfig:

- CORS allowed origins:
	- http://localhost:3000
	- http://localhost:5173
- CORS methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
- CSRF: disabled
- Session policy: STATELESS
- Public endpoints:
	- /api/auth/**
	- /actuator/health
	- /actuator/prometheus

All other routes require authentication.

WebSocket presence endpoint:

- /ws

WebSocket topic used for course online users:

- /topic/courses/{courseId}/online-users

## Docker Compose Services

Defined services:

- postgres (postgres:16)
- redis (redis:7-alpine)
- prometheus (prom/prometheus)
- grafana (grafana/grafana)

Compose environment values currently include:

- POSTGRES_DB=resourcesharing
- POSTGRES_USER=admin
- POSTGRES_PASSWORD=password

Prometheus configuration:

- monitoring/prometheus.yml
- Scrapes backend metrics from /actuator/prometheus at host.docker.internal:8080

Grafana defaults:

- URL: http://localhost:3001
- Username: admin
- Password: admin

Prometheus URL:

- http://localhost:9090

## Local Development Setup

1. Start PostgreSQL and Redis with docker-compose up -d.
2. Start backend with backend/mvnw spring-boot:run.
3. Start frontend with npm start in frontend.

## Validation Checklist

- Backend starts and connects to PostgreSQL
- JWT login/register works
- Logout revokes the current session
- Protected endpoints reject unauthenticated requests
- Course online users update when sessions or enrollments change
- Redis container is reachable on localhost:6379
- Supabase upload/list/delete operations succeed
- Actuator health endpoint returns UP
