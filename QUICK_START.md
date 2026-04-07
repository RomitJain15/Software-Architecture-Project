# Resource Sharing Platform - Quick Start Guide

## Prerequisites
- Docker and Docker Compose installed
- Node.js and npm installed
- Java 17+ (for backend development)

## Quick Start - Automated Setup

Run the automated startup script to launch everything at once:

```bash
./start.sh
```

This script will:
1. ✅ Check Docker installation
2. ✅ Start PostgreSQL and Redis containers via Docker Compose
3. ✅ Start the Spring Boot backend server (runs on port 8080)
4. ✅ Start the React frontend development server (runs on port 3000)
5. ✅ Enable realtime online-user updates on course pages through WebSockets

**Services will be available at:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Manual Setup (if needed)

### Step 1: Start Docker Containers
```bash
docker-compose up -d
```

### Step 2: Start Backend
```bash
cd backend
./mvnw spring-boot:run
```

### Step 3: Start Frontend
```bash
cd frontend
npm install  # Only needed first time
npm start
```

## Sign In

1. Open http://localhost:3000 in your browser
2. You should see the sign-in page
3. Use your registered credentials to sign in

Default test credentials (if seeded):
- Email: `admin@test.com`
- Password: `password`

## Realtime Course Presence

The course workspace shows the users who are currently logged in and enrolled in that course.

- Presence updates are pushed from the backend over a WebSocket connection.
- Logging out immediately removes the current session from the online list.
- The online users panel updates automatically without page refresh.

## Frontend Structure

```
frontend/
├── public/
│   └── index.html          # HTML entry point
├── src/
│   ├── pages/
│   │   ├── SignIn.jsx      # Sign-in page component
│   │   └── SignIn.css      # Sign-in page styles
│   ├── components/         # Reusable UI components
│   ├── services/           # API service calls
│   ├── App.jsx             # Main app component
│   ├── App.css             # App styles
│   ├── index.jsx           # React entry point
│   └── index.css           # Global styles
└── package.json            # Dependencies
```

## Stopping Services

Press `Ctrl+C` in the terminal running `./start.sh` to gracefully stop all services.

Or manually:
```bash
# Stop Docker containers
docker-compose down

# Stop backend (if running separately)
# Press Ctrl+C in the backend terminal

# Stop frontend (if running separately)
# Press Ctrl+C in the frontend terminal
```

## Backend API Endpoints

### Authentication
- `POST /api/auth/login` - Sign in
- `POST /api/auth/register` - Create new account
- `DELETE /api/auth/logout` - End the current login session

### Files
- `POST /api/files/upload` - Upload a file
- `GET /api/files` - List files for a course
- `DELETE /api/files/{id}` - Delete a file

### Ratings
- `POST /api/ratings` - Rate a file
- `GET /api/ratings/file/{fileId}` - Get all ratings for a file
- `GET /api/ratings/file/{fileId}/average` - Get average rating

### Presence
- `GET /api/courses/{courseId}/online-users` - List enrolled users with active sessions for a course

## Troubleshooting

### Port Already in Use
If ports 3000, 8080, 5432, or 6379 are already in use:
- Change the port in the start script or run services individually
- Stop other services using those ports

### Docker Issues
```bash
# Check running containers
docker ps

# View Docker logs
docker-compose logs

# Reset Docker (WARNING: removes data)
docker-compose down -v
```

### Frontend Dependencies Issue
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

For more details, see the main README in the project root.
