# HR Employee Self-Service Portal - Python Backend

Complete Python/FastAPI backend for the HR Employee Self-Service Portal with Replit Auth, PostgreSQL, OpenAI integration, and Google Cloud Storage.

## Quick Start

### Prerequisites
- Python 3.11 or higher
- PostgreSQL database
- Replit environment (for Auth and Object Storage)

### Installation

1. **Install Dependencies**
```bash
cd python_server
pip install -r requirements.txt
```

2. **Set Up Environment Variables**

Create a `.env` file in the `python_server` directory:

```bash
# Database Configuration (automatically provided by Replit)
DATABASE_URL=postgresql://user:password@host:port/dbname

# Replit Auth Configuration (automatically provided by Replit)
REPL_ID=your-repl-id
REPLIT_DOMAINS=your-repl-domain.replit.app
ISSUER_URL=https://replit.com/oidc

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Object Storage (set after creating bucket in Replit Object Storage)
PUBLIC_OBJECT_SEARCH_PATHS=/bucket-name/public
PRIVATE_OBJECT_DIR=/bucket-name/.private

# Session Configuration
SECRET_KEY=your-secret-key-here
```

3. **Initialize the Database**

The database tables will be created automatically when you first run the server. The application will:
- Create all necessary tables (users, sessions, leave_types, leaves, attendance_records, etc.)
- You'll need to add leave types and other initial data manually or via the API

4. **Run the Server**

```bash
python main.py
```

Or use the provided script:
```bash
./run.sh
```

The server will start on **http://0.0.0.0:5000**

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc

## Project Structure

```
python_server/
├── main.py                 # FastAPI application entry point
├── config.py               # Configuration management
├── database.py             # Database connection setup
├── models.py               # SQLAlchemy database models
├── storage.py              # Database storage layer (CRUD operations)
├── routes.py               # API route handlers
├── auth.py                 # Replit Auth (OIDC) integration
├── openai_service.py       # OpenAI GPT-4o integration for AI assistant
├── object_storage.py       # Google Cloud Storage integration
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
└── README.md               # This file
```

## Key Features

### Authentication
- **Replit Auth (OIDC)**: Secure authentication using OpenID Connect
- **Session Management**: PostgreSQL-backed sessions with automatic expiry
- **Token Refresh**: Automatic token refresh for long-running sessions

### Database
- **ORM**: SQLAlchemy 2.0 with PostgreSQL
- **Models**: User, LeaveType, LeaveBalance, Leave, AttendanceRecord, SalarySlip, HrDocument, AiConversation
- **Automatic Table Creation**: Tables created automatically on first run

### API Endpoints

#### Authentication
- `GET /api/auth/user` - Get current user information
- `GET /api/auth/login` - Initiate Replit Auth login
- `GET /api/auth/callback` - OAuth callback handler
- `GET /api/auth/logout` - Logout current user

#### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics (leaves, attendance, etc.)

#### Leave Management
- `GET /api/leave-types` - Get all leave types
- `GET /api/leave-balances` - Get leave balances for user
- `GET /api/leaves` - Get all leaves for user
- `POST /api/leaves` - Apply for new leave
- `PUT /api/leaves/{id}` - Update leave request
- `DELETE /api/leaves/{id}` - Delete leave request

#### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance/regularize` - Submit attendance regularization request

#### Salary
- `GET /api/salary` - Get salary slips
- `GET /api/salary/{id}/download` - Download salary slip PDF

#### Documents
- `GET /api/documents` - Get HR documents
- `GET /api/documents/upload-url` - Get presigned URL for uploading documents
- `POST /api/documents` - Save document metadata after upload

#### AI Assistant
- `POST /api/ai/ask` - Ask HR assistant a question
- `GET /api/ai/conversations` - Get conversation history

### External Integrations

#### OpenAI (GPT-4o)
- AI-powered HR assistant
- Document processing and vectorization
- Context-aware responses based on HR policies

#### Google Cloud Storage
- Presigned URL generation for secure uploads
- Public and private storage paths
- Document categorization and management

## Database Models

