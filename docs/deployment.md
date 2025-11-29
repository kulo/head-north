# Deployment Guide

This document show you how to build and run the system in non-local environments (Docker, static hosting, cloud).

For local development, see [docs/development.md](docs/development.md).

For architecture and code structure, see [docs/architecture.md](docs/architecture.md).

For the contribution process, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Backend Docker

The backend includes Docker support:

```bash
cd apps/api
make build    # Build Docker image
make start    # Run Docker container
```

## Frontend Build

The frontend can be built and served statically:

```bash
# From root directory (recommended - uses Turborepo)
pnpm build

# Or from web app directory
cd apps/web
pnpm build
# Serve the dist/ directory with any static file server
```

## Cloud / Environments

The backend includes configuration for cloud and local deployments:

- `cloudbuild-production.yaml` - Production deployment
- `minikube-manifest.yaml` - Local Kubernetes deployment

Ensure required environment variables are provided (see `env.example`) for any environment you deploy to.
