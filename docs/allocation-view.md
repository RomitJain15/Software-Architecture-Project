# Allocation View

## Purpose

This view explains how the system is allocated across major layers and runtime boundaries.

The visual reference for this view is [SWA_Allocation_View.png](SWA_Allocation_View.png).

## What This View Shows

The allocation view groups the system into larger architectural areas rather than individual code modules.

It shows:

- frontend responsibilities
- backend business responsibilities
- persistence and cache responsibilities
- external service responsibilities
- observability responsibilities

## Layer Description

### Frontend Layer

The frontend layer contains the React application, pages, client-side interactions, and browser storage.

This layer is responsible for rendering the user experience and calling backend APIs and socket endpoints.

### Business Layer

The business layer contains controllers, services, security logic, and realtime messaging logic.

It is where the main application behavior lives.

This is also where file metadata handling, session validation, presence tracking, and chat processing are coordinated.

### Data Layer

The data layer contains the backend dependencies that store and retrieve system data.

It includes:

- PostgreSQL for business data
- Redis for cached session and file metadata state
- Supabase for file object storage

### Observability Layer

The observability layer contains the monitoring and metrics stack.

It includes Micrometer, Actuator, Prometheus, and Grafana.

## Edge Clarification

The arrows in the allocation view should be read as cross-layer interaction paths.

- Frontend to business layer arrows show browser requests and socket connections.
- Business to data layer arrows show persistence, cache usage, and object storage usage.
- Business to observability arrows show metrics exposure and scraping paths.
- Data layer arrows show where the actual system data is stored.

## How the Main Responsibilities Map

- Authentication starts in the frontend, passes through the security layer, and uses PostgreSQL plus Redis for session handling.
- Course, enrollment, rating, and admin flows live in the backend business layer and persist to PostgreSQL.
- File upload and file metadata handling are split between PostgreSQL and Supabase.
- Presence and chat are handled in the backend business layer with in-memory runtime state and WebSocket messaging.
- Monitoring crosses from the backend into the observability stack.

## Why This View Matters

This view is useful when you want to explain where each responsibility physically lives in the architecture.

It gives the broadest picture of the system and is the easiest place to explain layer boundaries.
