### Frontend Dockerfile (multi-stage)
# Goals: build with Node (cache package files early), use `npm ci` with lockfile,
# produce a small nginx-based runtime image to serve static assets.

# --- Build stage ---
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
COPY package-lock.json ./

# Prefer npm ci for reproducible installs when lockfile exists
RUN if [ -f package-lock.json ]; then npm ci --silent --unsafe-perm; else npm install --silent --unsafe-perm; fi

# Copy app source and build
COPY . .
RUN npm run build


# --- Production stage ---
FROM nginx:alpine AS runtime

# Clean default files and copy built assets
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html

# Replace default nginx config if project provides one
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]