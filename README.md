# Omega One - Development Cycle Dashboard

This is the unified monorepo containing both the Omega frontend and backend services, previously maintained as separate repositories.

## 🏗️ Structure

```
omega-one/
├── apps/
│   ├── frontend/      # Vue.js frontend application 
│   └── backend/       # Node.js/Koa backend service 
├── packages/
│   ├── shared-types/  # Shared TypeScript types and interfaces
│   ├── shared-utils/  # Shared utility functions
│   └── shared-config/ # Shared configuration files
├── tools/
│   ├── eslint-config/ # Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configuration
├── package.json       # Root package.json with workspace configuration
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x LTS
- npm 10.x

### Installation
```bash
# Install all dependencies for both frontend and backend
npm run install:all

# Or install individually
npm run install:frontend
npm run install:backend
```

### Development
```bash
# Run both frontend and backend in development mode
npm run dev

# Or run individually
npm run dev:frontend    # Frontend on http://localhost:8080
npm run dev:backend     # Backend on http://localhost:3000
```

### Production
```bash
# Build both applications
npm run build

# Start both applications
npm run start
```

## 📦 Workspace Commands

### Frontend (Vue.js)
- `npm run dev:frontend` - Start development server
- `npm run build:frontend` - Build for production
- `npm run test:frontend` - Run frontend tests
- `npm run lint:frontend` - Lint frontend code

### Backend (Node.js/Koa)
- `npm run dev:backend` - Start backend in development mode
- `npm run start:backend` - Start backend in production mode
- `npm run test:backend` - Run backend tests
- `npm run lint:backend` - Lint backend code

### Global Commands
- `npm run dev` - Start both frontend and backend in development
- `npm run build` - Build both applications
- `npm run test` - Run all tests
- `npm run lint` - Lint all code
- `npm run clean` - Remove all node_modules
- `npm run clean:install` - Clean and reinstall everything

## 📦 Shared Packages

The monorepo includes several shared packages for code reuse and consistency:

### Shared Types (`packages/shared-types/`)
Common TypeScript types and interfaces used across frontend and backend.

### Shared Utils (`packages/shared-utils/`)
Utility functions that can be used by both frontend and backend applications.

### Shared Config (`packages/shared-config/`)
**Single Source of Truth** for all API endpoints and configuration settings. Ensures frontend and backend always use the same API paths and configuration values. Includes:
- API endpoint definitions
- Environment-specific configurations
- Route consistency validation
- Cross-platform configuration management

### Tools
- **ESLint Config** (`tools/eslint-config/`): Shared ESLint configuration
- **TypeScript Config** (`tools/typescript-config/`): Shared TypeScript configuration

## 🔧 Individual Package Management

Each workspace maintains its own `package.json` and can be managed independently:

```bash
# Work in frontend directory
cd apps/frontend
npm install <package>
npm run <script>

# Work in backend directory
cd apps/backend
npm install <package>
npm run <script>

# Work in shared packages
cd packages/shared-types
npm install <package>
```

## 🐳 Docker Support

### Backend Docker
The backend includes Docker support:
```bash
cd apps/backend
make build    # Build Docker image
make start    # Run Docker container
```

### Frontend Build
The frontend can be built and served statically:
```bash
cd apps/frontend
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
2. **Frontend**: Access at http://localhost:8081
3. **Backend API**: Access at http://localhost:3000
4. **Make Changes**: Edit files in respective directories
5. **Testing**: `npm run test` to run all tests
6. **Linting**: `npm run lint` to check code quality

### 🎯 Shared Configuration

The project uses a **Single Source of Truth** approach for configuration:

- **API Endpoints**: Defined once in `packages/shared-config/`
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
