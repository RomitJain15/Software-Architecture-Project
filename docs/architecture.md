# Architecture

## Overview

The Resource Sharing Platform uses a React frontend and a Spring Boot backend with JWT authentication, server-tracked login sessions, and realtime course presence updates.

Main flow:

- React frontend calls REST APIs over HTTP
- Spring Security validates JWT tokens
- Auth sessions are stored server-side so logout can revoke access immediately
- Controllers delegate to service layer
- Services use Spring Data repositories for PostgreSQL persistence
- File upload and delete operations are delegated to Supabase Storage
- Course presence updates are pushed over WebSocket/STOMP for the online users panel

## High-Level Components

- Client: React SPA in frontend
- API: Spring Boot app in backend
- Data store: PostgreSQL
- Redis service available through Docker Compose
- Object/file storage: Supabase bucket
- Observability: Spring Actuator + Prometheus registry

## Backend Layers

- Controller layer:
  - AuthController
  - AdminController
  - CourseController
  - EnrollmentController
  - FileController
  - RatingController
  - PresenceController
- Service layer:
  - AuthService
  - AuthSessionService
  - CourseService
  - EnrollmentService
  - FileMetadataService
  - RatingService
  - SupabaseStorageService
  - CoursePresenceBroadcaster
- Data access layer:
  - UserRepository
  - AuthSessionRepository
  - CourseRepository
  - EnrollmentRepository
  - FileMetadataRepository
  - RatingRepository
- Security/config:
  - SecurityConfig
  - JwtFilter
  - JwtService
  - AdminSeedConfig
  - WebSocketConfig

## Core Domain

- User: authenticated actor with role
- Course: logical context for resource organization
- Enrollment: user-course relationship
- FileMetadata: file descriptors and ownership/linking metadata
- Rating: user feedback for files
- AuthSession: server-side login session record tied to each JWT

## Authentication and Authorization

- Public endpoints: /api/auth/register, /api/auth/login
- Logout endpoint: /api/auth/logout revokes the current session
- Public monitoring endpoints: /actuator/health, /actuator/prometheus
- Protected endpoints: all remaining routes
- JWT bearer tokens are checked by JwtFilter before controller access
- Method-level role checks are used on selected endpoints with @PreAuthorize
- Course online-users endpoint: /api/courses/{courseId}/online-users returns enrolled users with active login sessions
- WebSocket topic: /topic/courses/{courseId}/online-users pushes presence updates to the frontend

## Runtime Topology

Local development topology:

- Browser -> React (localhost:3000)
- React -> Spring Boot API (localhost:8080)
- React -> WebSocket/STOMP endpoint (localhost:8080/ws)
- Spring Boot -> PostgreSQL (localhost:5432)
- Spring Boot -> Redis (localhost:6379)
- Spring Boot -> Supabase (external)

## Currently Implemented Frontend Flow

- Unauthenticated routes: /signin and /signup
- After sign in, token and user are stored in browser localStorage
- Authenticated route: /
- Course page displays a live online users list for the current course




