# Persistence and Backup Strategy

## Volume Configuration

```yaml
volumes:
  db_data:
    name: epicbook_db_data      # MySQL data files
  app_logs:
    name: epicbook_app_logs    # Application logs
  proxy_logs:
    name: epicbook_proxy_logs   # Nginx access/error logs
```

## What Gets Persisted

| Volume | Data | Persistence Need |
|--------|------|------------------|
| db_data | MySQL database files | CRITICAL - All data |
| app_logs | Backend application logs | Useful - debugging |
| proxy_logs | Nginx access/error logs | Useful - security auditing |

## Backup Strategy

### Daily Automated Backup (Recommended)

Create a cron job on the VM:

```bash
# /etc/cron.daily/epicbook-backup
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backup/epicbook
mkdir -p $BACKUP_DIR

# Stop containers gracefully
cd /opt/epicbook
docker-compose exec -T db mysqldump -u root -p$MYSQL_ROOT_PASSWORD bookstore > $BACKUP_DIR/db_$DATE.sql

# Backup volumes
docker run --rm -v epicbook_db_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/volumes_$DATE.tar.gz -C /data .

# Keep last 7 days of backups
find $BACKUP_DIR -mtime +7 -delete
```

### Manual Backup Test

```bash
# 1. Create backup directory
mkdir -p /backup/epicbook

# 2. Dump database
docker-compose exec -T db mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" bookstore > /backup/epicbook/db_backup_$(date +%Y%m%d).sql

# 3. Verify backup file exists and has content
ls -lh /backup/epicbook/
head -5 /backup/epicbook/db_backup_*.sql
```

## Restore Procedure

### Restore from Database Dump

```bash
# 1. Stop the stack
cd /opt/epicbook
docker-compose down

# 2. Restore database
docker-compose run --rm db mysql -u root -p"$MYSQL_ROOT_PASSWORD" bookstore < /backup/epicbook/db_backup_20240424.sql

# 3. Restart stack
docker-compose up -d
```

### Restore Volume from Archive

```bash
# Extract volume backup
docker run --rm -v epicbook_db_data:/restore -v /backup/epicbook:/backup alpine tar xzf /backup/volumes_20240424.tar.gz -C /restore
```

## Data Persistence Verification

Test that data survives container restarts:

```bash
# 1. Add a book to cart (via web UI or API)
# POST /api/cart with a bookId

# 2. Verify data exists
docker-compose exec backend node -e "const db = require('./models'); db.Cart.findAll().then(c => console.log(c))"

# 3. Restart containers (NOT down - just restart)
docker-compose restart

# 4. Verify data still exists
curl http://localhost/api/cart
```

## Backup Schedule Recommendation

| What | When | Retention |
|------|------|-----------|
| Database SQL dump | Daily at 2 AM | 7 days |
| Volume snapshot | Weekly (Sunday 3 AM) | 4 weeks |
| Off-site copy | Weekly | 12 months |

## Volume Mount Verification

```bash
# Check volume exists
docker volume ls | grep epicbook

# Inspect volume mount points
docker inspect epicbook_db | grep -A5 Mounts

# Verify data directory
docker-compose exec db ls -la /var/lib/mysql/
```