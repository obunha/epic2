# Environment Variables and Ports Configuration

## Required Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Database Configuration
MYSQL_ROOT_PASSWORD=your_secure_root_password_here
MYSQL_DATABASE=bookstore
MYSQL_USER=epicbook_user
MYSQL_PASSWORD=your_secure_db_password_here

# Application
NODE_ENV=production
PORT=8080

# CORS - Allowed origins for production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Port Configuration

| Service | Internal Port | External Port | Protocol | Public |
|---------|---------------|---------------|----------|--------|
| proxy | 80 | 80 | HTTP | YES |
| proxy | 443 | 443 | HTTPS | YES (optional) |
| frontend | 80 | - | HTTP | NO (internal only) |
| backend | 8080 | - | HTTP | NO (internal only) |
| db | 3306 | - | MySQL | NO (internal only) |

## Service Communication

```
Frontend → proxy:80 → frontend:80 (internal)
Backend  → proxy:80 → backend:8080 (internal)
Database ← backend → db:3306 (internal)
```

## Security Notes

- **Database port 3306 is NOT exposed publicly**
- **Backend port 8080 is NOT exposed publicly**
- Only ports 80 and 443 are exposed to the internet
- SSH access should be restricted to specific IP ranges via Security Group/NSG
- Secrets are managed via `.env` file (not committed to git)