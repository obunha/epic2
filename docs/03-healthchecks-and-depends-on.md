# Healthchecks and Depends-On Configuration

## Healthcheck Implementation

### Database Healthcheck
```yaml
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD}"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```
**Purpose**: Confirms MySQL is accepting connections and responding to pings.

### Backend Healthcheck
```yaml
healthcheck:
  test: ["CMD", "wget", "-q", "--spider", "http://localhost:8080/health"]
  interval: 15s
  timeout: 5s
  retries: 3
  start_period: 40s
```
**Purpose**: The `/health` endpoint returns 200 only after successful DB connection. If DB is down, healthcheck fails.

### Frontend Healthcheck
```yaml
healthcheck:
  test: ["CMD", "wget", "-q", "--spider", "http://localhost/"]
  interval: 10s
  timeout: 5s
  retries: 3
```
**Purpose**: Confirms nginx is serving content.

### Proxy Healthcheck
```yaml
healthcheck:
  test: ["CMD", "nginx", "-t"]
  interval: 30s
  timeout: 10s
  retries: 3
```
**Purpose**: Validates nginx configuration syntax.

## Startup Order (depends_on)

```yaml
services:
  db:
    # No dependency - starts first

  backend:
    depends_on:
      db:
        condition: service_healthy  # Waits for DB to be ready
    healthcheck:
      # ...

  frontend:
    depends_on:
      - backend  # No healthcheck needed - just needs to be running

  proxy:
    depends_on:
      - frontend
      - backend
```

## Verification Commands

```bash
# Check container health status
docker ps --format "table {{.Names}}\t{{.Status}}"

# View healthcheck logs
docker inspect epicbook_db --format='{{json .State.Health}}'
docker inspect epicbook_backend --format='{{json .State.Health}}'

# Manual health endpoint test
curl http://localhost/health
curl http://localhost/api/cart
```