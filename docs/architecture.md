# Architecture

## Purpose

This document explains the system architecture at a high level and points to the three main architectural views used in this project:

- Module View: [module-view.md](module-view.md)
- Allocation View: [allocation-view.md](allocation-view.md)
- Component and Connector View: [cc-view.md](cc-view.md)
- Rationale: [rationale.md](rationale.md)
- Quality Attributes: [quality-attributes.md](quality-attributes.md)

These views are complementary. The module view explains structural dependencies, the allocation view explains how software elements are placed into layers and runtime boundaries, and the component and connector view explains runtime interactions between components.

## System Summary

The Resource Sharing Platform is a full-stack application with a React frontend and a Spring Boot backend. It supports authentication, course management, enrollments, file upload and download, ratings, live course presence, and chat features.

The backend persists business data in PostgreSQL, uses Supabase for object storage, exposes WebSocket/STOMP endpoints for realtime features, and exposes actuator metrics for monitoring. Redis is included as a cache layer in the current design direction.

## Diagram Overview

### Module View

The module view describes the static structure of the system.

It shows how the frontend, backend controllers, backend services, persistence adapters, cache, and external storage depend on each other. This view is useful when you want to understand code organization and compile-time dependencies.

Key points:

- Frontend pages and clients depend on backend API and WebSocket endpoints.
- Controllers depend on domain services.
- Services depend on repositories, Redis cache, and external storage when needed.
- Supabase storage is reached only through the storage service in the backend module structure.

### Allocation View

The allocation view shows how the system is grouped into larger architectural layers and where each major responsibility lives.

It is the best diagram for explaining the overall placement of responsibilities across frontend, business, data, and observability layers.

Key points:

- Frontend layer contains the React application, pages, and browser-side state.
- Business layer contains controllers, services, security, and realtime messaging code.
- Data layer contains PostgreSQL, Redis, and Supabase.
- Observability layer contains Micrometer, Actuator, Prometheus, and Grafana.

### Component and Connector View

The component and connector view explains runtime interactions.

It is the best diagram for showing request flow, realtime messaging, authentication checks, and cache access paths.

Key points:

- Browser requests hit REST endpoints for authentication and data access.
- JWT validation and active session checks happen before protected endpoints are executed.
- WebSocket connections are established through SockJS and STOMP.
- Presence and chat updates are broadcast through the messaging layer.
- File metadata is read from PostgreSQL first, while file objects are stored and retrieved through Supabase.

## Edge Clarification

This section explains how to read the connectors shown in the diagrams.

### Frontend to Backend

- The frontend depends on backend REST endpoints for login, registration, courses, enrollments, files, ratings, and admin operations.
- The frontend depends on backend WebSocket endpoints for presence and chat.
- Browser localStorage is used to keep the token and user payload after sign in.

### Security and Authentication

- SecurityConfig and JwtFilter sit in front of protected backend routes.
- JwtService validates token structure and claims.
- AuthSessionService checks whether a session is still active before allowing access.
- Auth sessions are stored in PostgreSQL, and Redis is used as a fast cache for active session checks.

### File Flow

- FileController handles file upload, list, and delete operations.
- FileMetadataService handles metadata operations and repository access.
- PostgreSQL is the source of truth for file metadata.
- SupabaseStorageService handles the object storage side of file upload and delete.
- The actual file object is retrieved from Supabase using the URL that comes from the metadata record.

### Realtime Presence and Chat

- WebSocketConfig defines the STOMP endpoint and broker configuration.
- WsHandshakeInterceptor validates the token during socket connection setup.
- CoursePresenceSocketController and CourseChatSocketController handle realtime messages.
- CoursePresenceBroadcaster pushes presence updates to subscribed clients.
- CourseChatService stores chat room state in memory.

### Monitoring

- Actuator exposes runtime metrics.
- Prometheus scrapes those metrics.
- Grafana visualizes the collected data.

## Data Responsibilities

- PostgreSQL stores users, courses, enrollments, file metadata, ratings, and auth sessions.
- Redis stores cached session activity and recent file metadata.
- Supabase stores the file objects themselves.

## Notes on Current Scope

This document describes the system as it is currently modeled, with Redis added as the new cache layer in the architecture documentation.

It does not include Mermaid code, API field-by-field details, or database schema definitions.
