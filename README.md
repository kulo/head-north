# Omega One - Development Cycle Dashboard

_Omega_ is a visualisation tool or dashboard for product development organisations that work in common cadence via high-level iterations called "development cycles" or just "cycles".

_Omega_ provides a _Cycle Overview_ screen which shows the current progress or latest status of any completed, currently active for future planned cycle and contains all kinds of items teams plan into their cycles.

The _Roadmap_ view visualises all customer-facing items for the last completed, the currently active and the next two upcoming cycles – while omitting any kind of non-customer-facing items.

## 🏗️ Architecture & Structure

_Omega_ consists of two processes: First, a web application user interface which is visualising the cycle data and, second, a backend API service which is collecting and preparing said cycle data from a correspondingly configured source like a jira project.

Both these apps are part of a 'monorepo' with the following structure:

```
omega-one/
├── apps/
│   ├── web/           # Vue.js web application (port 8080)
│   └── api/           # Node.js/Koa API service (port 3000)
├── packages/
│   ├── types/         # Shared TypeScript types and interfaces
│   ├── utils/         # Shared utility functions
│   ├── config/        # Shared configuration files
│   └── ui/            # Shared UI components
├── tools/
│   ├── eslint-config/ # Shared ESLint configuration
│   ├── prettier-config/ # Shared Prettier configuration
│   ├── typescript-config/ # Shared TypeScript configuration
│   ├── test-config/ # Shared test configuration
│   └── build-config/ # Shared build configuration
├── scripts/
│   └── validate-env.js # Environment validation script
├── package.json       # Root package.json with workspace configuration
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 22.x LTS
- npm 10.x

### Installation

```bash
# Install all dependencies
npm run install:all

# Or install individually
npm run install:web     # Web application
npm run install:api     # API service
npm run install:packages # Shared packages
```

### Development

```bash
# Run both applications in development mode
npm run dev

# Or run individually
npm run dev:web         # Web app on http://localhost:8080
npm run dev:api         # API on http://localhost:3000
```

### Production

```bash
# Build both applications
npm run build

# Start both applications
npm run start
```

## 📦 Workspace Commands

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

## 📦 Shared Packages

The monorepo includes several shared packages for code reuse and consistency. All packages use modern scoped naming (`@omega/*`) and follow current Node.js monorepo best practices:

### Types (`@omega/types`)

Common TypeScript types and interfaces used across web app and API service. Provides type safety and consistency across the entire monorepo.

### Utils (`@omega/utils`)

Utility functions that can be used by both web app and API service applications. Includes logging, data processing, and common helper functions.

### Config (`@omega/config`)

**Single Source of Truth** for all API endpoints and configuration settings. Ensures web app and API service always use the same API paths and configuration values. Includes:

- API endpoint definitions
- Environment-specific configurations
- Route consistency validation
- Cross-platform configuration management
- Jira integration settings

### UI (`@omega/ui`)

Shared Vue.js components that can be reused across different parts of the web application. Provides consistent UI components and design system elements.

## 📦 Package Usage Examples

```typescript
// Import shared types
import type { Cycle, RoadmapItem } from "@omega/types";

// Import utilities
import { logger } from "@omega/utils";

// Import configuration
import { OmegaConfig } from "@omega/config";

// Import UI components
import { Button, Modal } from "@omega/ui";
```

### Tools

- **ESLint Config** (`tools/eslint-config/`): Shared ESLint configuration
- **Prettier Config** (`tools/prettier-config/`): Shared Prettier configuration
- **TypeScript Config** (`tools/typescript-config/`): Shared TypeScript configuration
- **Test Config** (`tools/test-config/`): Shared test configuration
- **Build Config** (`tools/build-config/`): Shared build configuration

## 🛠️ Development Tools

### Code Quality

- **ESLint**: Configured for TypeScript and Vue.js
- **Prettier**: Code formatting with shared configuration
- **Husky**: Git hooks for pre-commit linting
- **lint-staged**: Run linters on staged files only

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
npm run dev:ui       # Watch UI package
```

## 🔧 Individual Package Management

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

## 🐳 Docker Support

### Backend Docker

The backend includes Docker support:

```bash
cd apps/api
make build    # Build Docker image
make start    # Run Docker container
```

### Frontend Build

The frontend can be built and served statically:

```bash
cd apps/web
npm run build
# Serve the dist/ directory with any static file server
```

## 🚀 Deployment

### Cloud Build (Backend)

The backend includes Google Cloud Build configuration:

- `cloudbuild-production.yaml` - Production deployment
- `minikube-manifest.yaml` - Local Kubernetes deployment

### Frontend Deployment

The frontend builds to static files in `dist/` directory and can be deployed to any static hosting service.

## 🔍 Development Workflow

1. **Start Development**: `npm run dev` (runs both services)
2. **Frontend**: Access at http://localhost:8080
3. **Backend API**: Access at http://localhost:3000
4. **Make Changes**: Edit files in respective directories
5. **Testing**: `npm run test` to run all tests
6. **Linting**: `npm run lint` to check code quality

### 🎯 Shared Configuration

The project uses a **Single Source of Truth** approach for configuration:

- **API Endpoints**: Defined once in `packages/config/`
- **Frontend**: Uses shared endpoints for API calls
- **Backend**: Uses shared endpoints for route registration
- **Consistency**: Frontend and backend automatically stay in sync

## 🤝 Contributing

1. Make changes in the appropriate workspace directory
2. Test your changes: `npm run test`
3. Lint your code: `npm run lint`
4. Commit your changes
5. Create a pull request

## 📄 License

UNLICENSED - Internal Prewave project
