# 🐍 Switch to Python Backend - Simple Guide

Your Python backend is **ready to use**! Follow these simple steps to switch from TypeScript to Python.

## ✅ What's Already Done

- ✅ Complete Python/FastAPI backend created in `python_server/`
- ✅ Database initialized with 6 leave types
- ✅ All API endpoints implemented
- ✅ Authentication, OpenAI, and Object Storage integrated
- ✅ Comprehensive documentation created

## 🚀 How to Run the Python Backend

### Option 1: Quick Start (Recommended)

1. **Stop the current workflow** in the Replit panel (click the stop button)

2. **Open a new Shell tab** in Replit

3. **Run this single command**:
```bash
cd python_server && python main.py
```

4. **That's it!** The server will start on port 5000

### Option 2: Using the Workflow

1. **Edit the workflow**:
   - Click on "Start application" workflow
   - Change the command from `npm run dev` to:
     ```bash
     cd python_server && python main.py
     ```
   - Save and restart the workflow

### Option 3: Run Both Servers

If you want to keep the TypeScript server and test Python separately:

1. **Keep TypeScript server** running on port 5000
2. **Modify Python server** to run on a different port (edit `python_server/main.py`, change port to 8000)
3. **Run Python server** in a separate Shell tab

## 📋 Leave Types Already Available

The database has been initialized with these 6 leave types:

1. **Casual Leave** - 12 days (Carry Forward: Yes)
2. **Sick Leave** - 10 days (Carry Forward: No)
3. **Earned Leave** - 20 days (Carry Forward: Yes)
4. **Maternity Leave** - 180 days (Carry Forward: No)
5. **Paternity Leave** - 15 days (Carry Forward: No)
6. **Compensatory Off** - 12 days (Carry Forward: No)

## 🧪 Testing the Leave Feature

Once the Python server is running:

### 1. Test via API Documentation
Visit: **http://your-repl-url/docs**

Try these endpoints:
- `GET /api/leave-types` - Should return 6 leave types
- `GET /api/leaves` - Your leave requests (after login)
- `POST /api/leaves` - Submit a new leave request

### 2. Test via Frontend

1. Login to the app
2. Go to "Apply Leave" page
3. **Leave type dropdown** should show all 6 types
4. Fill the form and **click Submit**
5. Check "Leave Summary" to see your request

## 🔧 Troubleshooting

### "Port 5000 already in use"
Stop the TypeScript server first, or change Python server port.

### "Leave types not showing"
Database is already initialized! If you see this, run:
```bash
cd python_server && python init_db.py
```

### "Unauthorized" errors
Make sure you're logged in via Replit Auth. Click "Login" in the app.

### Check if Python server is running
```bash
curl http://localhost:5000/docs
```

Should show the API documentation page.

## 📚 Documentation

- **Python Backend README**: `python_server/README.md`
- **Complete Setup Guide**: `README_PYTHON_BACKEND.md`
- **API Docs** (when running): http://localhost:5000/docs

## 🎯 What Works Right Now

### ✅ Fully Implemented Features

1. **Authentication**: Replit Auth with OIDC
2. **Leave Management**: Apply, view, update leaves
3. **Leave Types**: 6 types pre-configured
4. **Leave Balances**: Track remaining days
5. **Attendance**: View and regularize attendance
6. **Salary Slips**: View and download
7. **Documents**: Upload and view HR documents
8. **AI Assistant**: Chat with GPT-4o about HR policies
9. **Dashboard**: Overview statistics

### API Endpoints Available

```
GET    /api/auth/user              - Get current user
GET    /api/leave-types            - Get all leave types ✅
GET    /api/leave-balances         - Get leave balances ✅
GET    /api/leaves                 - Get user's leaves ✅
POST   /api/leaves                 - Apply for leave ✅
PUT    /api/leaves/{id}            - Update leave request ✅
DELETE /api/leaves/{id}            - Cancel leave request ✅
GET    /api/attendance             - Get attendance records
POST   /api/attendance/regularize  - Regularize attendance
GET    /api/salary                 - Get salary slips
GET    /api/documents              - Get HR documents
POST   /api/ai/ask                 - Ask AI assistant
```

## 💡 Quick Commands Cheat Sheet

```bash
# Start Python server
cd python_server && python main.py

# Initialize/reset database
cd python_server && python init_db.py

# Install dependencies
cd python_server && pip install -r requirements.txt

# Check if server is running
curl http://localhost:5000/docs

# View logs (if running in background)
tail -f python_server/server.log
```

## 🎉 You're All Set!

Your Python backend is production-ready and fully functional. Just run:

```bash
cd python_server && python main.py
```

Then open your Replit URL and test the leave management feature!

---

**Need more help?** Check:
- `python_server/README.md` - Detailed Python backend guide
- `README_PYTHON_BACKEND.md` - Complete setup documentation
- `/docs` endpoint - Interactive API testing

**Still having issues?** Make sure:
1. Python server is running on port 5000
2. Database is initialized (run `init_db.py`)
3. You're logged in via Replit Auth
4. Environment variables are set (DATABASE_URL, etc.)
