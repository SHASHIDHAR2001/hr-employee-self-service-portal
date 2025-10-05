# HR Employee Self-Service Portal

## Overview

This is a comprehensive HR Employee Self-Service Portal built as a full-stack web application. The application enables employees to manage their HR-related tasks including leave applications, attendance tracking, salary slip access, and AI-powered HR assistance. It provides a modern, user-friendly interface for employees to handle routine HR operations without direct HR department intervention.

The system is designed with a clear separation between frontend and backend, using React for the client-side interface and Express.js for the server-side API. It integrates with external services for authentication, database management, AI capabilities, and cloud storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool and development server.

**UI Component Library**: shadcn/ui components built on top of Radix UI primitives, providing a comprehensive set of accessible, customizable UI components styled with Tailwind CSS.

**Routing**: wouter for client-side routing, providing a lightweight alternative to React Router.

**State Management**: @tanstack/react-query for server state management, handling data fetching, caching, and synchronization with the backend.

**Form Handling**: react-hook-form with zod for schema validation and @hookform/resolvers for integration between the two libraries.

**Styling**: Tailwind CSS with custom design tokens defined via CSS variables, supporting a "new-york" style theme with neutral base colors.

**Key Pages**:
- Dashboard: Overview of HR metrics and quick actions
- Leave Management: Apply, view, and correct leave requests
- Attendance: View records and regularize attendance
- Salary Slips: Access and download pay stubs
- AI Assistant: Chat interface for HR policy questions
- Documents: Upload and manage HR documents

### Backend Architecture

**Framework**: FastAPI running on Python 3.11 with SQLAlchemy ORM.

**API Design**: RESTful API architecture with routes organized by feature domain (leaves, attendance, salary, documents, AI assistant).

**Authentication**: Replit Auth using OpenID Connect (OIDC) with Authlib for session-based authentication.

**Session Management**: Starlette SessionMiddleware with PostgreSQL session store for persistent sessions across server restarts.

**Request/Response Flow**:
- JSON request/response bodies using Pydantic models
- Request logging middleware for API routes
- Automatic error handling with appropriate HTTP status codes
- CORS and security headers handled by middleware

**Storage Layer**: Abstracted through DatabaseStorage class in `python_server/storage.py`, providing clean separation between business logic and data access.

**Auto-Generated Documentation**: FastAPI provides interactive API documentation at `/docs` (Swagger UI) and `/redoc` (ReDoc).

### Database Architecture

**ORM**: SQLAlchemy with PostgreSQL dialect for type-safe database operations.

**Database Provider**: PostgreSQL via psycopg2-binary driver.

**Schema Design**:
- `users`: Employee profiles with Replit Auth integration (mandatory table)
- `sessions`: Session storage (mandatory for Replit Auth)
- `leaveTypes`: Configurable leave types with policies
- `leaveBalances`: Year-wise leave balance tracking per user
- `leaves`: Leave application records with status tracking
- `attendanceRecords`: Daily attendance tracking
- `salarySlips`: Monthly salary information
- `hrDocuments`: Document metadata and storage references
- `aiConversations`: Chat history with AI assistant

**Migration Strategy**: Alembic for schema migrations (optional), or automatic table creation via SQLAlchemy on startup.

### External Service Integrations

**Authentication Service**: Replit Auth (OIDC provider)
- Integration through Authlib library
- Session-based authentication with secure cookies
- User profile synchronization with local database

**AI Service**: OpenAI GPT-4o
- Integration in `python_server/openai_service.py`
- Document-based context retrieval for HR assistant
- Conversation history tracking for improved responses

**Object Storage**: Google Cloud Storage via Replit Object Storage
- Custom ACL (Access Control List) system for fine-grained permissions
- Presigned URL generation for secure file uploads
- File upload handled client-side via Uppy with AWS S3-compatible interface
- Document categorization and metadata management

**File Upload Flow**:
1. Client requests presigned URL from backend
2. Backend generates GCS presigned URL with appropriate ACL
3. Client uploads directly to GCS using Uppy
4. Client notifies backend of completed upload
5. Backend updates database with file metadata

### Development and Build Process

**Development Mode**: 
- Vite dev server with HMR (Hot Module Replacement) for frontend
- Python FastAPI server with auto-reload using Uvicorn
- Concurrent frontend and backend development
- Replit-specific plugins for enhanced development experience

**Production Build**:
- Frontend: Vite builds optimized React bundle to `dist/public`
- Backend: Python FastAPI server runs with Uvicorn in production mode
- Static file serving from built frontend assets

**Type Safety**: Pydantic models provide runtime validation and automatic API documentation in Python backend. Frontend uses TypeScript for compile-time type safety.

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL via psycopg2-binary
- **Authentication**: Replit Auth (OIDC provider accessed via Authlib)
- **Session Store**: Starlette SessionMiddleware

### Cloud Services
- **Object Storage**: Google Cloud Storage (google-cloud-storage) with Replit Object Storage sidecar
- **AI/ML**: OpenAI API (GPT-4o model via openai Python library)

### Frontend Libraries
- **UI Framework**: React 18+ with TypeScript
- **UI Components**: Radix UI primitives (@radix-ui/react-*)
- **Styling**: Tailwind CSS with class-variance-authority
- **State Management**: TanStack Query (React Query)
- **Form Handling**: react-hook-form with zod validation
- **File Upload**: Uppy (@uppy/core, @uppy/dashboard, @uppy/aws-s3, @uppy/react)
- **Routing**: wouter

### Backend Libraries (Python)
- **Web Framework**: FastAPI 0.118.0
- **ORM**: SQLAlchemy 2.0.43
- **Database Driver**: psycopg2-binary 2.9.10
- **Validation**: Pydantic 2.11.10
- **Authentication**: Authlib 1.6.5
- **HTTP Client**: httpx 0.28.1
- **File Upload**: python-multipart (for multipart form data)
- **AI Integration**: openai 2.1.0
- **Object Storage**: google-cloud-storage 3.4.0
- **Configuration**: pydantic-settings 2.11.0
- **Server**: Uvicorn 0.37.0

### Build Tools
- **Frontend Build**: Vite with React plugin
- **Backend Server**: Uvicorn ASGI server
- **TypeScript**: tsc for type checking (frontend only)
- **Database Migrations**: Alembic (optional), or automatic via SQLAlchemy

### Development Tools (Replit-specific)
- @replit/vite-plugin-runtime-error-modal
- @replit/vite-plugin-cartographer
- @replit/vite-plugin-dev-banner