# Rationale

## Purpose of the Project

The Resource Sharing Platform was chosen to model a realistic academic collaboration problem: students sharing notes, files, and questions within the same course context.

The project is useful for architectural evaluation because it combines three concerns that are often difficult to balance in a lightweight academic system:

- usability for everyday student workflows
- performance under concurrent access
- observability of runtime behavior

The result is a platform that behaves like a small collaborative learning environment rather than a simple file upload site.

## Why This Project Exists

The main motivation is to support course-based resource sharing and discussion in one place.

In practical terms, the system is intended to serve as a digital equivalent of sharing notes in class, asking questions, and seeing which classmates are currently active in the same course.

That makes the project suitable for demonstrating a realistic client-server architecture with collaboration, storage, security, caching, and monitoring all working together.

## Key Design Choices

### 1. React Frontend and Spring Boot Backend

The project uses a React single-page application for the user interface and a Spring Boot backend for API, security, business logic, and realtime messaging.

This separation keeps the frontend focused on usability and navigation while the backend handles core system behavior.

### 2. Layered Architecture

The system follows a layered style with presentation, business logic, persistence, cache, external storage, and observability concerns separated from each other.

This choice makes the code easier to understand, test, and evaluate because responsibilities are not mixed inside the same component.

### 3. JWT Authentication with Server-Tracked Sessions

Authentication uses JWTs for client-facing credentials, but the backend also tracks sessions server-side.

This is a deliberate choice because it gives the system the convenience of token-based login while still allowing immediate logout and session revocation.

The codebase reflects this through AuthService, JwtService, AuthSessionService, and the auth session table in PostgreSQL.

### 4. Redis as a Cache Layer

Redis is included to improve responsiveness for frequently accessed runtime data.

In the current design, it supports:

- active session checks
- recently used file metadata

This keeps PostgreSQL as the source of truth while allowing hot data to be reused quickly during repeated requests.

### 5. PostgreSQL as the Main System of Record

PostgreSQL stores the durable application data:

- users
- courses
- enrollments
- file metadata
- ratings
- auth sessions

This is the right fit because the platform depends on relational associations between users, courses, enrollments, files, and ratings.

### 6. Supabase for File Objects

The system stores file objects in Supabase rather than directly inside the application server.

This separates metadata from file content and avoids placing large binary storage responsibilities inside PostgreSQL or the backend process.

The backend stores metadata in the database and uses SupabaseStorageService for upload and delete operations.

### 7. Session-Only Realtime Messaging

Presence and chat are handled over WebSocket/STOMP, but chat is intentionally not stored persistently.

That choice keeps the collaboration experience lightweight and reduces storage overhead while still supporting active discussion during a course session.

It also matches the project scope, which focuses on live peer interaction rather than long-term messaging history.

### 8. Monitoring with Actuator, Prometheus, and Grafana

The observability stack is included so the project can be evaluated as a system, not just as a user interface.

Actuator exposes metrics, Prometheus collects them, and Grafana visualizes them.

This makes it possible to observe response times, active usage, and system behavior during multi-user access.

### 9. Local Deployment for Demonstration

The system is designed to run locally with Docker Compose, PostgreSQL, Redis, backend, and frontend components.

This choice keeps the project easy to demo, inspect, and compare without requiring cloud infrastructure.

## Architectural Trade-Offs

The design intentionally makes some trade-offs.

- Chat is session-only, which keeps the system simpler and faster but sacrifices permanent conversation history.
- Redis is used for hot runtime state, which improves speed but introduces a cache layer that must stay consistent with PostgreSQL.
- Supabase handles file storage externally, which reduces backend burden but adds a dependency boundary.
- The layered structure improves clarity, but it also means the system has multiple distinct runtime connectors to reason about.

## Why These Choices Are Appropriate

These choices fit the project goal because the system is meant to demonstrate architectural reasoning, not just feature delivery.

The final design shows:

- a clear separation of concerns
- practical caching for performance
- realtime interaction for collaboration
- observable behavior for evaluation
- a limited, focused scope that remains realistic for an academic platform

## Summary

The project was designed to be a compact but meaningful example of a collaborative learning platform.

Its architecture balances usability, responsiveness, and observability while keeping the implementation scope manageable.
