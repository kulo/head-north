# Omega One - Unified Monorepo

This is the unified monorepo containing both the Omega frontend and backend services, previously maintained as separate repositories.

## 🏗️ Structure

```
omega-one/
├── frontend/          # Vue.js frontend application (formerly omega/)
├── backend/           # Node.js/Koa backend service (formerly omega-data-service/)
├── package.json       # Root package.json with workspace configuration
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16.15.0
- npm 8.5.5

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

## 🔧 Individual Package Management

Each workspace maintains its own `package.json` and can be managed independently:

```bash
# Work in frontend directory
cd frontend
npm install <package>
npm run <script>

# Work in backend directory
cd backend
npm install <package>
npm run <script>
```

## 🐳 Docker Support

### Backend Docker
The backend includes Docker support:
```bash
cd backend
make build    # Build Docker image
make start    # Run Docker container
```

### Frontend Build
The frontend can be built and served statically:
```bash
cd frontend
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

## 📝 Migration Notes

This monorepo was created by unifying two separate repositories:
- **omega** → **frontend/** - Vue.js application for cycle tracking
- **omega-data-service** → **backend/** - Node.js/Koa API service

### Key Changes Made:
1. **Node.js Version**: Backend upgraded from Node 14.21.1 to 16.15.0 for consistency
2. **Workspace Configuration**: Added npm workspaces for unified dependency management
3. **Unified Scripts**: Root package.json provides convenient commands for both services
4. **Preserved Git History**: Both repositories maintain their individual git histories

## 🔍 Development Workflow

1. **Start Development**: `npm run dev` (runs both services)
2. **Frontend**: Access at http://localhost:8080
3. **Backend API**: Access at http://localhost:3000
4. **Make Changes**: Edit files in respective directories
5. **Testing**: `npm run test` to run all tests
6. **Linting**: `npm run lint` to check code quality

## 📚 Original Repositories

- **Frontend**: Originally `omega` - Emarsys Cycle Tracker Vue.js application
- **Backend**: Originally `omega-data-service` - JIRA data collection and processing service

## 🤝 Contributing

1. Make changes in the appropriate workspace directory
2. Test your changes: `npm run test`
3. Lint your code: `npm run lint`
4. Commit your changes
5. Create a pull request

## 📄 License

UNLICENSED - Internal Prewave project
