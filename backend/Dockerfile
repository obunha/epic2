# Multi-stage build for Node.js backend
# Stage 1: Build dependencies
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files for better layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies for build tools)
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Production image
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeapp -u 1001

WORKDIR /app

# Copy node_modules from builder (don't need devDependencies in prod)
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodeapp:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown -R nodeapp:nodejs logs

# Switch to non-root user
USER nodeapp

# Expose port
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=40s \
    CMD wget -q --spider http://localhost:8080/health || exit 1

# Log startup
ENV NODE_ENV=production

# Start application
CMD ["node", "server.js"]