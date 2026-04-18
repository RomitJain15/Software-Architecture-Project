# Module View

## Purpose

This view explains the static structure of the system and how the code is organized into modules, services, controllers, repositories, and external integrations.

The visual reference for this view is [SWA_Module_View.png](SWA_Module_View.png).

## What This View Shows

The module view focuses on compile-time and design-time dependencies rather than runtime request flow.

It shows:

- frontend modules that depend on backend APIs and browser storage
- backend controller modules that depend on domain services
- domain services that depend on repositories, Redis, and Supabase storage
- persistence adapters that isolate database access
- observability modules that connect application metrics to monitoring tools

## Main Structural Ideas

### Frontend Layer

The frontend contains the React application, page modules, API client code, and browser-side storage.

Its purpose is to provide the user interface, call backend APIs, and maintain the signed-in token and user payload in localStorage.

### Backend Controller Layer

Controllers represent the main entry points into the backend.

They receive requests from the frontend and delegate business logic to services. In the current system, the important controllers are:

- AuthController
- CourseController
- EnrollmentController
- FileController
- RatingController
- CourseChatController
- PresenceController
- AdminController
- CourseChatSocketController
- CoursePresenceSocketController

### Service Layer

Services contain the main business logic and are the main modules of interest in this view.

Key responsibilities include:

- authentication and session control
- course and enrollment rules
- file metadata management
- Supabase file storage access
- ratings
- chat state
- presence tracking and broadcasting

### Persistence and Cache

The service layer depends on repositories for PostgreSQL access.

Redis is used as a cache layer for:

- active token/session checks
- recently used file metadata

PostgreSQL remains the source of truth for application data.

### External Storage

Supabase is used for file object storage.

The module view should show that backend code reaches Supabase through the storage service rather than directly from every controller.

## Edge Clarification

The most important edge rule in this view is that metadata and object storage are separate concerns.

### File Metadata Path

- FileController depends on FileMetadataService.
- FileMetadataService depends on the repository layer.
- The repository layer reads and writes file metadata in PostgreSQL.

### File Object Path

- FileController depends on SupabaseStorageService for upload and delete operations.
- SupabaseStorageService depends on Supabase.

This means the file record is stored in PostgreSQL, while the object is stored in Supabase.

### Session Path

- AuthService depends on AuthSessionService and JwtService.
- AuthSessionService depends on PostgreSQL auth session data.
- Redis is used to speed up active-session checks.

### Realtime Path

- WebSocket controllers depend on the chat and presence services.
- Presence updates are broadcast through CoursePresenceBroadcaster.
- Chat state is kept in memory in CourseChatService.

## How to Read the Diagram

When reading [SWA_Module_View.png](SWA_Module_View.png), treat arrows as dependency relationships.

- An arrow from a controller to a service means the controller delegates behavior to that service.
- An arrow from a service to a repository means the service persists or reads data through that repository.
- An arrow from a service to Redis means the service uses the cache as part of its logic.
- An arrow from SupabaseStorageService to Supabase means file objects are stored or deleted externally.

## Why This View Matters

This view is the clearest place to understand how the code is divided.

It helps explain:

- where the responsibilities live
- which modules are coupled to each other
- where data is persisted
- where cache and external services are used
