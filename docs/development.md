# Development Guide

This document lays out how to run and work on the project locally. Covers environment, commands, tooling, and day-to-day workflows.

For architecture and code structure, see [docs/architecture.md](docs/architecture.md).

For deployment specifics, see [docs/deployment.md](docs/deployment.md).

For the contribution process, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Prerequisites

- Node.js 22.x LTS
- npm 10.x

## Environment

All Head North environment variables use the `HN_` prefix.

See [env.example](../env.example) for the complete list and copy it to create your `.env`.

### Quick dev runs

```bash
# Start API with fake data (no Jira required)
cd apps/api
HN_DATA_SOURCE_ADAPTER=fake npm run start-dev

# Or start both apps with fake data
HN_DATA_SOURCE_ADAPTER=fake npm run dev
```

### Use an existing Jira adapter

```bash
# Start API with Prewave adapter (requires Jira env vars)
cd apps/api
HN_DATA_SOURCE_ADAPTER=prewave npm run start-dev

# Or start both apps with the Prewave adapter
HN_DATA_SOURCE_ADAPTER=prewave npm run dev
```

Optional adapter-specific overrides:

```bash
HN_JIRA_FIELD_SPRINT=customfield_10021
```

### Build a custom Jira adapter

For developing your own, custom adapter see the [Adapters README.md](apps/api/src/adapters/README.md).

## Installation

```bash
# Install all dependencies
npm install

# Or install individually
npm run install:web     # Web application
npm run install:api     # API service
npm run install:packages # Shared packages (types, utils, config)
```

## Running

```bash
# Run both applications in development mode
npm run dev

# Or run individually
npm run dev:web         # Web app on http://localhost:8080
npm run dev:api         # API on http://localhost:3000
```

## Workspace Commands

### Web Application (Vue.js)

- `npm run dev:web` - Start development server
- `npm run build:web` - Build for production
- `npm run test:web` - Run web app tests
- `npm run lint:web` - Lint web app code

### API Service (Node.js/Koa)

- `npm run dev:api` - Start API in development mode
- `npm run start:api` - Start API in production mode
- `npm run test:api` - Run API tests
- `npm run lint:api` - Lint API code

### Global Commands

- `npm run dev` - Start both applications in development
- `npm run build` - Build both applications
- `npm run test` - Run all tests
- `npm run lint` - Lint all code
- `npm run clean` - Remove all node_modules
- `npm run clean:install` - Clean and reinstall everything

## Tooling

### Code Quality

- ESLint (TypeScript and Vue.js)
- Prettier (shared configuration)
- Husky (pre-commit linting)
- lint-staged (run linters on staged files)

### Environment Validation

- `npm run validate:env` - Validates required environment variables
- `npm run dev:with-check` - Starts development with environment validation

### Package Development

```bash
# Watch mode for shared packages
npm run dev:packages

# Individual package development
npm run dev:types    # Watch types package
npm run dev:utils    # Watch utils package
npm run dev:config   # Watch config package
```

### Individual Package Management

Each workspace maintains its own `package.json` and can be managed independently:

```bash
# Work in web app directory
cd apps/web
npm install <package>
npm run <script>

# Work in API directory
cd apps/api
npm install <package>
npm run <script>

# Work in shared packages
cd packages/types
npm install <package>
```

## Development Workflow

1. Start Development: `npm run dev` (runs both services)
2. Frontend: http://localhost:8080
3. Backend API: http://localhost:3000
4. Make Changes: Edit files in respective directories
5. Testing: `npm run test`
6. Linting: `npm run lint`

## Package Usage Examples

```typescript
// Import shared types
import type { Cycle, RoadmapItem } from "@headnorth/types";

// Import utilities
import { logger } from "@headnorth/utils";

// Import configuration
import { HeadNorthConfig } from "@headnorth/config";

// Import JIRA primitives for adapter development
import {
  extractLabelsWithPrefix,
  jiraSprintToCycle,
  JiraClient,
} from "@headnorth/jira-primitives";
```
