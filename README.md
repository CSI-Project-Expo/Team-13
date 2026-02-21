# Do4U Backend API

A production-ready FastAPI backend for the Do4U service marketplace application, built with Supabase integration.

## Tech Stack

- **FastAPI** - Modern, fast web framework for building APIs
- **Python 3.11+** - Programming language
- **Supabase** - PostgreSQL database + Authentication
- **SQLAlchemy** - Async ORM for database operations
- **asyncpg** - Async PostgreSQL driver
- **python-jose** - JWT verification
- **Pydantic v2** - Data validation and serialization
- **Uvicorn** - ASGI server

## Features

- ✅ Supabase JWT authentication
- ✅ Role-based authorization (user, genie, admin)
- ✅ Atomic job acceptance with database transactions
- ✅ Job lifecycle validation
- ✅ Wallet and escrow system
- ✅ AI-powered pricing recommendations
- ✅ Comprehensive error handling
- ✅ Modular architecture
- ✅ Production-ready configuration

## Project Structure

```
app/
├── main.py                 # FastAPI application entry point
├── database.py            # Database configuration and connection
├── core/
│   ├── config.py          # Pydantic settings and configuration
│   ├── auth.py            # JWT verification and authentication
│   └── roles.py           # Role-based authorization
├── models/                # SQLAlchemy models
│   ├── user.py
│   ├── genie.py
│   ├── job.py
│   ├── offer.py
│   ├── wallet.py
│   ├── rating.py
│   └── complaint.py
├── schemas/               # Pydantic schemas for API
│   ├── user.py
│   ├── job.py
│   ├── offer.py
│   ├── wallet.py
│   ├── rating.py
│   └── complaint.py
├── routes/                # API endpoints
│   ├── jobs.py
│   ├── offers.py
│   ├── wallet.py
│   └── admin.py
├── services/              # Business logic
│   ├── job_service.py
│   ├── atomic_job_service.py
│   ├── wallet_service.py
│   └── ai_pricing.py
└── utils/
    ├── exceptions.py      # Custom exceptions
    └── __init__.py
```

## Database Schema

The application uses the following tables (already created in Supabase):

- **users** - User accounts with roles
- **genies** - Genie profiles and skills
- **jobs** - Service marketplace jobs
- **offers** - Job offers from genies
- **wallet** - User wallet balances
- **ratings** - Job ratings and reviews
- **complaints** - User complaints

## Setup Instructions

### 1. Prerequisites

- Python 3.11 or higher
- Supabase project with database tables created
- Supabase JWT public key and service role key

### 2. Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql+asyncpg://[user]:[password]@[host]:[port]/[database]

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_PUBLIC_KEY=your-jwt-public-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# Application
DEBUG=false
SECRET_KEY=your-secret-key-here
```

### 3. Installation

```bash
# Clone the repository
git clone <repository-url>
cd Team-13

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Running the Application

```bash
# Development mode
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 5. API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication
All endpoints (except health checks) require Supabase JWT authentication via the `Authorization: Bearer <token>` header.

### Jobs API
- `POST /api/v1/jobs` - Create a new job (user only)
- `GET /api/v1/jobs/available` - Get available jobs (genie only)
- `GET /api/v1/jobs/my-jobs` - Get user's jobs
- `GET /api/v1/jobs/{job_id}` - Get job details
- `PUT /api/v1/jobs/{job_id}` - Update job (owner only)
- `DELETE /api/v1/jobs/{job_id}` - Delete job (owner only)
- `POST /api/v1/jobs/{job_id}/accept` - Accept a job (genie only)
- `POST /api/v1/jobs/{job_id}/start` - Start a job (genie only)
- `POST /api/v1/jobs/{job_id}/complete` - Complete a job (genie only)
- `GET /api/v1/jobs/{job_id}/price-estimate` - Get AI price estimate

### Offers API
- `POST /api/v1/offers` - Create an offer (genie only)
- `GET /api/v1/offers/job/{job_id}` - Get job offers (owner only)
- `GET /api/v1/offers/my-offers` - Get my offers (genie only)
- `PUT /api/v1/offers/{offer_id}` - Update offer (genie only)
- `DELETE /api/v1/offers/{offer_id}` - Delete offer (genie only)

### Wallet API
- `GET /api/v1/wallet` - Get wallet information
- `POST /api/v1/wallet/add-funds` - Add funds to wallet
- `POST /api/v1/wallet/withdraw` - Withdraw funds
- `POST /api/v1/wallet/transfer-to-escrow` - Transfer to escrow
- `POST /api/v1/wallet/release-from-escrow` - Release from escrow
- `GET /api/v1/wallet/balance` - Get simple balance info

### Admin API
- `GET /api/v1/admin/dashboard` - Admin dashboard
- `GET /api/v1/admin/users` - Get all users
- `PUT /api/v1/admin/users/{user_id}/role` - Update user role
- `GET /api/v1/admin/jobs` - Get all jobs
- `GET /api/v1/admin/complaints` - Get all complaints
- `PUT /api/v1/admin/complaints/{complaint_id}/resolve` - Resolve complaint
- `GET /api/v1/admin/financial-summary` - Financial summary

## Job Lifecycle

Jobs follow this strict lifecycle:
```
POSTED → ACCEPTED → IN_PROGRESS → COMPLETED
```

- **POSTED**: Job is available for genies to accept
- **ACCEPTED**: Genie has accepted the job
- **IN_PROGRESS**: Genie is working on the job
- **COMPLETED**: Job is finished and ready for payment

## Atomic Operations

Critical operations like job acceptance use database transactions with row locking to prevent race conditions:

```python
# Atomic job acceptance prevents multiple genies from accepting the same job
async def accept_job_atomically(job_id: UUID, genie_id: UUID) -> Job:
    async with self.db.begin():
        # Lock job row for update
        job = await self.db.execute(
            select(Job).options(with_for_update()).where(Job.id == job_id)
        )
        # Validate and update atomically
```

## AI Pricing Service

The application includes an AI-powered pricing service that provides intelligent price estimates based on:

- Job category detection
- Duration analysis
- Complexity factors
- Location-based pricing
- Market insights

## Error Handling

The application uses custom exceptions for better error handling:

```python
# Custom exceptions with proper HTTP status codes
class JobNotFoundError(NotFoundError):
    def __init__(self, message: str = "Job not found"):
        super().__init__(message)

class InvalidJobTransitionError(ValidationError):
    def __init__(self, message: str = "Invalid job status transition"):
        super().__init__(message)
```

## Development

### Code Formatting

```bash
# Format code
black app/
isort app/

# Type checking
mypy app/

# Linting
flake8 app/
```

### Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app
```

## Production Deployment

### Environment Setup
1. Set all required environment variables
2. Configure proper CORS origins
3. Set up proper logging
4. Configure database connection pooling

### Security Considerations
- Never expose secrets in code
- Use HTTPS in production
- Configure proper CORS policies
- Implement rate limiting
- Set up monitoring and alerting

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Use meaningful commit messages
5. Create pull requests for review

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.
