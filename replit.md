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

**Framework**: Express.js running on Node.js with TypeScript.

**API Design**: RESTful API architecture with routes organized by feature domain (leaves, attendance, salary, documents, AI assistant).

**Authentication**: Replit Auth using OpenID Connect (OIDC) with Passport.js strategy for session-based authentication.

**Session Management**: express-session with PostgreSQL session store (connect-pg-simple) for persistent sessions across server restarts.

**Request/Response Flow**:
- JSON request/response bodies
- Request logging middleware for API routes
- Error handling with appropriate HTTP status codes
- CORS and security headers handled by middleware

**Storage Layer**: Abstracted through an IStorage interface in `server/storage.ts`, providing clean separation between business logic and data access.

### Database Architecture

**ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations.

**Database Provider**: Neon Serverless PostgreSQL via @neondatabase/serverless with WebSocket support.

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

**Migration Strategy**: Drizzle Kit for schema migrations with migrations stored in `/migrations` directory.

### External Service Integrations

**Authentication Service**: Replit Auth (OIDC provider)
- Integration through openid-client library
- Session-based authentication with secure cookies
- User profile synchronization with local database

**AI Service**: OpenAI GPT-4o
- Integration in `server/openai.ts`
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
- Vite dev server with HMR (Hot Module Replacement)
- Express server runs backend API
- Concurrent frontend and backend development
- Replit-specific plugins for enhanced development experience

**Production Build**:
- Frontend: Vite builds optimized React bundle to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- Static file serving from built frontend assets

**Type Safety**: Shared TypeScript types between frontend and backend via `shared/schema.ts` using Drizzle Zod schemas.

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL via Neon Serverless (@neondatabase/serverless)
- **Authentication**: Replit Auth (OIDC provider accessed via openid-client)
- **Session Store**: PostgreSQL (connect-pg-simple)

### Cloud Services
- **Object Storage**: Google Cloud Storage (@google-cloud/storage) with Replit Object Storage sidecar
- **AI/ML**: OpenAI API (GPT-4o model)

### Frontend Libraries
- **UI Framework**: React 18+ with TypeScript
- **UI Components**: Radix UI primitives (@radix-ui/react-*)
- **Styling**: Tailwind CSS with class-variance-authority
- **State Management**: TanStack Query (React Query)
- **Form Handling**: react-hook-form with zod validation
- **File Upload**: Uppy (@uppy/core, @uppy/dashboard, @uppy/aws-s3, @uppy/react)
- **Routing**: wouter

### Backend Libraries
- **Web Framework**: Express.js
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Authentication**: Passport.js with openid-client
- **File Upload**: multer (for temporary file handling)
- **Utilities**: memoizee (for caching OIDC configuration)

### Build Tools
- **Frontend Build**: Vite with React plugin
- **Backend Build**: esbuild
- **TypeScript**: tsc for type checking
- **Database Migrations**: Drizzle Kit

### Development Tools (Replit-specific)
- @replit/vite-plugin-runtime-error-modal
- @replit/vite-plugin-cartographer
- @replit/vite-plugin-dev-banner