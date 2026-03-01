# Do4U (Team-13)

Full-stack service marketplace project with a FastAPI backend and a React + Vite frontend.

## Tech Stack

### Backend
- **FastAPI**: REST API framework and interactive docs (`/docs`)
- **SQLAlchemy (Async) + asyncpg**: async ORM and PostgreSQL driver
- **Supabase**: authentication (JWT) and managed PostgreSQL
- **Pydantic v2**: request/response validation and settings management
- **Uvicorn**: ASGI server for local development and deployment

### Frontend
- **React 19**: component-based UI
- **Vite**: fast dev server and production build tooling
- **React Router**: client-side routing and protected pages
- **Supabase JS**: auth session handling in the browser
- **Fetch API wrapper**: centralized API calls with token + 401 handling

## Features

- Supabase authentication with JWT-based API authorization
- Role-based flows for user, genie, and admin
- Job lifecycle management: `POSTED → ACCEPTED → IN_PROGRESS → COMPLETED`
- Atomic job acceptance/start/complete operations to reduce race conditions
- Wallet + escrow transfers for job payment handling
- AI-assisted job pricing estimates
- Real-time in-job chat via WebSocket with REST message fallback
- Live genie location updates during jobs
- Notification center with mark-read and mark-all-read support
- Genie verification workflow (apply, admin approve/reject)
- Admin dashboards for users, jobs, complaints, and financial summary
- File upload/serving support for genie verification documents

## Project Structure

```
Team-13/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── utils/
│   ├── requirements.txt
│   ├── create_tables.py
│   └── test_login.py
└── frontend/
    ├── src/
    ├── package.json
    └── vite.config.js
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm
- Supabase project (URL + anon key + service key)
- PostgreSQL connection string for Supabase database

## Environment Variables

Create two environment files:

### 1) `backend/.env`

```env
# Database
DATABASE_URL=postgresql+asyncpg://<user>:<password>@<host>:<port>/<database>

# Supabase
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_KEY=<your-service-role-key>

# App
DEBUG=false
SECRET_KEY=<optional-secret>

# Optional local test credentials
TEST_EMAIL=<optional>
TEST_PASSWORD=<optional>
```

### 2) `frontend/.env`

```env
VITE_BACKEND_URL=http://localhost:8000
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

## Setup & Run

### Backend

```bash
cd backend

# create venv (Windows)
python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt

# run API
uvicorn app.main:app --reload
```

Backend docs and health:
- Swagger: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health: http://localhost:8000/health

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on Vite default port (typically http://localhost:5173).

## Authentication

- Backend validates Supabase JWTs using Supabase JWKS.
- Most REST endpoints require `Authorization: Bearer <token>`.
- Frontend stores Supabase access token and attaches it to API calls.

## API Overview (current)

Base URL: `http://localhost:8000`

### Users (`/api/v1/users`)
- `GET /me`
- `PATCH /me`
- `POST /verification/apply`

### Jobs (`/api/v1/jobs`)
- `POST /`
- `GET /available`
- `GET /my-jobs`
- `GET /{job_id}`
- `PUT /{job_id}`
- `DELETE /{job_id}`
- `PATCH /{job_id}/accept`
- `POST /{job_id}/start`
- `POST /{job_id}/complete`
- `POST /{job_id}/cancel-assignment`
- `GET /{job_id}/price-estimate`
- `POST /price-estimate`
- `POST /{job_id}/rate-user`

### Location (`/api/v1/jobs`)
- `POST /{job_id}/location`
- `GET /{job_id}/location`

### Offers (`/api/v1/offers`)
- `POST /`
- `GET /job/{job_id}`
- `GET /my-offers`
- `PUT /{offer_id}`
- `DELETE /{offer_id}`

### Wallet (`/api/v1/wallet`)
- `GET /`
- `POST /add-funds`
- `POST /withdraw`
- `POST /transfer-to-escrow`
- `POST /release-from-escrow`
- `GET /balance`

### Notifications (`/api/v1/notifications`)
- `GET /`
- `PATCH /{notification_id}/read`
- `PATCH /read-all`

### Admin (`/api/v1/admin`)
- `GET /verifications/pending`
- `POST /verifications/{genie_user_id}/approve`
- `POST /verifications/{genie_user_id}/reject`
- `GET /dashboard`
- `GET /users`
- `GET /users/{user_id}`
- `PUT /users/{user_id}/role`
- `GET /jobs`
- `GET /complaints`
- `PUT /complaints/{complaint_id}/resolve`
- `GET /financial-summary`

### Chat
- WebSocket: `ws://localhost:8000/api/v1/chat/ws/{job_id}?token=<jwt>`
- REST fallback: `GET /api/v1/chat/{job_id}/messages`

## Job Lifecycle

The core job status flow is:

```
POSTED → ACCEPTED → IN_PROGRESS → COMPLETED
```

## Notes

- Backend serves uploaded files from `/uploads`.
- On startup, backend runs lightweight DB initialization/migrations needed by current features.
- Keep CORS restricted in production (it is permissive in local development).
