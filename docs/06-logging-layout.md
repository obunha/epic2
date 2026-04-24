# Logging and Observability

## Logging Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CONTAINER LOGGING                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │   Backend   │     │   Frontend   │     │    Proxy     │     │
│  │  (Node.js)  │     │   (Nginx)   │     │   (Nginx)   │     │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘     │
│         │                     │                    │             │
│         ▼                     ▼                    ▼             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │  stdout/    │     │  File logs   │     │  File logs   │     │
│  │  stderr     │     │  /var/log/   │     │  /var/log/   │     │
│  │             │     │  nginx/      │     │  nginx/      │     │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘     │
│         │                    │                     │             │
│         └────────────────────┼─────────────────────┘             │
│                              │                                  │
│                              ▼                                  │
│                     ┌──────────────┐                           │
│                     │ Named Volume │                           │
│                     │ epicbook_*   │                           │
│                     └──────────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Log Storage Locations

| Service | Log Type | Location | Volume |
|---------|----------|----------|--------|
| backend | application logs | stdout/stderr | epicbook_app_logs |
| backend | JSON access | /app/logs/*.log | epicbook_app_logs |
| frontend | nginx access | /var/log/nginx/access.log | epicbook_proxy_logs |
| frontend | nginx error | /var/log/nginx/error.log | epicbook_proxy_logs |
| proxy | nginx access | /var/log/nginx/access.log | epicbook_proxy_logs |
| proxy | nginx error | /var/log/nginx/error.log | epicbook_proxy_logs |

## Viewing Logs

### Docker native logging
```bash
# View container logs (stdout/stderr)
docker logs epicbook_backend
docker logs epicbook_backend --tail 100 -f

# Filter by time
docker logs epicbook_backend --since "10m"
```

### Volume-based logs (for file-based logging)
```bash
# Check app logs volume
docker run --rm -v epicbook_app_logs:/logs alpine ls -la /logs

# Check proxy logs
docker run --rm -v epicbook_proxy_logs:/logs alpine ls -la /logs
```

## Structured Logging Format

### Backend JSON Logs (access.log format)
```json
{
  "timestamp": "2024-04-24T10:30:00.000Z",
  "level": "info",
  "message": "Server started",
  "service": "epicbook_backend",
  "port": 8080,
  "env": "production"
}
```

### Nginx JSON Access Log
```json
{
  "timestamp": "24/Apr/2024:10:30:00 +0000",
  "remote_addr": "192.168.1.100",
  "method": "GET",
  "uri": "/api/cart",
  "status": 200,
  "body_bytes_sent": 1234,
  "request_time": 0.045
}
```

## Log Analysis Commands

```bash
# Count HTTP status codes
docker logs epicbook_proxy --tail 1000 | grep '"status":200' | wc -l

# Find errors
docker logs epicbook_backend --tail 500 | grep -i error

# Real-time request monitoring
docker logs epicbook_proxy -f | grep -E '(GET|POST|PUT|DELETE)'

# Database query logs (if enabled)
docker-compose exec db mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SHOW GLOBAL VARIABLES LIKE 'general_log%';"
```

## Log Rotation

Docker handles log rotation automatically via `max-size` and `max-file` options:

```yaml
# In docker-compose.yml (add to each service)
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## Observability Stack (Optional Enhancement)

For production, consider adding:
- **Fluent Bit**: Lightweight log forwarder
- **Grafana Loki**: Log aggregation
- **Prometheus**: Metrics collection
- **Grafana**: Visualization

Example Fluent Bit config for The EpicBook:
```
[INPUT]
    Name   docker
    Tag    epicbook.*

[OUTPUT]
    Name   stdout
    Match  epicbook.*
```