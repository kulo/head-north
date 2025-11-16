# Deployment Guide

Purpose: How to build and run the system in non-local environments (Docker, static hosting, cloud). For local development, see Development. For architecture and code structure, see Architecture. For contribution process, see Contributing.

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
cd apps/web
npm run build
# Serve the dist/ directory with any static file server
```

## Cloud / Environments

The backend includes configuration for cloud and local deployments:

- `cloudbuild-production.yaml` - Production deployment
- `minikube-manifest.yaml` - Local Kubernetes deployment

Ensure required environment variables are provided (see `env.example`) for any environment you deploy to.

## Related

- Development guide: `docs/development.md`
- Architecture: `docs/architecture.md`
- Contributing: `CONTRIBUTING.md`
