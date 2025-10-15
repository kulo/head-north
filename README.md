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
│   ├── utils/         # Shared utility functions (logging)
│   └── config/        # Shared configuration files
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

## 📦 Package Usage Examples

```typescript
// Import shared types
import type { Cycle, RoadmapItem } from "@omega/types";

// Import utilities
import { logger } from "@omega/utils";

// Import configuration
import { OmegaConfig } from "@omega/config";
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

## 🧹 Recent Cleanup

The codebase has been recently cleaned up to remove unused artifacts and improve maintainability:

### Removed Components

- **UI Package**: Removed `packages/ui` as it contained only placeholder components
- **Unused Dependencies**: Removed unused npm packages (vuex, @vueuse/core, sass-loader, etc.)
- **Unused Files**: Cleaned up unused utility files, test duplicates, and empty directories
- **Unused Scripts**: Removed redundant npm scripts across all packages

### Current Package Structure

- **Types** (`@omega/types`): Shared TypeScript interfaces and types
- **Utils** (`@omega/utils`): Logging utilities and shared helper functions
- **Config** (`@omega/config`): Centralized configuration and API endpoint definitions

### Build Status

- ✅ All packages build successfully
- ✅ Web application runs on http://localhost:8080
- ✅ API service runs on http://localhost:3000
- ✅ Fake data mode available for development without Jira authentication

## 🤝 Contributing

1. Make changes in the appropriate workspace directory
2. Test your changes: `npm run test`
3. Lint your code: `npm run lint`
4. Commit your changes
5. Create a pull request

## 📄 License

This project is licensed under the BSD 3-Clause License.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
