# Shared Configuration Package

This package provides a unified configuration system for the Head North application. It exports only the `HeadNorthConfig` class, which encapsulates all configuration logic, environment detection, and utility functions.

## Usage

### Basic Usage

```javascript
import { HeadNorthConfig } from "@headnorth/config";

// Create configuration instance
const config = new HeadNorthConfig("development");

// Access configuration
const apiHost = config.getHost();
const endpoints = config.getEndpoints();
const cacheTTL = config.getCacheTTL();
```

### Environment-Specific Configuration

```javascript
// Development environment
const devConfig = new HeadNorthConfig("development");

// Production environment
const prodConfig = new HeadNorthConfig("production");

// Test environment
const testConfig = new HeadNorthConfig("test");
```

### Configuration Overrides

```javascript
const config = new HeadNorthConfig("development", {
  // Override specific settings
  customSetting: "value",
  cache: {
    ttl: 10 * 60 * 1000, // 10 minutes
  },
});
```

## API Reference

### Constructor

- `new HeadNorthConfig(environment?, overrides?)`
  - `environment`: 'development' | 'production' | 'test' (default: 'development')
  - `overrides`: Object with configuration overrides

### Core Methods

- `getHost()` - Get API host URL
- `getUrl(endpoint)` - Get full URL for an endpoint
- `getEndpoints()` - Get all API endpoints
- `getConfig()` - Get complete configuration object

### Cache Methods

- `getCacheConfig()` - Get cache configuration
- `getCacheTTL()` - Get cache TTL in milliseconds

### Environment Methods

- `isDevelopment()` - Check if development environment
- `isProduction()` - Check if production environment
- `isTest()` - Check if test environment
- `getEnvironmentConfig()` - Get environment-specific configuration

### Data Methods

- `getLabelTranslations()` - Get label translations
- `getValidationDictionary()` - Get validation dictionary
- `getStages()` - Get stages configuration
- `getLogoAssets()` - Get logo assets

### Backend-Specific Methods

- `getJiraConfig()` - Get Jira configuration (Node.js only)

### Utility Methods

- `getApiUrl(endpoint)` - Get full API URL for endpoint
- `getAvailableEnvironments()` - Get all available environments
- `get(key)` - Get specific configuration value
- `set(key, value)` - Set specific configuration value

## Environment Detection

The configuration automatically detects the environment:

- **Node.js**: Uses `process.env.NODE_ENV`
- **Browser**: Uses `import.meta.env?.MODE`

## Configuration Structure

The configuration includes:

- **API Settings**: Host, timeout, retries, endpoints
- **Cache Settings**: TTL, max size, memory cache
- **Environment Settings**: Development, production, test specific configs
- **Backend Settings**: Jira integration, stages, label translations
- **Frontend Settings**: Dev mode, hot reload, debug settings

## Examples

### Backend Usage

```javascript
import { HeadNorthConfig } from "@headnorth/config";

const config = new HeadNorthConfig(process.env.NODE_ENV || "development");

// Get server configuration
const port = config.get("port");
const jiraConfig = config.getJiraConfig();

// Get API endpoints
const endpoints = config.getEndpoints();
```

### Frontend Usage

```javascript
import { HeadNorthConfig } from "@headnorth/config";

const environment = import.meta.env?.MODE || "development";
const config = new HeadNorthConfig(environment, {
  devMode: environment === "development",
});

// Get API configuration
const apiHost = config.getHost();
const cacheTTL = config.getCacheTTL();

// Check environment
if (config.isDevelopment()) {
  console.log("Running in development mode");
}
```
