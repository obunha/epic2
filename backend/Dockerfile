# Multi-stage build for Node.js backend
# Build context must be the repo root so frontend/views and frontend/public are accessible.
# In docker-compose.yml: context: . / dockerfile: backend/Dockerfile

# Stage 1: install production dependencies
FROM node:18-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: minimal production image
FROM node:18-alpine AS production

RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001

WORKDIR /app

# Runtime dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Application source
COPY --chown=nodeapp:nodejs backend/ ./

# Templates and static assets live in frontend/ — copy into the expected locations
COPY --chown=nodeapp:nodejs frontend/views ./views
COPY --chown=nodeapp:nodejs frontend/public ./public

RUN mkdir -p logs && chown -R nodeapp:nodejs logs

USER nodeapp

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=40s \
    CMD wget -q --spider http://localhost:8080/health || exit 1

ENV NODE_ENV=production

CMD ["node", "server.js"]
