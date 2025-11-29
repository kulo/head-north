# Development Guide

This document lays out how to run and work on the project locally. Covers environment, commands, tooling, and day-to-day workflows.

For architecture and code structure, see [docs/architecture.md](docs/architecture.md).

For deployment specifics, see [docs/deployment.md](docs/deployment.md).

For the contribution process, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Prerequisites

- Node.js 22.x LTS
- pnpm 9.x

**Installing pnpm:**

```bash
# Using npm (if you have it)
npm install -g pnpm

# Or using corepack (recommended, comes with Node.js)
corepack enable
corepack prepare pnpm@9.0.0 --activate
```

**New to pnpm?** Don't worry! Commands are nearly identical to npm - just replace `npm` with `pnpm`. See [Package Manager](#package-manager) section below for details.

## Environment

All Head North environment variables use the `HN_` prefix.

See [env.example](../env.example) for the complete list and copy it to create your `.env`.

### Quick dev runs

```bash
# Start API with fake data (no Jira required)
cd apps/api
HN_DATA_SOURCE_ADAPTER=fake pnpm start-dev

# Or start both apps with fake data
HN_DATA_SOURCE_ADAPTER=fake pnpm dev
```

### Use an existing Jira adapter

```bash
# Start API with Prewave adapter (requires Jira env vars)
cd apps/api
HN_DATA_SOURCE_ADAPTER=prewave pnpm start-dev

# Or start both apps with the Prewave adapter
HN_DATA_SOURCE_ADAPTER=prewave pnpm dev
```

Optional adapter-specific overrides:

```bash
HN_JIRA_FIELD_SPRINT=customfield_10021
```

### Build a custom Jira adapter

For developing your own, custom adapter see the [Adapters README.md](apps/api/src/adapters/README.md).

## Installation

```bash
# Install all dependencies (pnpm automatically handles all workspaces)
pnpm install
```

**Note:** With pnpm, you don't need separate install commands for individual packages. pnpm automatically installs dependencies for all workspaces defined in `pnpm-workspace.yaml`.

## Running

```bash
# Run both applications in development mode
pnpm dev

# Or run individually
pnpm dev:web         # Web app on http://localhost:8080
pnpm dev:api         # API on http://localhost:3000
```

**Note:** All commands are orchestrated by Turborepo, which provides intelligent caching and parallel execution. Subsequent runs will be faster thanks to Turborepo's cache.

## Workspace Commands

All commands use `pnpm` and are orchestrated by Turborepo for optimal performance.

### Web Application (Vue.js)

- `pnpm dev:web` - Start development server
- `pnpm build:web` - Build for production (via Turborepo)
- `pnpm test:web` - Run web app tests (via Turborepo)
- `pnpm lint:web` - Lint web app code (via Turborepo)

### API Service (Node.js/Koa)

- `pnpm dev:api` - Start API in development mode
- `pnpm start:api` - Start API in production mode
- `pnpm test:api` - Run API tests (via Turborepo)
- `pnpm lint:api` - Lint API code (via Turborepo)

### Global Commands

- `pnpm dev` - Start both applications in development (via Turborepo)
- `pnpm build` - Build all packages and applications (via Turborepo, cached)
- `pnpm test` - Run all tests across all packages (via Turborepo, parallel)
- `pnpm test:e2e` - Run end-to-end tests (via Turborepo)
- `pnpm lint` - Lint all code across all packages (via Turborepo, parallel)
- `pnpm type-check` - Type check all packages (via Turborepo, parallel)
- `pnpm clean` - Remove all node_modules and build artifacts

## Tooling

### Package Manager: pnpm

This project uses **pnpm** instead of npm for better performance and disk efficiency in monorepos.

**Key differences from npm:**

- Commands are nearly identical: just replace `npm` with `pnpm`
- Faster installs: pnpm uses a content-addressable store, making installs 2-3x faster
- Better disk usage: shared dependencies across workspaces, saving disk space
- Stricter: prevents phantom dependencies (accessing packages not declared in package.json)

**Common commands:**

```bash
pnpm install          # Install all dependencies
pnpm add <package>    # Add a dependency
pnpm add -D <package> # Add a dev dependency
pnpm remove <package> # Remove a dependency
pnpm update           # Update dependencies
```

**Working in individual packages:**

```bash
# Navigate to a package
cd apps/web
pnpm add <package>    # Add dependency to web app

cd packages/utils
pnpm add <package>    # Add dependency to utils package
```

For more information, see [pnpm documentation](https://pnpm.io/).

### Build System: Turborepo

This project uses **Turborepo** for orchestrating tasks across the monorepo.

**Benefits:**

- **Intelligent caching**: Build outputs are cached, making subsequent builds much faster
- **Parallel execution**: Tasks run in parallel when possible
- **Task dependencies**: Automatically handles build order (e.g., packages build before apps)
- **Remote caching**: Can optionally use remote cache for CI/CD (not configured by default)

**How it works:**

- All commands like `pnpm build`, `pnpm test`, `pnpm lint` are routed through Turborepo
- Turborepo analyzes task dependencies and runs them in the correct order
- Build outputs are cached in `.turbo/` directory (gitignored)
- Subsequent runs with unchanged code are nearly instant thanks to caching

**Turborepo commands:**

```bash
pnpm build            # Build all packages (cached)
pnpm test             # Run all tests (parallel, cached)
pnpm lint             # Lint all code (parallel)
pnpm type-check       # Type check all packages (parallel)
```

**Filtering to specific packages:**

```bash
pnpm turbo build --filter=@headnorth/web    # Build only web app
pnpm turbo test --filter=@headnorth/api     # Test only API
```

For more information, see [Turborepo documentation](https://turbo.build/repo/docs).

### Code Quality

- ESLint (TypeScript and Vue.js)
- Prettier (shared configuration)
- Husky (pre-commit linting)
- lint-staged (run linters on staged files)

### Environment Validation

- `pnpm validate:env` - Validates required environment variables
- `pnpm dev:with-check` - Starts development with environment validation

### Package Development

```bash
# Watch mode for shared packages (via Turborepo)
pnpm dev --filter=@headnorth/types    # Watch types package
pnpm dev --filter=@headnorth/utils   # Watch utils package
pnpm dev --filter=@headnorth/config  # Watch config package
```

### Individual Package Management

Each workspace maintains its own `package.json` and can be managed independently:

```bash
# Work in web app directory
cd apps/web
pnpm add <package>
pnpm <script>

# Work in API directory
cd apps/api
pnpm add <package>
pnpm <script>

# Work in shared packages
cd packages/types
pnpm add <package>
```

**Note:** With pnpm, dependencies are automatically linked between workspaces when using `workspace:*` protocol in package.json.

## Development Workflow

1. Start Development: `pnpm dev` (runs both services via Turborepo)
2. Frontend: http://localhost:8080
3. Backend API: http://localhost:3000
4. Make Changes: Edit files in respective directories
5. Testing: `pnpm test` (runs all tests in parallel via Turborepo)
6. Linting: `pnpm lint` (runs linters in parallel via Turborepo)
7. Type Checking: `pnpm type-check` (runs type checks in parallel via Turborepo)

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
