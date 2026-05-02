# Multi-stage build — static asset image
# NOTE: This image serves only static files (CSS/JS/images) via nginx.
# The backend container handles server-side rendering and the API.
# In the current Compose stack only the backend + proxy services run;
# this image is built by CI and can be used as a CDN origin or asset cache.

# Stage 1: placeholder — no build tools needed for pure static files
FROM node:18-alpine AS builder
WORKDIR /app
COPY public ./public

# Stage 2: minimal nginx image with static assets only
FROM nginx:alpine AS production

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/app.conf
COPY --from=builder /app/public /usr/share/nginx/html

RUN mkdir -p /var/log/nginx && chown -R nginx:nginx /var/log/nginx

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
    CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
