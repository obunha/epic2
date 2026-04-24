# Proxy Routing and CORS Configuration

## Nginx Configuration (proxy/nginx.conf)

### Route Definitions

| Path | Destination | Purpose |
|------|-------------|---------|
| `/` | frontend:80 | Static content, HTML pages |
| `/api/*` | backend:8080 | REST API endpoints |
| `/health` | nginx | Health check (returns 200 OK) |

### Key Configuration Blocks

```nginx
# Upstream definitions
upstream backend {
    server backend:8080;
}

upstream frontend {
    server frontend:80;
}

# Main server block
server {
    listen 80;

    # JSON-formatted access logging
    access_log /var/log/nginx/access.log json;
    error_log /var/log/nginx/error.log warn;

    # Gzip compression for performance
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

### Routing Logic

```nginx
# Serve static frontend files
location / {
    proxy_pass http://frontend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

# Proxy API requests to backend
location /api/ {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Access-Control-Allow-Origin $http_origin;
}
```

## CORS Configuration

CORS is handled in the backend via middleware. The backend server.js includes:

```javascript
// CORS headers set by backend
app.use((req, res, next) => {
  const origin = process.env.ALLOWED_ORIGINS || 'http://localhost';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
```

### CORS Allowlist

For production, set `ALLOWED_ORIGINS` to your domain(s):
- `https://yourdomain.com`
- `https://www.yourdomain.com`

For development:
- `http://localhost`
- `http://localhost:80`

## Security Features

1. **No DB port exposure** - Database only accessible via internal Docker network
2. **Non-root nginx** - Container runs as non-privileged user
3. **JSON logging** - Structured logs for observability
4. **Gzip compression** - Reduced bandwidth usage

## Optional HTTPS Setup

To enable HTTPS with self-signed certs:

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /tmp/nginx.key -out /tmp/nginx.crt \
  -subj "/CN=yourdomain.com"

# Update docker-compose.yml to mount certificates
```

Or use Let's Encrypt for automatic HTTPS in production.