# Component and Connector View

## Purpose

This document explains how the system behaves at runtime and how the main connectors move data between the frontend, backend, cache, database, and external services.

The visual reference for this view is the C&C view PNG.

## At a Glance

- Frontend calls backend REST endpoints for sign-in, sign-up, courses, enrollments, files, ratings, and admin actions.
- The backend validates JWTs and active sessions before serving protected requests.
- File metadata lives in PostgreSQL, while file objects live in Supabase.
- Redis is used as a cache for active sessions and recent file metadata.
- Presence and chat are delivered over SockJS/STOMP.

## What This View Shows

The component and connector view focuses on runtime communication between components.

It shows:

- how the user interacts with the frontend
- how the frontend talks to REST endpoints and WebSocket endpoints
- how security checks happen before protected requests are processed
- how login sessions are validated
- how file metadata and file objects are handled separately
- how realtime chat and presence updates are published
- how monitoring data flows into Prometheus and Grafana

## Main Runtime Paths

### Frontend to Backend

The React application sends HTTP requests for login, registration, courses, enrollments, files, ratings, and admin actions.

It also opens a SockJS/STOMP connection for realtime presence and chat.

### Authentication Path

Sign in and sign up requests go through AuthController.

JWT validation and session validation happen in the security path before protected endpoints are allowed to continue.

AuthSessionService keeps the authoritative session state in PostgreSQL and uses Redis as a fast cache for active-session checks.

### File Path

File metadata is first resolved from PostgreSQL.

FileController uses FileMetadataService for metadata and SupabaseStorageService for object storage operations.

This means metadata and file bytes are not treated as the same concern.

### Presence and Chat Path

Presence updates go through the WebSocket controllers and are broadcast to subscribed clients.

Chat messages are handled through the chat socket controller and stored in memory while the application is running.

### Monitoring Path

The backend exposes metrics through Actuator.

Prometheus scrapes those metrics, and Grafana visualizes them.

### In-Memory Runtime State

Some parts of the system keep data only while the application is running.

This in-memory state is not written to PostgreSQL or Redis. It is used for fast runtime tracking and is cleared when the backend restarts.

In this project, the main in-memory structures are:

- courseToUsers in the presence registry, which tracks which users are currently online in each course
- chat rooms in CourseChatService, which keep recent chat messages for the active runtime session
- the simple STOMP broker, which routes messages to subscribed WebSocket clients

This means in-memory state is temporary, fast, and session-bound, while PostgreSQL and Redis are persistent or cached storage layers.

## Backend to PostgreSQL Map

| Backend area | PostgreSQL data |
| --- | --- |
| AuthService and AuthSessionService | users, auth_sessions |
| CourseService | courses, enrollments, files |
| EnrollmentService | enrollments |
| FileMetadataService | files |
| RatingService | ratings, files |
| Presence read paths | users, enrollments |
| AdminController and admin flows | users |

## Edge Clarification

In this view, each arrow in the PNG means one runtime dependency or connector.

- Frontend to controller arrows mean HTTP request flow.
- Socket client to WebSocket configuration arrows mean connection setup.
- Controller to service arrows mean runtime delegation.
- Service to repository arrows mean persistent data access.
- Service to Redis arrows mean cache access.
- Service to Supabase arrows mean object storage access.

## Redis in the C&C View

Redis is shown as a cache layer rather than a system of record.

It supports two runtime concerns:

- active token and session checks
- recently used file metadata

The source of truth still lives in PostgreSQL.

## Why This View Matters

This view is the best place to explain the actual behavior of the system while it is running.

It shows who calls what, what data is cached, what data is persisted, and where external services are used.
