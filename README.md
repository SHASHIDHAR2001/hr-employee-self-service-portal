# HR Employee Self-Service Portal - Python Backend

A comprehensive HR Employee Self-Service Portal with a **Python FastAPI backend** and React frontend. This application enables employees to manage leave applications, track attendance, access salary slips, and get AI-powered HR assistance.

## 🏗️ Architecture

### Backend (Python)
- **Framework**: FastAPI
- **ORM**: SQLAlchemy
- **Database**: PostgreSQL
- **Authentication**: Replit Auth (OIDC)
- **AI Integration**: OpenAI GPT-4o
- **Object Storage**: Google Cloud Storage
- **API Documentation**: Auto-generated Swagger UI at `/docs`

### Frontend (React)
- **Framework**: React 18 with TypeScript
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: wouter
- **Build Tool**: Vite

## 📋 Prerequisites

- Python 3.11 or higher
- PostgreSQL database
- Node.js 18+ (for frontend)
- OpenAI API key
- Replit account (for Auth and Object Storage)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd <your-project-directory>
```

### 2. Set Up Python Backend

#### Install Python Dependencies

```bash
cd python_server
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the `python_server` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Replit Auth Configuration
ISSUER_URL=https://replit.com/oidc
REPL_ID=your_repl_id
REPLIT_DOMAINS=your-domain.replit.app
SESSION_SECRET=your_session_secret_key

# Object Storage Configuration
PUBLIC_OBJECT_SEARCH_PATHS=/bucket-name/public
PRIVATE_OBJECT_DIR=/bucket-name/.private

# Server Configuration
PORT=5000
```

#### Run Database Migrations

The database tables will be automatically created when you start the server for the first time.

#### Start the Python Server

```bash
python main.py
```

Or use the provided script:

```bash
bash run.sh
```

The server will start on `http://0.0.0.0:5000`

### 3. Set Up Frontend (if running separately)

#### Install Frontend Dependencies

```bash
npm install
```

#### Start Frontend Development Server

```bash
npm run dev
```

## 📁 Project Structure

```
.
├── python_server/               # Python Backend
│   ├── main.py                 # FastAPI application entry point
│   ├── models.py               # SQLAlchemy database models
│   ├── database.py             # Database configuration
│   ├── storage.py              # Data access layer (CRUD operations)
│   ├── routes.py               # API route handlers
│   ├── auth.py                 # Authentication middleware
│   ├── openai_service.py       # OpenAI integration
│   ├── object_storage.py       # Google Cloud Storage integration
│   ├── config.py               # Application configuration
│   ├── requirements.txt        # Python dependencies
│   └── .env.example            # Environment variables template
│
├── client/                      # React Frontend
│   ├── src/
│   │   ├── pages/              # Page components
│   │   ├── components/         # Reusable UI components
│   │   ├── lib/                # Utilities and helpers
│   │   └── App.tsx             # Main application component
│   └── index.html
│
├── shared/                      # Shared TypeScript types (legacy)
│   └── schema.ts
│
└── README.md                    # This file
```

## 🔧 Python Server Components

### 1. Models (`models.py`)
Defines SQLAlchemy database models for:
- Users
- Leave Types & Balances
- Leaves
- Attendance Records
- Salary Slips
- HR Documents
- AI Conversations

### 2. Storage Layer (`storage.py`)
Implements data access patterns with methods for:
- User management
- Leave management (CRUD)
- Attendance tracking
- Salary slip retrieval
- HR document management
- AI conversation history

### 3. Routes (`routes.py`)
RESTful API endpoints:
- `/api/auth/*` - Authentication
- `/api/dashboard/stats` - Dashboard metrics
- `/api/leaves` - Leave management
- `/api/attendance` - Attendance tracking
- `/api/salary-slips` - Payroll information
- `/api/hr-documents` - Document management
- `/api/ai/*` - AI Assistant

### 4. Authentication (`auth.py`)
- Replit Auth (OIDC) integration
- Session-based authentication
- Token refresh logic
- User session management

### 5. OpenAI Integration (`openai_service.py`)
- HR Assistant chatbot using GPT-4o
- Document processing for vector search
- Context-aware responses

### 6. Object Storage (`object_storage.py`)
- Google Cloud Storage integration
- Signed URL generation
- Public/private file management

## 📡 API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:5000/docs`
- ReDoc: `http://localhost:5000/redoc`

### Key API Endpoints

#### Authentication
- `GET /api/auth/login` - Initiate login
- `GET /api/auth/callback` - OAuth callback
- `GET /api/auth/logout` - Logout
- `GET /api/auth/user` - Get current user

#### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

