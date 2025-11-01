# Omega One - Development Cycle Dashboard

_Omega_ is a visualisation tool or dashboard for product development organisations that work in a common cadence via high-level iterations called "development cycles" or just "cycles".

_Omega_ provides bird's eye view onto what's going on in your product development organisation, where you're putting your strategic focus and what is the progress you're making.

_Omega One_ is inspired by and a complete rewrite of a similar tool that was originally envisioned and developed within [Emarsys](https://github.com/emartech/).

## 🎯 Core Concepts

_Omega_ organizes product development around several key concepts that work together to provide comprehensive visibility into your development process:

### Development Cycles

High-level iterations that represent major development phases. Each cycle typically spans several weeks and contains multiple work items. Cycles are mapped to JIRA Sprints and provide the primary timeline structure for planning and tracking progress.

### Roadmap Items

Customer-facing features or capabilities that represent value delivered to end users. These are the high-level items that appear on product roadmaps and are typically planned across multiple cycles. Roadmap items serve as the primary organizing principle for customer-facing work and might or might not be mapped to dedicated JIRA issue types.

### Release Items

Concrete work packages that implement roadmap items. These usually group togehter one or more epics from one or more teams that work on the same topicwithin a specific cycle. Release items are linked to their parent roadmap items and represent the granular work that moves roadmap items toward completion.

### Product Areas

Organizational units that group related functionality or business domains (e.g., "Frontend", "Backend", "Mobile", "Analytics"). Areas help organize work and provide visibility into how different parts of the product are progressing across cycles. Another word often used for product areas are Tribes (stemming from the "Spotify Model").

### Teams

Development teams responsible for delivering work. Teams are assigned to release items and provide accountability and resource planning visibility. Team assignments help track capacity and identify bottlenecks.

### Assignees

Individual contributors assigned to specific release items. Assignee information provides granular visibility into individual workloads and helps with capacity planning and knowledge distribution.

### Initiatives

Strategic programs or themes that span multiple roadmap items and cycles. Initiatives represent larger business objectives and help align individual roadmap items with broader organizational goals.

### Release Stages

The current state of roadmap items in the development process (e.g., "Discovery", "Development", "Testing", "Released"). Release stages provide status visibility and help track progress from conception to delivery.

## 📊 Views & Dashboards

_Omega_ provides two main views:

- **Cycle Overview**: Shows the current progress and status of completed, active, and planned cycles, containing all work packages that teams have planned into their cycles.

- **Roadmap View**: Visualizes all customer-facing roadmap items for the last completed, currently active, and next two upcoming cycles – while omitting non-customer-facing items to focus on user value delivery.

## 🏗️ Architecture & Repository Structure

_Omega_ is built as a modern web application with a clear separation between data collection, processing, and visualization. The system consists of:

1. **Web Application**: A Vue.js frontend that provides interactive dashboards for cycle visualization and roadmap planning
2. **API Service**: A Node.js/Koa backend that collects, transforms, and serves cycle data through RESTful endpoints
3. **Data Adapters**: Flexible integration layer that connects to external data sources (primarily JIRA) and transforms raw data into Omega's standardized domain model
4. **Shared Packages**: Common TypeScript types, utilities, and configuration shared across the entire application

The architecture follows a **monorepo structure** with the following organization:

```
omega-one/
├── apps/
│   ├── web/           # Vue.js web application (port 8080)
│   └── api/           # Node.js/Koa API service (port 3000)
├── packages/
│   ├── types/         # Shared TypeScript types and interfaces
│   ├── utils/         # Shared utility functions (logging)
│   ├── config/        # Shared configuration files
│   └── jira-primitives/ # JIRA data transformation utilities
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

## 🔌 Data Source Adapter Architecture

Omega's default data source is **JIRA** with a specific model that maps Omega's internal domain model 1:1 to JIRA concepts:

- **Roadmap Items** → JIRA issue type "Roadmap Item"
- **Release Items** → JIRA issue type "Release Item"
- **Cycles** → JIRA Sprints
- **Metadata** (areas, teams, release stages, etc.) → Fields within these issue types

This direct mapping allows for straightforward data transformation and ensures consistency between your JIRA setup and Omega's visualization.

### Customization Options

You have two main approaches:

1. **Use the Default Adapter**: Model your JIRA setup to fit Omega's expected structure (separate issue types, label-based metadata, etc.)

2. **Create a Custom Adapter**: If you already have a different JIRA setup or prefer a different structure, you can create your own data adapter. The `@omega/jira-primitives` package provides reusable utilities for JIRA data transformation, validation, and API interaction to simplify this process.

For detailed information about creating custom adapters, see the [JIRA Adapters documentation](apps/api/src/adapters/README.md).

## 🚀 Quick Start

### Prerequisites

- Node.js 22.x LTS
- npm 10.x

### Development Mode with Fake Data

For development and testing, the API can run with fake data to avoid Jira authentication requirements:

```bash
# Start API with fake data
cd apps/api
USE_FAKE_DATA=true npm run start-dev

# Or start both apps with fake data
USE_FAKE_DATA=true npm run dev
```

### Installation

```bash
# Install all dependencies
npm install

# Or install individually
npm run install:web     # Web application
npm run install:api     # API service
npm run install:packages # Shared packages (types, utils, config)
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

Shared utility functions used by both web app and API service applications. Currently includes logging functionality for consistent log formatting across the monorepo.

### Config (`@omega/config`)

**Single Source of Truth** for all API endpoints and configuration settings. Ensures web app and API service always use the same API paths and configuration values. Includes:

- API endpoint definitions
- Environment-specific configurations
- Route consistency validation
- Cross-platform configuration management
- Jira integration settings
- **Page definitions and routing** - Centralized page configuration for the frontend
- **Filter system configuration** - Type-safe filter definitions and validation rules

### JIRA Primitives (`@omega/jira-primitives`)

Specialized utilities for JIRA data transformation and validation. Provides reusable building blocks for creating custom JIRA adapters:

- **Data Extractors**: Extract metadata from JIRA issues (labels, custom fields, etc.)
- **Transformers**: Convert JIRA objects to Omega domain objects
- **Validators**: Validate data quality and create validation reports
- **JIRA Client**: Standardized JIRA API client with authentication
- **Type Definitions**: JIRA-specific TypeScript types and interfaces

## 📦 Package Usage Examples

```typescript
// Import shared types
import type { Cycle, RoadmapItem } from "@omega/types";

// Import utilities
import { logger } from "@omega/utils";

// Import configuration
import { OmegaConfig } from "@omega/config";

// Import JIRA primitives for adapter development
import {
  extractLabelsWithPrefix,
  jiraSprintToCycle,
  JiraClient,
} from "@omega/jira-primitives";
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

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines, including:

- Development setup and workflow
- Code style and coding standards
- Pull request process and checklist
- Commit message conventions

## 📚 Documentation

- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute, coding standards, PR process
- **[Coding Guidelines](docs/CODING_GUIDELINES.md)** - Comprehensive coding standards and best practices (includes FP patterns, TypeScript, testing, migration patterns, quick reference)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Michael Wagner-Kulovits
Developed while employed at Prewave
