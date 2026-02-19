#!/bin/bash
# build.sh
# Build script for Render deployment
# Runs database migrations and collects static files

set -e  # Exit on first error
echo "=== Health Monitor Backend - Build Script ==="

echo "Step 1: Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Step 2: Creating necessary directories..."
mkdir -p staticfiles
mkdir -p media

echo "Step 3: Running database migrations..."
python manage.py migrate --noinput

echo "Step 4: Collecting static files..."
python manage.py collectstatic --noinput

echo "Step 5: Creating cache table..."
python manage.py createcachetable 2>/dev/null || true

echo "=== Build completed successfully ==="
