# Architecture Diagram

```
                                    ┌─────────────────────────────────────┐
                                    │          INTERNET                   │
                                    └─────────────────┬───────────────────┘
                                                      │
                                                      ▼
                                    ┌─────────────────────────────────────┐
                                    │         AWS/Azure VM                │
                                    │   (Security Group / NSG)            │
                                    │   Ports: 80 (HTTP), 443 (HTTPS)     │
                                    │   SSH: 22 (restricted IP)           │
                                    └─────────────────┬───────────────────┘
                                                      │
                                    ┌─────────────────┴───────────────────┐
                                    │          Nginx Reverse Proxy         │
                                    │     (epicbook_proxy - :80/:443)     │
                                    │   - Routes /api → backend:8080      │
                                    │   - Routes /   → frontend:80        │
                                    │   - Structured logging (JSON)       │
                                    │   - CORS headers passthrough        │
                                    └─────────────────┬───────────────────┘
                                          │                     │
                    ┌─────────────────────┘                     └─────────────────────┐
                    ▼                                                                 ▼
        ┌───────────────────────────┐                                     ┌───────────────────────────┐
        │     Frontend Service      │                                     │      Backend Service      │
        │  (epicbook_frontend:80)   │                                     │  (epicbook_backend:8080)   │
        │   - nginx:alpine          │                                     │   - Node.js 18 Alpine     │
        │   - Static files          │◄───────────── API ────────────────►│   - Express + Handlebars   │
        │   - Handlebars views      │                                     │   - Sequelize ORM         │
        └───────────────────────────┘                                     └────────────┬──────────────┘
                                                                                        │
                                                                                        │ (internal network)
                                                                                        ▼
                                                                              ┌───────────────────────────┐
                                                                              │    Database Service       │
                                                                              │  (epicbook_db:3306)       │
                                                                              │   - MySQL 8.0             │
                                                                              │   - Persistent volume     │
                                                                              │   - epicbook_db_data      │
                                                                              └───────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            NETWORKS                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  epicbook_public:   External traffic (proxy ←→ frontend/backend)                │
│  epicbook_internal: Backend ↔ Database communication (no public exposure)       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            VOLUMES                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  epicbook_db_data:     MySQL data files (persistent)                           │
│  epicbook_app_logs:   Backend application logs                                 │
│  epicbook_proxy_logs: Nginx access/error logs                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Component Overview

| Service | Image | Ports | Public | Purpose |
|---------|-------|-------|--------|---------|
| proxy | nginx:alpine | 80, 443 | YES | Reverse proxy, SSL termination, routing |
| frontend | nginx:alpine | 80 | NO | Static file serving, Handlebars templates |
| backend | node:18-alpine | 8080 | NO | Express API, database operations |
| db | mysql:8.0 | 3306 | NO | MySQL database, persistent storage |

## Data Flow

1. **Client Request** → Internet → VM (port 80/443)
2. **Nginx** → Routes based on path (/api → backend, / → frontend)
3. **Frontend** → Serves static content, makes API calls to backend
4. **Backend** → Processes requests, queries MySQL via Sequelize ORM
5. **Database** → Returns data to backend → response to client