#### Leave Management
- `GET /api/leave-types` - List leave types
- `GET /api/leave-balances` - Get leave balances
- `POST /api/leaves` - Apply for leave
- `GET /api/leaves` - List user's leaves
- `PUT /api/leaves/{id}` - Update leave
- `DELETE /api/leaves/{id}` - Cancel leave

#### Attendance
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/absent-dates` - Get recent absences
- `POST /api/attendance/regularize` - Regularize attendance

#### Salary
- `GET /api/salary-slips` - List salary slips
- `GET /api/salary-slips/{month}/{year}` - Get specific slip

#### HR Documents
- `GET /api/hr-documents` - List documents
- `POST /api/hr-documents/upload` - Upload document
- `DELETE /api/hr-documents/{id}` - Delete document

#### AI Assistant
- `POST /api/ai/ask` - Ask HR question
- `GET /api/ai/conversations` - Get conversation history

## 🗃️ Database Schema

The application uses PostgreSQL with the following main tables:

- **users** - Employee information
- **sessions** - User sessions (required for Replit Auth)
- **leave_types** - Types of leaves (sick, casual, etc.)
- **leave_balances** - User leave balances per year
- **leaves** - Leave applications
- **attendance_records** - Daily attendance
- **salary_slips** - Monthly salary information
- **hr_documents** - Policy documents and files
- **ai_conversations** - AI chat history

## 🔐 Authentication Flow

1. User clicks "Login" → Redirected to `/api/auth/login`
2. FastAPI redirects to Replit Auth OIDC provider
3. User authenticates with Replit
4. Callback to `/api/auth/callback` with auth code
5. Exchange code for tokens
6. Store user session and sync to database
7. Redirect to dashboard

## 🤖 AI Assistant Features

The AI Assistant uses OpenAI's GPT-4o to answer HR questions based on uploaded company documents:

1. **Document Processing**: Uploaded documents are chunked and processed
2. **Context Building**: Relevant documents are included in prompts
3. **Q&A**: Employees ask questions, AI provides policy-based answers
4. **History**: All conversations are saved for reference

## 🌐 Deployment

### On Replit

1. Import the repository
2. Set up environment variables in Secrets
3. Provision a PostgreSQL database
4. Create an Object Storage bucket
5. Run the server: `python python_server/main.py`

### On Other Platforms

1. Set up a PostgreSQL database
2. Configure environment variables
3. Install dependencies: `pip install -r python_server/requirements.txt`
4. Run: `python python_server/main.py`
5. Use a process manager like `gunicorn` or `supervisor` for production

### Production Considerations

- Use `gunicorn` with multiple workers:
  ```bash
  gunicorn -w 4 -k uvicorn.workers.UvicornWorker python_server.main:app
  ```
- Enable HTTPS
- Set strong `SESSION_SECRET`
- Configure CORS properly
- Use environment-specific `.env` files
- Set up database backups
- Monitor with tools like Sentry

## 🛠️ Development

### Running in Development Mode

The server supports hot-reload with:

```bash
cd python_server
uvicorn main:app --reload --host 0.0.0.0 --port 5000
```

### Database Migrations

This application uses SQLAlchemy. For migrations:

1. Install Alembic: `pip install alembic`
2. Initialize: `alembic init migrations`
3. Configure `alembic.ini` with your DATABASE_URL
4. Create migration: `alembic revision --autogenerate -m "description"`
5. Apply: `alembic upgrade head`

### Testing

Create a `tests/` directory and use `pytest`:

```bash
pip install pytest pytest-asyncio httpx
pytest
```

## 📝 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI assistant | Yes |
| `ISSUER_URL` | OIDC issuer URL | Yes |
| `REPL_ID` | Replit application ID | Yes |
| `REPLIT_DOMAINS` | Comma-separated allowed domains | Yes |
| `SESSION_SECRET` | Secret key for session encryption | Yes |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Object storage public paths | Yes* |
| `PRIVATE_OBJECT_DIR` | Object storage private directory | Yes* |
| `PORT` | Server port (default: 5000) | No |

\* Required if using object storage features

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check DATABASE_URL format
# Should be: postgresql://user:password@host:port/database
```

### OIDC Authentication Fails
```bash
# Verify ISSUER_URL, REPL_ID, and REPLIT_DOMAINS
# Ensure callback URL matches: https://{REPLIT_DOMAIN}/api/auth/callback
```

### OpenAI API Errors
```bash
# Verify OPENAI_API_KEY is set and valid
# Check API usage limits and billing
```

### Module Import Errors
```bash
# Ensure all dependencies are installed
pip install -r requirements.txt
```

## 📄 License

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Python FastAPI and React
