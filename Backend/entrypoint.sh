#!/bin/sh
# Backend entrypoint: wait for DB, run migrations and static file collection

set -e

# Wait for MySQL to be ready
echo "Waiting for database to be ready..."
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}

# Simple retry loop - try with password first, then without
MAX_ATTEMPTS=60
ATTEMPT=0
until [ $ATTEMPT -ge $MAX_ATTEMPTS ]; do
  # Try with password if provided
  if [ -n "$DB_PASSWORD" ]; then
    mysqladmin ping -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"${DB_PASSWORD}" --silent >/dev/null 2>&1 && break
  else
    # Try without password
    mysqladmin ping -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" --silent >/dev/null 2>&1 && break
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
  if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
    echo "Failed to connect to database after $MAX_ATTEMPTS attempts"
    exit 1
  fi
  echo "Database not ready, waiting... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
  sleep 1
done

echo "Database is ready!"

# Run Django migrations
echo "Running migrations..."
python manage.py migrate --noinput

# Collect static files (populates /vol/static for the volume)
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Entrypoint complete. Starting application..."

# Execute the command passed to the container (Gunicorn in CMD)
exec "$@"
