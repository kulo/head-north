# API Services

This directory contains the centralized API service layer for the Omega One frontend application.

## Architecture

### Omega Configuration (`omega-config.js`)

- **Purpose**: Local configuration management for API endpoints
- **Features**:
  - Host injection for different environments
  - Configurable timeouts and retry logic
  - Uses shared configuration from `@omega/shared-config` package

### Cycle Data Service (`cycle-data-service.js`)

- **Purpose**: Centralized service for all API calls
- **Features**:
  - Error handling and retry logic
  - Centralized endpoint management from shared config
  - Consistent request/response handling
  - Environment-specific configuration

### Shared Configuration (`@omega/shared-config`)

- **Purpose**: Shared configuration across frontend and backend
- **Features**:
  - Single source of truth for API endpoints
  - Environment-specific configurations (development, production, test)
  - Utility functions for configuration management
  - Consistent configuration across all applications

## Usage

### Basic Usage

```javascript
import cycleDataService from "@/services/cycle-data-service";

// Make API calls
const data = await cycleDataService.getJiraReleaseOverview();
```

### Configuration

```javascript
import { OmegaConfig } from "@omega/shared-config";

// Create configuration instance
const omegaConfig = new OmegaConfig("development");

// Get frontend configuration
const frontendConfig = omegaConfig.getFrontendConfig();

// Get all pages
const pages = omegaConfig.getFrontendConfig().getAllPages();
```

### Environment-specific Configuration

```javascript
import { getApiConfig, getApiUrl } from "@omega/shared-config";

const config = getApiConfig("production");
const url = getApiUrl("/jira/release-overview", "production");
```

## API Endpoints

All endpoints are defined in `API_ENDPOINTS` constant:

- `JIRA_OVERVIEW`: `/jira/overview`
- `JIRA_RELEASE_OVERVIEW`: `/jira/release-overview`
- `HEALTH_CHECK`: `/healthcheck`

## Error Handling

The API service includes:

- Automatic retry logic with exponential backoff
- Graceful error handling
- Fallback to mock data on failure
- Detailed error logging

## Testing

Unit tests are located in `__tests__/` directory:

- `api-service.test.js`: Tests for cycle data service functionality
- Mock fetch for isolated testing
- Configuration testing

## Benefits

1. **Single Source of Truth**: All API endpoints defined in one place
2. **Environment Flexibility**: Easy switching between dev/staging/prod
3. **Error Resilience**: Built-in retry logic and error handling
4. **Maintainability**: Centralized API logic makes updates easier
5. **Testability**: Isolated services are easier to test
6. **Type Safety**: Clear interfaces and consistent patterns
