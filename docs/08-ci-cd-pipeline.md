# CI/CD Pipeline (GitHub Actions)

## Pipeline Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Push to   │───►│   Build &   │───►│   Push to   │───►│  Deploy to │
│   main      │    │   Test      │    │   Registry  │    │   VM        │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
     │                  │                  │                  │
     │              Docker              ghcr.io           SSH to
     │              build               registry          Azure/AWS
     │              test                                   VM
```

## GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy The EpicBook

on:
  push:
    branches:
      - main

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata (tags, labels)
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=semver,pattern={{version}}

      # Build and push backend
      - name: Build and push backend image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ steps.meta.outputs.tags }}-backend
          cache-from: type=gha
          cache-to: type=gha,mode=max

      # Build and push frontend
      - name: Build and push frontend image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ${{ steps.meta.outputs.tags }}-frontend
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.8.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Deploy to VM
        run: |
          echo "${{ secrets.SSH_KNOWN_HOSTS }}" >> ~/.ssh/known_hosts
          ssh -o StrictHostKeyChecking=no ${{ secrets.SERVER_USER }}@${{ secrets.SERVER_IP }} << 'ENDSSH'
            cd /opt/epicbook

            # Pull latest images
            docker-compose pull

            # Pull specific tags
            docker-compose pull backend
            docker-compose pull frontend

            # Restart with new images
            docker-compose up -d

            echo "Deployment complete"
          ENDSSH

      - name: Health check
        run: |
          sleep 10
          curl -f http://${{ secrets.SERVER_IP }}/health || exit 1
```

## Image Tagging Strategy

| Trigger | Tag Format | Example |
|---------|------------|---------|
| Push to main | `sha-<COMMIT_SHA>` | `sha-a1b2c3d` |
| Git tag | `v<MAJOR.MINOR.PATCH>` | `v1.0.0` |
| Branch name | `<BRANCH-NAME>` | `main` |

## Required Secrets

In GitHub repository Settings → Secrets:

```bash
SSH_PRIVATE_KEY    # Private key for SSH access to VM
SSH_KNOWN_HOSTS    # Known hosts for SSH
SERVER_IP          # Public IP of deployment VM
SERVER_USER        # SSH username (e.g., ubuntu)
```

## Alternative: Azure Pipelines

For Azure Pipelines, use `azure-pipelines.yml`:

```yaml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  imageName: 'epicbook'

steps:
  - task: Docker@2
    displayName: Build backend
    inputs:
      command: build
      dockerfile: '$(Build.SourcesDirectory)/backend/Dockerfile'
      tags: '$(Build.BuildId)-backend'

  - task: Docker@2
    displayName: Push backend
    inputs:
      command: push
      containerRegistry: '$(dockerRegistryServiceConnection)'
      imageName: '$(imageName)-backend'
      tags: '$(Build.BuildId)-backend'

  - script: |
      ssh $(serverUser)@$(serverIp) "cd /opt/epicbook && \
        docker-compose pull && \
        docker-compose up -d"
    displayName: Deploy to VM
```

## Versioning Strategy

1. **Git SHA**: Unique per commit, good for debugging
2. **Semver**: Clear release versions
3. **Date-based**: `20240424-143000`

Recommended: Use Git SHA for development, Semver for releases.