.PHONY: help install dev build start test lint clean docker-build docker-run

# Default target
help:
	@echo "Omega One Monorepo - Available Commands:"
	@echo ""
	@echo "  install     - Install all dependencies"
	@echo "  dev         - Start both frontend and backend in development mode"
	@echo "  build       - Build both frontend and backend for production"
	@echo "  start       - Start both applications in production mode"
	@echo "  test        - Run all tests"
	@echo "  lint        - Lint all code"
	@echo "  clean       - Remove all node_modules and build artifacts"
	@echo "  docker-build - Build Docker image for backend"
	@echo "  docker-run  - Run backend in Docker container"
	@echo ""
	@echo "Frontend only:"
	@echo "  dev-frontend  - Start frontend development server"
	@echo "  build-frontend - Build frontend for production"
	@echo "  test-frontend - Run frontend tests"
	@echo "  lint-frontend - Lint frontend code"
	@echo ""
	@echo "Backend only:"
	@echo "  dev-backend   - Start backend in development mode"
	@echo "  build-backend - Build backend for production"
	@echo "  test-backend  - Run backend tests"
	@echo "  lint-backend  - Lint backend code"

# Install all dependencies
install:
	npm run install:all

# Development
dev:
	npm run dev

dev-frontend:
	npm run dev:web

dev-backend:
	npm run dev:api

# Build
build:
	npm run build

build-frontend:
	npm run build:web

build-backend:
	npm run build:api

# Start
start:
	npm run start

# Test
test:
	npm run test

test-frontend:
	npm run test:web

test-backend:
	npm run test:api

# Lint
lint:
	npm run lint

lint-frontend:
	npm run lint:web

lint-backend:
	npm run lint:api

# Clean
clean:
	npm run clean

# Docker commands
docker-build:
	cd apps/api && make build

docker-run:
	cd apps/api && make start
