# The EpicBook — Installation Guide

Complete guide for running the stack locally and deploying to AWS EC2.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Local Development](#local-development)
4. [AWS Deployment](#aws-deployment)
5. [Environment Variables](#environment-variables)
6. [Verify the Stack](#verify-the-stack)
7. [Day-2 Operations](#day-2-operations)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Tool | Minimum Version | Check |
|---|---|---|
| Docker | 24.x | `docker --version` |
| Docker Compose | v2.x | `docker compose version` |
| Git | any | `git --version` |

For AWS deployment you also need an AWS account and the `.pem` key file from your EC2 key pair.

---

## Project Structure

```
theepicbook/
├── backend/          # Node.js/Express API + server-side rendering
│   ├── Dockerfile    # Multi-stage build (root context required)
│   ├── server.js
│   ├── config/
│   ├── models/
│   └── routes/
├── frontend/         # Static assets (CSS, JS, images, Handlebars templates)
│   └── Dockerfile    # Builds a standalone nginx static-asset image
├── proxy/
│   └── nginx.conf    # Reverse proxy — routes / and /api/ to backend
├── db/
│   ├── schema.sql    # Auto-loaded on first DB startup
│   └── seed.sql      # Sample book data
├── .env.example      # Copy this to .env and fill in values
├── .env              # Your secrets — never commit this file
└── docker-compose.yml
```

### Service map

```
Internet
   │ :80
   ▼
[Nginx proxy]  ──── /       ──► [Backend :8080]  ──► [MySQL :3306]
               ──── /api/   ──► [Backend :8080]
               ──── /health ──► [Backend :8080]
```

Only port 80 (and optionally 443) is exposed to the outside. The database port is never published.

---

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/theepicbook.git
cd theepicbook
```

### 2. Create your `.env` file

```bash
cp .env.example .env
```

Open `.env` and set values:

```env
MYSQL_ROOT_PASSWORD=EpicBook_Root_2024!
MYSQL_DATABASE=bookstore
MYSQL_USER=epicbook_user
MYSQL_PASSWORD=EpicBook_Db_2024!
NODE_ENV=production
PORT=8080
ALLOWED_ORIGINS=http://localhost,http://localhost:80
```

### 3. Build and start

```bash
docker compose up -d --build
```

### 4. Confirm all services are healthy

```bash
docker compose ps
```

Expected output once ready (takes ~60 seconds on first run):

```
NAME                STATUS
epicbook_db         Up 2 minutes (healthy)
epicbook_backend    Up 1 minute (healthy)
epicbook_proxy      Up 30 seconds (healthy)
```

### 5. Open the app

```
http://localhost
```

---

## AWS Deployment

### Step 1 — Launch an EC2 instance

1. Go to **AWS Console → EC2 → Launch Instance**
2. Configure:
   - **Name:** `epicbook-vm`
   - **AMI:** Ubuntu Server 24.04 LTS
   - **Instance type:** `t3.small` (recommended) or `t2.micro` (free tier)
   - **Key pair:** Create new → `epicbook-key` → download and save the `.pem` file
   - **Storage:** 20 GB gp3

3. Under **Network settings → Edit**, create security group `epicbook-sg`:

   | Type | Port | Source |
   |---|---|---|
   | SSH | 22 | My IP |
   | HTTP | 80 | 0.0.0.0/0 |
   | HTTPS | 443 | 0.0.0.0/0 |

4. Launch the instance and note the **Public IPv4 address**.

---

### Step 2 — Connect via SSH

```bash
# Fix key permissions (macOS/Linux)
chmod 400 epicbook-key.pem

# Connect
ssh -i epicbook-key.pem ubuntu@<YOUR_PUBLIC_IP>
```

On Windows (PowerShell):
```powershell
ssh -i epicbook-key.pem ubuntu@<YOUR_PUBLIC_IP>
```

---

### Step 3 — Install Docker on the VM

Run these commands on the VM:

```bash
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker Engine
curl -fsSL https://get.docker.com | sudo sh

# Allow ubuntu user to run docker without sudo
sudo usermod -aG docker ubuntu
newgrp docker

# Install Compose plugin
sudo apt-get install -y docker-compose-plugin

# Verify
docker --version
docker compose version
```

---

### Step 4 — Get the code onto the VM

**Option A — Git (recommended):**

```bash
sudo mkdir -p /opt/epicbook
sudo chown ubuntu:ubuntu /opt/epicbook
cd /opt/epicbook
git clone https://github.com/<your-username>/theepicbook.git .
```

**Option B — Copy from your local machine:**

Run this on your local machine (not the VM):

```bash
scp -i epicbook-key.pem -r /path/to/theepicbook ubuntu@<YOUR_PUBLIC_IP>:/opt/epicbook
```

---

### Step 5 — Create the `.env` file on the VM

```bash
cd /opt/epicbook

cat > .env << 'EOF'
MYSQL_ROOT_PASSWORD=EpicBook_Root_2024!
MYSQL_DATABASE=bookstore
MYSQL_USER=epicbook_user
MYSQL_PASSWORD=EpicBook_Db_2024!
NODE_ENV=production
PORT=8080
ALLOWED_ORIGINS=http://<YOUR_PUBLIC_IP>
EOF
```

Replace `<YOUR_PUBLIC_IP>` with the actual EC2 public IP, e.g. `http://54.123.45.67`.

---

### Step 6 — Build and start the stack

```bash
cd /opt/epicbook
docker compose up -d --build
```

First run takes 3–5 minutes while Docker downloads base images and builds the backend.

---

### Step 7 — Watch startup

```bash
# Watch container health status
watch docker compose ps

# Or stream all logs
docker compose logs -f
```

Wait until all three containers show `(healthy)`.

---

### Step 8 — Confirm the deployment

```bash
# Health check from the VM itself
curl http://localhost/health
# Expected: {"status":"healthy","timestamp":"...","database":"connected"}
```

Then visit in a browser:

```
http://<YOUR_PUBLIC_IP>
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MYSQL_ROOT_PASSWORD` | yes | MySQL root password |
| `MYSQL_DATABASE` | yes | Database name (default: `bookstore`) |
| `MYSQL_USER` | yes | App database user |
| `MYSQL_PASSWORD` | yes | App database password |
| `NODE_ENV` | yes | Set to `production` on the VM |
| `PORT` | no | Backend port (default: `8080`) |
| `ALLOWED_ORIGINS` | yes | Comma-separated list of allowed CORS origins |

`ALLOWED_ORIGINS` examples:

```env
# Local
ALLOWED_ORIGINS=http://localhost,http://localhost:80

# AWS VM
ALLOWED_ORIGINS=http://54.123.45.67

# Custom domain
ALLOWED_ORIGINS=https://www.myepicbook.com
```

---

## Verify the Stack

### Health endpoint

```bash
curl http://<HOST>/health
```

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

### Check container status

```bash
docker compose ps
```

### Check logs

```bash
# All services
docker compose logs -f

# Single service
docker compose logs -f backend
docker compose logs -f proxy
docker compose logs -f db
```

### Nginx access logs (JSON format)

```bash
docker compose logs proxy | grep '"status"'
```

---

## Day-2 Operations

### Stop the stack

```bash
docker compose down
```

### Stop and remove all data (destructive)

```bash
docker compose down -v
```

### Restart a single service

```bash
docker compose restart backend
```

### Pull latest code and redeploy

```bash
cd /opt/epicbook
git pull
docker compose up -d --build
```

### Manual database backup

```bash
docker exec epicbook_db \
  mysqldump -u epicbook_user -p"$MYSQL_PASSWORD" bookstore \
  > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from backup

```bash
docker exec -i epicbook_db \
  mysql -u epicbook_user -p"$MYSQL_PASSWORD" bookstore \
  < backup_20240101_120000.sql
```

### Reclaim disk space

```bash
docker system prune -f
```

---

## Security Hardening (Recommended for Production)

```bash
# Disable password SSH login (key-only access)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Enable UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

---

## Troubleshooting

**Port 80 not reachable from browser**
- Check your EC2 security group has an inbound rule for port 80 from `0.0.0.0/0`
- Run `docker compose ps` — confirm the proxy container is up and healthy

**Backend stuck as `unhealthy` or `starting`**
```bash
docker compose logs backend
```
Usually the database is still initializing. Wait 60 seconds then run `docker compose ps` again.

**`permission denied` running docker**
```bash
newgrp docker
# or log out and SSH back in
```

**`Cannot connect to the Docker daemon`**
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

**Out of disk space during build**
```bash
docker system prune -f
docker compose up -d --build
```

**Database connection refused in backend logs**
The DB health check must pass before the backend starts. If the backend started before the DB was ready:
```bash
docker compose restart backend
```

**Changes to `.env` not reflected**
Compose caches environment at startup. Restart the affected service:
```bash
docker compose up -d --force-recreate backend
```
