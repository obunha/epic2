# The EpicBook - Containerized Bookstore Application

A production-ready containerized Node.js/MySQL application for an online bookstore.

## Architecture

```
Internet → Nginx (port 80) → Frontend (static) / Backend (API)
                                    ↓                ↓
                              epicbook_public   epicbook_internal
                                                     ↓
                                                  MySQL (port 3306)
```

## Project Structure

```
theepicbook/
├── backend/              # Node.js Express API
│   ├── models/           # Sequelize models
│   ├── routes/           # API and HTML routes
│   ├── server.js         # Entry point with health endpoint
│   ├── Dockerfile        # Multi-stage build
│   └── package.json      # Dependencies
├── frontend/             # Static files + nginx
│   ├── public/           # CSS, JS, assets
│   ├── views/            # Handlebars templates
│   ├── Dockerfile        # Multi-stage build
│   └── .dockerignore
├── proxy/                # Nginx reverse proxy
│   └── nginx.conf        # Routing configuration
├── db/                   # Database setup
│   ├── schema.sql        # Table definitions
│   └── seed.sql          # Sample data
├── docs/                 # Documentation
│   ├── 01-architecture-diagram.md
│   ├── 02-env-and-ports.md
│   ├── 03-healthchecks-and-depends-on.md
│   ├── 04-proxy-routing-and-cors.md
│   ├── 05-persistence-and-backup.md
│   ├── 06-logging-layout.md
│   ├── 07-cloud-deployment-notes.md
│   ├── 08-ci-cd-pipeline.md
│   ├── 09-runbook.md
│   └── 10-reliability-tests.md
├── docker-compose.yml    # Full stack orchestration
└── .env.example          # Environment template
```

## Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+

### Deployment

1. **Clone and configure**
```bash
git clone <repository-url> epicbook
cd epicbook
cp .env.example .env
# Edit .env with your secure passwords
```

2. **Deploy**
```bash
docker-compose up -d
```

3. **Verify**
```bash
curl http://localhost/health
curl http://localhost/api/cart
```

## Multi-Stage Build Benefits

| Aspect | Single-Stage | Multi-Stage |
|--------|--------------|-------------|
| Backend image size | ~900 MB | ~150 MB |
| Frontend image size | ~140 MB | ~25 MB |
| Attack surface | Full OS | Minimal (Alpine) |
| Build tools included | Yes | No (removed) |

## Services

| Service | Internal Port | Purpose |
|---------|---------------|---------|
| proxy | 80, 443 | Reverse proxy, SSL termination |
| frontend | 80 | Static file serving |
| backend | 8080 | Express API, business logic |
| db | 3306 | MySQL 8.0 database |

## Documentation

See `/docs` folder for detailed documentation on:
- Architecture and components
- Environment configuration
- Healthchecks and startup order
- Proxy routing and CORS
- Persistence and backup
- Logging strategy
- Cloud deployment (AWS/Azure)
- CI/CD pipeline
- Operations runbook
- Reliability test results

## License

MIT