# Multi-stage build for frontend static site
# Stage 1: Build stage (if needed for any preprocessing)
FROM node:18-alpine AS builder

WORKDIR /app

# Copy source files
COPY public ./public
COPY views ./views
COPY package.json ./

# If there were build steps, they'd go here
# For pure static files, we just copy as-is

# Stage 2: Production nginx image
FROM nginx:alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/

# Copy static files
COPY --chown=nginx:nginx . /usr/share/nginx/html

# Create log directory
RUN mkdir -p /var/log/nginx && chown -R nginx:nginx /var/log/nginx

# Expose port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
    CMD wget -q --spider http://localhost/ || exit 1

# Run nginx
CMD ["nginx", "-g", "daemon off;"]