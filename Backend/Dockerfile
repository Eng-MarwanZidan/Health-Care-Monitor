# ==========================================================
# Backend Dockerfile (multi-stage, production)
# Goals: small final image, no build deps in runtime,
# proper layer caching, non-root runtime user,
# and Gunicorn as the production server.
# ==========================================================

ARG PYTHON_VERSION=3.11-slim

# ---------------- Builder stage ----------------
FROM python:${PYTHON_VERSION} AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-libmysqlclient-dev \
    libssl-dev \
    pkg-config \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for cache efficiency
COPY requirements.txt .

RUN python -m pip install --upgrade pip setuptools wheel \
    && pip wheel --wheel-dir=/wheels -r requirements.txt


# ---------------- Runtime stage ----------------
FROM python:${PYTHON_VERSION}

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Runtime-only system libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmariadb3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN adduser --disabled-password --gecos "" appuser

WORKDIR /app

# Install Python dependencies from pre-built wheels
COPY --from=builder /wheels /wheels
COPY requirements.txt .

RUN python -m pip install --upgrade pip \
    && pip install --no-index --find-links=/wheels -r requirements.txt --no-cache-dir \
    && rm -rf /root/.cache /wheels

# Copy application code (after deps to keep cache effective)
COPY . .

# Static directory (used by volume)
RUN mkdir -p /vol/static && chown -R appuser:appuser /vol

# Entrypoint
RUN chmod +x /app/entrypoint.sh

USER appuser

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]

CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000","--workers", "3","--threads", "2","--max-requests", "1000","--max-requests-jitter", "50","--timeout", "120","--log-level", "info"]