### User
- `id`: Primary key (from Replit Auth sub claim)
- `email`: User email
- `first_name`, `last_name`: User name
- `profile_image_url`: Profile picture URL
- `employee_id`: Employee ID number
- `department`: Department name
- `designation`: Job title
- `joining_date`: Date of joining

### LeaveType
- `id`: Auto-increment primary key
- `name`: Leave type name (e.g., "Casual Leave")
- `max_days`: Maximum days allowed per year
- `carry_forward`: Whether unused leaves can be carried forward

### Leave
- `id`: Auto-increment primary key
- `user_id`: Foreign key to User
- `leave_type_id`: Foreign key to LeaveType
- `from_date`, `to_date`: Leave period
- `days`: Number of days
- `reason`: Leave reason
- `status`: pending, approved, rejected, cancelled

### AttendanceRecord
- `id`: Auto-increment primary key
- `user_id`: Foreign key to User
- `date`: Attendance date
- `status`: present, absent, wfh, half_day, on_leave
- `check_in`, `check_out`: Time stamps
- `working_hours`: Calculated hours

### SalarySlip
- `id`: Auto-increment primary key
- `user_id`: Foreign key to User
- `month`, `year`: Salary period
- `basic_salary`, `hra`, `allowances`, `deductions`: Salary components
- `gross_salary`, `net_salary`: Calculated amounts
- `file_url`: PDF file URL

## Adding Initial Data

After the database is created, you'll need to add some initial data. You can use the FastAPI docs at `/docs` or create a simple script:

```python
# Example: Add leave types
import requests

# Make sure you're logged in first
leave_types = [
    {"name": "Casual Leave", "max_days": 12, "carry_forward": True},
    {"name": "Sick Leave", "max_days": 10, "carry_forward": False},
    {"name": "Earned Leave", "max_days": 20, "carry_forward": True},
    {"name": "Maternity Leave", "max_days": 180, "carry_forward": False},
]

# Note: You'll need to add these via database directly or create an admin endpoint
```

## Running with Frontend

To run the complete application (Python backend + React frontend):

1. Make sure the Python server is running on port 5000
2. The Vite dev server will proxy API requests to the Python backend
3. Frontend will be available at the Replit URL

## Troubleshooting

### Database Connection Issues
- Check `DATABASE_URL` environment variable
- Ensure PostgreSQL is running
- Verify connection string format

### Authentication Issues
- Verify `REPL_ID` and `REPLIT_DOMAINS` are set correctly
- Check that Replit Auth is enabled in your Repl
- Clear browser cookies and try again

### Object Storage Issues
- Ensure bucket is created in Replit Object Storage
- Set `PUBLIC_OBJECT_SEARCH_PATHS` and `PRIVATE_OBJECT_DIR` correctly
- Check sidecar endpoint is accessible at http://127.0.0.1:1106

### OpenAI Issues
- Verify `OPENAI_API_KEY` is set
- Check API key has sufficient credits
- Monitor rate limits

## Development

### Running in Development Mode

The server includes:
- Auto-reload on code changes (via Uvicorn `--reload`)
- CORS enabled for development
- Detailed error messages
- Request logging

### Adding New Endpoints

1. Define Pydantic models in `models.py`
2. Add storage methods in `storage.py`
3. Create route handlers in `routes.py`
4. Test using `/docs` interactive API

### Database Migrations

This project uses SQLAlchemy's automatic table creation. For production, consider using Alembic for migrations:

```bash
# Initialize Alembic (if needed)
alembic init alembic

# Create migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head
```

## Production Deployment

### Security Checklist
- [ ] Set strong `SECRET_KEY`
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS
- [ ] Set proper CORS origins
- [ ] Review and limit API rate limits
- [ ] Enable database backups
- [ ] Monitor logs and errors

### Performance Optimization
- Use connection pooling (already configured in SQLAlchemy)
- Enable caching for frequently accessed data
- Use CDN for static files
- Monitor and optimize slow queries

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
1. Check the `/docs` endpoint for API documentation
2. Review logs for error messages
3. Check Replit community forums for platform-specific issues
