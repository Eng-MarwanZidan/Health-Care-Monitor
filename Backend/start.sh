#!/bin/bash
# start.sh
# Start script for Render deployment
# Runs gunicorn with production settings

echo "=== Starting Health Monitor Backend ==="
exec gunicorn \
  --workers 4 \
  --worker-class sync \
  --max-requests 1000 \
  --max-requests-jitter 100 \
  --timeout 60 \
  --access-logfile - \
  --error-logfile - \
  --bind 0.0.0.0:${PORT:-8000} \
  backend.wsgi:application
