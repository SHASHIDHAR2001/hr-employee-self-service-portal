# HR Employee Self-Service Portal - Python Backend Setup

This guide explains how to run the HR portal with the **Python/FastAPI backend** instead of the TypeScript/Express backend.

## 🚀 Quick Start - Run Python Backend

### Step 1: Install Python Dependencies

```bash
cd python_server
pip install -r requirements.txt
```

### Step 2: Initialize the Database

This creates all tables and adds sample leave types:

```bash
cd python_server
python init_db.py
```

### Step 3: Start the Python Server

```bash
cd python_server
python main.py
```

The server will start on **http://0.0.0.0:5000**

### Step 4: Access the Application

- **Application**: Open your Replit URL (the server serves both API and frontend)
- **API Docs**: Visit `/docs` for interactive Swagger documentation
- **API ReDoc**: Visit `/redoc` for alternative documentation

## 📁 What's Included

The complete Python backend is in the `python_server/` directory:

```
python_server/
├── README.md              # Detailed Python backend documentation
├── main.py                # FastAPI application (starts here!)
├── config.py              # Settings and configuration
├── database.py            # Database connection setup
├── models.py              # SQLAlchemy database models
├── storage.py             # Database CRUD operations
├── routes.py              # All API endpoints
├── auth.py                # Replit Auth (OIDC) integration
├── openai_service.py      # AI assistant integration
├── object_storage.py      # Google Cloud Storage
├── init_db.py             # Database initialization script
├── requirements.txt       # Python dependencies
└── .env.example           # Environment variables template
```

## 🔧 Environment Configuration

The Python server uses these environment variables (automatically provided by Replit):

```bash
# Database (auto-configured)
DATABASE_URL=postgresql://...

# Replit Auth (auto-configured)
REPL_ID=your-repl-id
REPLIT_DOMAINS=your-domain.replit.app
ISSUER_URL=https://replit.com/oidc

# OpenAI API
OPENAI_API_KEY=your-key-here

# Object Storage (after creating bucket)
PUBLIC_OBJECT_SEARCH_PATHS=/bucket/public
PRIVATE_OBJECT_DIR=/bucket/.private

# Session Secret
SECRET_KEY=your-secret-key
```

## ✅ Features Implemented

### Authentication
- ✅ Replit Auth (OpenID Connect)
- ✅ Session management with PostgreSQL
- ✅ Automatic token refresh
- ✅ User profile synchronization

### Leave Management
- ✅ View leave types
- ✅ Apply for leave
- ✅ Check leave balance
- ✅ Leave history and status tracking
- ✅ Leave request corrections

### Attendance
- ✅ View attendance records
- ✅ Attendance regularization
- ✅ Monthly attendance summary

### Salary
- ✅ View salary slips
- ✅ Download salary PDFs
- ✅ Salary components breakdown

### AI Assistant
- ✅ GPT-4o powered HR assistant
- ✅ Conversation history
- ✅ Document context awareness

### Documents
- ✅ Upload HR documents
- ✅ View document library
- ✅ Secure cloud storage (Google Cloud)

## 🔍 Testing the Leave Feature

After starting the server, test the leave functionality:

### 1. Check Leave Types

```bash
# The init_db.py script adds these leave types:
# - Casual Leave (12 days)
# - Sick Leave (10 days)
# - Earned Leave (20 days)
# - Maternity Leave (180 days)
# - Paternity Leave (15 days)
# - Compensatory Off (12 days)
```

### 2. Test the API

Visit `http://localhost:5000/docs` and try:

1. **GET /api/leave-types** - Should return all 6 leave types
2. **GET /api/leave-balances** - Your leave balances for current year
3. **POST /api/leaves** - Apply for a leave
4. **GET /api/leaves** - View your leave requests

### 3. Test from Frontend

1. Login via Replit Auth
2. Go to "Apply Leave" page
3. Leave type dropdown should show all 6 types
4. Fill the form and submit
5. Check "Leave Summary" to see your request

## 🐛 Troubleshooting

### Leave Types Not Showing?

1. **Check database initialization**:
```bash
cd python_server
python init_db.py
```

2. **Verify via API docs**:
Visit `/docs` and call GET `/api/leave-types`

3. **Check server logs**:
Look for any errors in the terminal where Python server is running

### Leave Submission Not Working?

1. **Check browser console** for errors
2. **Verify authentication** - Make sure you're logged in
3. **Check API docs** - Test POST `/api/leaves` endpoint directly
4. **Review server logs** for error messages

### Database Issues?

```bash
# Reset database (WARNING: Deletes all data!)
cd python_server
python -c "from database import Base, engine; Base.metadata.drop_all(engine); Base.metadata.create_all(engine)"
python init_db.py
```

### Object Storage Issues?

1. Create a bucket in Replit's "Object Storage" tool
2. Set environment variables:
```bash
PUBLIC_OBJECT_SEARCH_PATHS=/your-bucket-name/public
PRIVATE_OBJECT_DIR=/your-bucket-name/.private
```

## 📊 API Endpoints Overview

### Leave Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leave-types` | Get all leave types |
| GET | `/api/leave-balances` | Get user's leave balances |
| GET | `/api/leaves` | Get user's leave requests |
| POST | `/api/leaves` | Apply for new leave |
| PUT | `/api/leaves/{id}` | Update leave request |
| DELETE | `/api/leaves/{id}` | Cancel leave request |

### Other Endpoints

| Category | Endpoints |
|----------|-----------|
| Auth | `/api/auth/user`, `/api/auth/login`, `/api/auth/callback`, `/api/auth/logout` |
| Dashboard | `/api/dashboard/stats` |
| Attendance | `/api/attendance`, `/api/attendance/regularize` |
| Salary | `/api/salary`, `/api/salary/{id}/download` |
| Documents | `/api/documents`, `/api/documents/upload-url` |
| AI | `/api/ai/ask`, `/api/ai/conversations` |

## 🚢 Deployment to GitHub

The Python backend is ready for GitHub deployment:

1. **Push to GitHub**:
```bash
git add python_server/
git commit -m "Add complete Python/FastAPI backend"
git push origin main
```

2. **Deploy anywhere** that supports Python 3.11+:
- Replit (already configured!)
- Heroku
- Railway
- Google Cloud Run
- AWS Lambda
- DigitalOcean App Platform

3. **Requirements**:
- Python 3.11+
- PostgreSQL database
- Environment variables configured

## 📚 Further Documentation

- **Python Backend Details**: See `python_server/README.md`
- **API Documentation**: Visit `/docs` when server is running
- **Database Models**: Check `python_server/models.py`
- **API Routes**: See `python_server/routes.py`

## 💡 Key Differences from TypeScript Backend

| Feature | TypeScript/Express | Python/FastAPI |
|---------|-------------------|----------------|
| Runtime | Node.js | Python 3.11 |
| Framework | Express.js | FastAPI |
| ORM | Drizzle | SQLAlchemy |
| Auth | Passport.js | Authlib |
| API Docs | Manual | Auto-generated |
| Type Safety | TypeScript | Pydantic |
| Performance | Fast | Very Fast |
| Learning Curve | Medium | Easy |

## 🎯 Next Steps

1. ✅ Start Python server: `cd python_server && python main.py`
2. ✅ Initialize database: `python init_db.py`
3. ✅ Test API: Visit `/docs`
4. ✅ Login and test leave management
5. ✅ Explore other features

---

**Need Help?** Check the detailed README in `python_server/README.md` or visit the `/docs` endpoint for interactive API testing.
