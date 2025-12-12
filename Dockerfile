FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Expose port (Railway provides PORT env var)
EXPOSE 8000

# Start server with Railway's PORT
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
