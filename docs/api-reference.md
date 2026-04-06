# API Reference

Base URL (local): http://localhost:8080

Authentication:

- JWT bearer token required for all non-auth endpoints
- Add header Authorization: Bearer <token>
- Login sessions are tracked server-side; logout revokes the current session immediately

## Auth

### POST /api/auth/register

Registers a new user.

Request body fields:

- name
- email
- password

Response body:

- token
- user object:
	- id
	- fullName
	- email
	- role
	- createdAt

### POST /api/auth/login

Authenticates a user.

Request body fields:

- email
- password

Response body:

- token
- user object:
	- id
	- fullName
	- email
	- role
	- createdAt

### DELETE /api/auth/logout

Revokes the current login session.

Headers:

- Authorization: Bearer <token>

## Admin

### GET /api/admin/users

Returns a list of users.

Response item fields:

- id
- fullName
- email
- role (ADMIN or STUDENT)

### PATCH /api/admin/users/{id}/role

Updates a user's role.

Request body fields:

- role (ADMIN or STUDENT)

## Courses

### POST /api/courses

Creates a course. Admin only.

Request body uses Course fields:

- name
- description
- courseCode

### GET /api/courses

Lists all courses.

### GET /api/courses/{id}

Gets one course by id.

### PUT /api/courses/{id}

Updates a course. Admin only.

Request body uses Course fields:

- name
- description
- courseCode

### DELETE /api/courses/{id}

Deletes a course. Admin only.

### GET /api/courses/{courseId}/online-users

Returns the users who are enrolled in the course and currently have an active login session.

Response item fields:

- id
- fullName
- role

## Realtime Presence

The frontend subscribes to the following WebSocket topic to receive live updates for a course:

- `/topic/courses/{courseId}/online-users`

The backend sends updated course presence whenever a user logs in, logs out, enrolls, or unenrolls.

## Enrollments

### POST /api/enrollments

Creates an enrollment for the authenticated user, or for a specified user when caller has admin role.

Request body fields:

- userId (optional)
- courseId (required)

Response body fields:

- id
- userId
- courseId

### GET /api/enrollments

Lists enrollments.

Query params:

- userId (optional)
- courseId (optional)

Behavior:

- Non-admin users are limited to their own enrollments.
- Admin users can filter by userId or courseId, or list all.

### GET /api/enrollments/{id}

Gets an enrollment by id.

### DELETE /api/enrollments/{id}

Deletes an enrollment by id.

## Files

### POST /api/files/upload

Uploads a file with multipart form-data.

Form fields:

- courseId (request parameter)
- file (multipart part named file)

Rules:

- Caller must be authenticated.
- Caller must be ADMIN or enrolled in the course.

Response body fields:

- id
- fileName
- fileUrl
- fileType
- fileSize
- objectPath
- courseId
- uploadedBy
- uploadedAt

### GET /api/files

Lists files for a course.

Query params:

- courseId (required)

Response: array of FileMetadataResponse items.

### DELETE /api/files/{id}

Deletes file metadata and storage object.

Rules:

- Caller must be authenticated.
- Caller must be ADMIN or the original uploader.

## Ratings

Base route: /api/files/{fileId}/ratings

### POST /api/files/{fileId}/ratings

Creates or updates a rating.

Request body fields:

- userId (optional)
- value (required, 1 to 5)

Response body fields:

- id
- userId
- fileId
- value
- ratedAt

### GET /api/files/{fileId}/ratings

Lists ratings for a file.

### GET /api/files/{fileId}/ratings/average

Gets average rating summary.

Response body fields:

- fileId
- count
- average

### DELETE /api/files/{fileId}/ratings

Deletes a user's rating for the file.

Query params:

- userId (optional)

## Error Responses

Errors are standardized through GlobalExceptionHandler and ApiErrorResponse.

Error response fields:

- timestamp
- status
- error
- message
- path
- validationErrors

## Actuator and Metrics

Public actuator endpoints configured:

- GET /actuator/health
- GET /actuator/prometheus



