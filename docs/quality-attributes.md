# Quality Attributes

## Purpose

This document explains which quality attributes the Resource Sharing Platform emphasizes, how the system was built to support them, and why these attributes were prioritized.

The emphasis comes from the project goal: a collaborative academic platform must stay easy to use, responsive under concurrent usage, and observable enough to evaluate its runtime behavior.

## Primary Quality Attributes

### 1. Usability

Usability is a central goal because the system is meant to support everyday student workflows such as signing in, joining a course, uploading notes, viewing resources, rating files, and chatting with peers.

How it is achieved:

- React is used for a structured single-page interface.
- The frontend is organized into pages and course-specific screens.
- Navigation is focused around course participation rather than exposing the user to technical system details.
- Login, course access, file actions, ratings, and presence information are grouped around the student workflow.

Why it matters:

- Students should be able to share and discover resources quickly.
- A simple interface lowers the effort needed to use the platform repeatedly.
- The project is intended to behave like the digital version of sharing notes and discussing questions in class.

### 2. Performance

Performance is important because the system must remain responsive while multiple users access the same course resources and realtime presence information.

How it is achieved:

- Redis is used for hot runtime data such as active session checks and recently used file metadata.
- PostgreSQL remains the source of truth, while Redis reduces repeated lookup cost for frequently accessed data.
- File metadata is separated from file objects, so the backend does not store large binary content in the database.
- Realtime communication uses WebSocket/STOMP rather than polling.
- Presence and chat state are kept lightweight during runtime.

Why it matters:

- Repeated dashboard and course interactions should stay fast.
- File lists, ratings, and online presence are common access paths and benefit from caching.
- The project is meant to show low response times under concurrent usage, not just basic correctness.

### 3. Observability

Observability is a major goal because the project is intended for architectural evaluation, not just feature delivery.

How it is achieved:

- Spring Boot Actuator exposes runtime metrics.
- Micrometer integrates application metrics with the backend.
- Prometheus collects the metrics.
- Grafana visualizes them.
- The architecture documents separate business logic, cache, data, and monitoring concerns so the runtime behavior is easier to reason about.

Why it matters:

- The system should make its behavior visible during multi-user access.
- Metrics help evaluate latency, usage, and overall runtime health.
- Observability supports comparison of design trade-offs rather than hiding them.

### 4. Maintainability

Maintainability is important because the project is structured as a teaching and evaluation artifact.

How it is achieved:

- The system uses a layered design.
- Controllers, services, repositories, cache usage, and external integrations are separated.
- File metadata and file object storage are kept in different components.
- Documentation is split into architecture, module, allocation, component-and-connector, rationale, and quality-attributes views.

Why it matters:

- Clear separation makes the system easier to extend and explain.
- Each concern can be changed with less impact on the rest of the codebase.
- The project is easier to review as an architecture case study when responsibilities are explicit.

### 5. Reliability

Reliability matters because the platform must support login sessions, enrollment-based access control, and realtime collaboration without inconsistent behavior.

How it is achieved:

- JWT validation is combined with server-tracked session state.
- Logout revokes the active session immediately.
- PostgreSQL stores durable application data.
- File uploads and deletes are coordinated through metadata and storage operations.
- Presence and chat are bounded by runtime session behavior.

Why it matters:

- Users should not keep access after logout.
- Course content and ratings must remain consistent.
- The system should behave predictably under active use.

### 6. Security

Security is important because the platform manages user accounts, course access, and private course resources.

How it is achieved:

- Spring Security protects non-auth endpoints.
- JWTs are used for authenticated requests.
- The backend validates active sessions before allowing protected access.
- Role checks are used for admin-only actions.
- WebSocket connections are also validated through token-based handshake logic.

Why it matters:

- Course resources should only be available to authorized users.
- Admin operations must be restricted.
- Session revocation must take effect immediately when users log out.

## Why These Attributes Were Chosen

The abstract for this project emphasizes three main ideas: collaborative content sharing, low response times under concurrent use, and transparent insight into system behavior.

That makes usability, performance, and observability the most important quality attributes.

The other attributes support those main goals:

- maintainability keeps the architecture understandable and extensible
- reliability keeps login, access control, and resource sharing consistent
- security protects private course content and session-based access

## Architectural Tactics

The project uses a small set of architectural tactics to support the quality attributes above.

### Usability Tactics

- A course-centered single-page frontend reduces navigation overhead.
- Clear page boundaries for sign-in, profile, dashboard, and course workspace keep the user journey predictable.
- Realtime presence indicators and chat give immediate feedback without forcing page refreshes.

### Performance Tactics

- Redis caching reduces repeated reads for active sessions and recent file metadata.
- PostgreSQL remains the system of record so cached data can be refreshed from a stable source.
- File metadata is separated from file objects, which keeps large binary content out of the database path.
- WebSocket/STOMP is used for realtime updates instead of polling.

### Observability Tactics

- Actuator exposes runtime metrics from the backend.
- Micrometer provides the metric bridge used by the backend.
- Prometheus scrapes metrics at a steady interval.
- Grafana visualizes the collected data for analysis.

### Reliability Tactics

- Server-tracked sessions allow immediate logout and revocation.
- JWTs are validated together with active session state.
- PostgreSQL stores durable entities, reducing the risk of losing critical application data.
- Realtime features are kept session-bound, which limits long-lived state drift.

### Security Tactics

- Spring Security guards protected endpoints.
- Role-based checks restrict admin actions.
- WebSocket handshake validation uses the same token-based identity model as REST requests.
- Session revocation is enforced at the backend rather than relying only on the client.

### Maintainability Tactics

- Layered separation keeps controllers, services, repositories, cache, and external integrations distinct.
- File metadata and file storage are handled by different components.
- Documentation is split into focused views so each concern can be explained independently.

## Attribute-to-Implementation Summary

| Quality attribute | Main implementation choices |
| --- | --- |
| Usability | React SPA, course-centered screens, simple navigation |
| Performance | Redis caching, WebSocket/STOMP, split metadata/object storage |
| Observability | Actuator, Micrometer, Prometheus, Grafana |
| Maintainability | Layered architecture, separated responsibilities, modular docs |
| Reliability | PostgreSQL persistence, server-tracked sessions, controlled logout |
| Security | Spring Security, JWT, role checks, WS token validation |

## Summary

The project is intentionally designed to balance user experience, responsiveness, and system visibility.

Those quality attributes were chosen because they match the use case of a real-time academic resource-sharing platform and because they make the system suitable for architectural analysis.
