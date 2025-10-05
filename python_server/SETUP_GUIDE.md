# Python Server Setup Guide

## Quick Start Commands

### 1. Install Dependencies
```bash
cd python_server
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Run the Server
```bash
python main.py
```

Server will start on `http://0.0.0.0:5000`

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc

## Development Mode

For auto-reload during development:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 5000
```

## Production Deployment

Use Gunicorn with Uvicorn workers:
```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:5000
```

## Project Structure

```
python_server/
├── main.py                 # Application entry point
├── models.py               # SQLAlchemy database models
├── database.py             # Database configuration
├── storage.py              # Data access layer
├── routes.py               # API route handlers
├── auth.py                 # Authentication middleware
├── openai_service.py       # OpenAI integration
├── object_storage.py       # Object storage service
├── config.py               # Application settings
└── requirements.txt        # Python dependencies
```

## Environment Variables

Required variables in `.env`:

```env
DATABASE_URL=postgresql://user:password@host:port/database
OPENAI_API_KEY=sk-...
ISSUER_URL=https://replit.com/oidc
REPL_ID=your_repl_id
REPLIT_DOMAINS=your-app.replit.app
SESSION_SECRET=your_secret_key
PUBLIC_OBJECT_SEARCH_PATHS=/bucket/public
PRIVATE_OBJECT_DIR=/bucket/.private
PORT=5000
```

## Database Migrations

### Automatic (Recommended)
Tables are created automatically on first run.

### Manual (Using Alembic)
```bash
# Initialize Alembic (first time only)
alembic init migrations

# Create a migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

## Testing

Install test dependencies:
```bash
pip install pytest pytest-asyncio httpx
```

Run tests:
```bash
pytest
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Database Connection Error
Check your `DATABASE_URL` format:
```
postgresql://username:password@hostname:port/database_name
```

### Import Errors
Ensure all dependencies are installed:
```bash
pip install -r requirements.txt --force-reinstall
```

## Need Help?

Check the main README.md for detailed documentation.
