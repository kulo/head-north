# Architecture

This document lays out the system design and repository structure and should help you understand how components fit together and where code lives.

Related docs:

- Local workflows: [docs/development.md](docs/development.md)
- Deployment specifics: [docs/deployment.md](docs/deployment.md)
- Contribution process: [CONTRIBUTING.md](CONTRIBUTING.md)

## High-level Overview

Head North consists of:

1. Web Application (Vue.js frontend) – interactive dashboards
2. API Service (Node.js/Koa backend) – collects, transforms, serves data
3. Data Adapters – map external data sources (Jira) to Head North domain
4. Shared Packages – types, utils, config, jira primitives

## Monorepo Layout

```
head-north/
├── apps/
│   ├── web/           # Vue.js web application (port 8080)
│   └── api/           # Node.js/Koa API service (port 3000)
├── packages/
│   ├── types/         # Shared TypeScript types and interfaces
│   ├── utils/         # Shared utilities (logging, functional helpers)
│   ├── config/        # Shared configuration (endpoints, routes, validation)
│   └── jira-primitives/ # Jira data transformation utilities
├── tools/
│   ├── eslint-config/ # Shared ESLint configuration
│   ├── prettier-config/ # Shared Prettier configuration
│   ├── typescript-config/ # Shared TypeScript configuration
│   ├── test-config/ # Shared test configuration
│   └── build-config/ # Shared build configuration
├── scripts/
│   └── validate-env.js # Environment validation script
└── README.md
```

## Domain Concepts

- Development Cycles – mapped to Jira Sprints
- Roadmap Items – customer-facing items (virtual in Prewave adapter for now)
- Cycle Items – concrete work packages in a cycle
- Release Stages – lifecycle indicators (placeholder with Prewave adapter for now)
- Areas, Teams, Assignees – organizational metadata

## Adapters

See `apps/api/src/adapters/README.md` for details:

- Default adapter (separate issue types, label-driven metadata)
- Prewave adapter (Epic-centric, virtual roadmap items, label/mapping extraction)
- Fake adapter (dev/testing)

## Shared Packages

- `packages/types` – domain types
- `packages/utils` – utilities, `Either`, `Maybe`, logger, etc.
- `packages/config` – endpoints, routes, validation dictionaries, shared page/filters config
- `packages/jira-primitives` – extractors, transformers, validators, Jira client

## Shared Configuration (Single Source of Truth)

The project uses a centralized approach for configuration to keep frontend and backend in sync:

- API Endpoints: Defined once in `packages/config/`
- Frontend: Uses shared endpoints for API calls
- Backend: Uses shared endpoints for route registration
- Consistency: Frontend and backend automatically stay in sync

## Data Flow (Jira)

1. Fetch: sprints, issues via Jira client
2. Transform: sprints → cycles; issues → cycle items and roadmap items
3. Extract: areas, teams, objectives, stages
4. Validate: data quality into validations array
5. Serve: `RawCycleData` to the frontend
