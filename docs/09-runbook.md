# Reliability Tests and Operations Runbook

## Reliability Test Procedures

### Test 1: Backend Restart

```bash
# Before: Note API response
curl http://localhost/api/cart
curl http://localhost/health

# Restart backend only
docker-compose restart backend

# Check: Backend should recover
curl http://localhost/health
docker ps | grep epicbook_backend
docker logs epicbook_backend --tail 20
```

**Expected**: Backend restarts and reconnects to DB automatically.

### Test 2: Database Down

```bash
# Stop database
docker-compose stop db

# Backend health should fail
curl http://localhost/health  # Should return 503

# View backend logs showing connection failure
docker logs epicbook_backend --tail 50 | grep -i error

# Restart database
docker-compose start db

# Wait for DB healthcheck to pass
docker-compose ps db

# Backend should auto-recover
sleep 10
curl http://localhost/health  # Should return 200
```

**Expected**: Clear error messages when DB unavailable, auto-recovery when restored.

### Test 3: Stack Restart (Data Persistence)

```bash
# 1. Add items to cart via web UI

# 2. Verify data exists
curl http://localhost/api/cart

# 3. Take down entire stack (NOT removing volumes)
docker-compose down

# 4. Bring stack back up
docker-compose up -d

# 5. Verify data persists
curl http://localhost/api/cart
docker-compose exec db mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT * FROM Cart;"
```

**Expected**: Cart data persists across stack restarts.

### Test 4: Volume Persistence

```bash
# Verify volumes exist before restart
docker volume ls | grep epicbook

# Check volume contents
docker run --rm -v epicbook_db_data:/data alpine ls -la /data

# Perform full stack restart
docker-compose down
docker-compose up -d

# Verify volume still exists with data
docker volume ls | grep epicbook
```

---

## Operations Runbook

### Start the Stack

```bash
cd /opt/epicbook
docker-compose up -d

# Verify all services running
docker-compose ps
curl http://localhost/health
```

### Stop the Stack

```bash
cd /opt/epicbook
docker-compose down
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f proxy

# Last 100 lines
docker-compose logs --tail=100
```

### Rolling Restart (Zero Downtime)

```bash
# Restart one service at a time
docker-compose restart backend
# Wait for healthcheck
docker-compose restart frontend
```

### Rollback Procedure

```bash
# View previous versions
docker-compose ls

# If using version control:
git log --oneline
git checkout <previous-commit-hash>

# Pull images and restart
docker-compose pull
docker-compose up -d
```

### Rotating Secrets

```bash
# 1. Update .env file with new passwords

# 2. Restart affected services
docker-compose up -d --force-recreate db backend

# 3. Verify connectivity
docker-compose logs backend | grep -i error
```

---

## Common Errors and Fixes

### Error: "Cannot connect to database"

```bash
# Check DB is running
docker-compose ps db

# Check DB logs
docker-compose logs db

# Verify DB is healthy
docker inspect epicbook_db | grep -i health

# Restart DB if needed
docker-compose restart db
```

### Error: "Port already in use"

```bash
# Find what's using port 80
sudo lsof -i :80

# Kill the process or stop the service
sudo systemctl stop nginx
docker-compose up -d
```

### Error: "Volume not found"

```bash
# Recreate volume (WARNING: data loss)
docker volume rm epicbook_db_data
docker-compose up -d
```

### Error: "Permission denied"

```bash
# Fix file permissions
sudo chown -R $USER:$USER /opt/epicbook

# For Docker socket issues
sudo chmod 666 /var/run/docker.sock
```

### Error: "Image pull failed"

```bash
# Check internet connectivity
ping -c 3 docker.io

# Retry pulling
docker-compose pull

# Use specific version tags instead of 'latest'
```

---

## Log Locations

| Service | Command |
|---------|---------|
| All logs | `docker-compose logs -f` |
| Backend | `docker logs epicbook_backend` |
| Frontend | `docker logs epicbook_frontend` |
| Proxy | `docker logs epicbook_proxy` |
| Database | `docker logs epicbook_db` |

---

## Backup/Restore Commands

### Backup
```bash
# Create backup directory
mkdir -p /backup/epicbook

# Backup database
docker-compose exec -T db mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" bookstore > /backup/epicbook/db_$(date +%Y%m%d).sql

# Backup volumes
docker run --rm -v epicbook_db_data:/data -v /backup/epicbook:/backup alpine tar czf /backup/volumes_$(date +%Y%m%d).tar.gz -C /data .
```

### Restore
```bash
# Stop stack
docker-compose down

# Restore database
docker-compose run --rm db mysql -u root -p"$MYSQL_ROOT_PASSWORD" bookstore < /backup/epicbook/db_20240424.sql

# Start stack
docker-compose up -d
```