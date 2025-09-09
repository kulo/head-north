/**
 * OmegaConfig - Unified Configuration System
 * 
 * This class provides a centralized configuration system for the Omega application.
 * It handles environment detection, API endpoints, caching settings, and frontend-specific
 * configuration like page definitions and route constants.
 * 
 * Usage:
 *   import { OmegaConfig } from '@omega/shared-config'
 *   
 *   // Frontend usage (no process environment needed)
 *   const config = new OmegaConfig()
 *   
 *   // Backend usage (with process environment)
 *   const config = new OmegaConfig(process.env)
 *   
 *   // Custom environment via overrides
 *   const config = new OmegaConfig(process.env, { environment: 'staging' })
 *   
 *   // Override specific configuration values
 *   const config = new OmegaConfig(process.env, { 
 *     environment: 'production',
 *     api: { host: 'https://custom-api.com' }
 *   })
 *   
 *   const apiHost = config.getHost()
 *   const endpoints = config.getEndpoints()
 */

// Removed import of label-translations.js - now using integrated configuration
import validationDictionary from './validation-dictionary.js'
import JiraConfig from './jira-config.js'
import { getEnvVarWithFallback } from './utils.js'

export default class OmegaConfig {
  constructor({ processEnv = {}, overrides = {} })  {
    this.processEnv = processEnv
    this.overrides = overrides
    
    // Extract environment from overrides or processEnv, with fallback
    this.environment = overrides.environment || processEnv.NODE_ENV || 'development'
    
    // Initialize configuration
    this.config = this._initializeConfig()
    
    // Apply overrides
    this._applyOverrides()
  }

  /**
   * Initialize configuration based on environment
   * @private
   */
  _initializeConfig() {
    const config = {
      // Environment
      environment: this.environment,
      
      // Common Configuration (shared between frontend and backend)
      common: {
        
        // Cache Configuration
        cache: {
          ttl: 5 * 60 * 1000, // 5 minutes
          roadmapTTL: 5 * 60 * 1000, // 5 minutes
          defaultTTL: 2 * 60 * 1000  // 2 minutes
        },
        
        // Release Strategy Configuration (shared between frontend and backend)
        releaseStrategy: {
          // Stages Configuration
          stages: [
            { name: 'Stage 0 - Pilot it', value: 's0' },
            { name: 'Stage 1 - Sell it', value: 's1' },
            { name: 'Stage 2 - Scale it', value: 's2' },
            { name: 'Stage 3 - Global Release', value: 's3' },
            { name: 'Enhancements', value: 's3+' }
          ],
          
          // Stage Categorization
          stageCategories: {
            finalReleaseStage: ['s3', 's3+'],
            releasableStage: ['s1', 's2', 's3', 's3+'],
            externalStages: ['s0', 's1', 's2', 's3', 's3+']
          },
          
          // Pre-release Configuration
          noPrereleaseAllowedLabel: 'omega:no-pre-release-allowed'
        },

        // Development Configuration (shared between frontend and backend)
        development: {
          // Fake Data Configuration - will be set during backend initialization
          useFakeData: false
        },

        // Item Status Configuration (shared between frontend and backend)
        itemStatuses: {
          // Omega status values
          values: {
            TODO: 'todo',
            IN_PROGRESS: 'inprogress',
            DONE: 'done',
            CANCELLED: 'cancelled',
            POSTPONED: 'postponed'
          },
          
          // Status categories
          categories: {
            finished: ['done', 'cancelled'],
            active: ['todo', 'inprogress'],
            future: ['todo', 'inprogress', 'postponed']
          }
        },
        
        // Environment-specific backend configuration (shared between frontend and backend)
        environments: {
          production: {
            backendHost: null, // should be set by the environment variable
            timeout: 30000,
            retries: 2,
            retryDelay: 1000
          },
          development: {
            backendHost: 'http://localhost:3000',
            timeout: 30000,
            retries: 5,
            retryDelay: 1000
          }
        },

        // Organization Configuration (shared between frontend and backend)
        organisation: {
          areas: {
            "platform": "Platform",
            "resilience": "Resilience", 
            "sustainability": "Sustainability"
          },
          teams: {
            "platform.integrations": "Integrations",
            "platform.cs3": "Customer Supply Chain Setup & Core Services",
            "platform.data-engineering.integrations": "DE Integrations Support",
            "platform.data-engineering.operations": "DE Engineering Operations Support",
            "platform.data-engineering.data-science-support": "DE Data Science Support",
            "platform.data-engineering.platform": "DE Platform",
            "platform.data-science": "Data Science",
            "resilience.fttk": "Faster Time to Know",
            "resilience.proactive-resilience": "Proactive Resilience",
            "sustainability.product-compliance": "Product Compliance",
            "sustainability.supplier-compliance": "Supplier Compliance",
            "sustainability.core-sustainability": "Core Sustainability"
          }
        },

        // Product Strategy Configuration (shared between frontend and backend)
        productStrategy: {
          themes: {
            "compliance": "Efficient Compliance",
            "integrated-scorecard": "Seamlessly Integrated Scorecard",
            "FTTR": "Faster Time to Response",
            "proactive-resilience": "Proactive Resilience",
            "tier-n": "Multi-Tier Risk Management",
            "non-roadmap": "Non-Roadmap Projects",
            "virtual": "Non-Roadmap Projects"
          },
          initiatives: {
            "compliance": "Efficient Compliance",
            "integrated-scorecard": "Seamlessly Integrated Scorecard",
            "FTTR": "Faster Time to Response",
            "proactive-resilience": "Proactive Resilience",
            "tier-n": "Multi-Tier Risk Management",
            "retention": "Retention",
            "uncategorized": "Uncategorized"
          },
        }
      },
      
      // Frontend-specific Configuration
      frontend: {
        pages: {
          ROOT: { id: 'root', path: '/', name: 'Omega Home' },
          CYCLE_OVERVIEW: { id: 'cycle-overview', path: '/cycles/overview', name: 'Cycle Overview' },
          ROADMAP: { id: 'roadmap', path: '/cycles/roadmap', name: 'Roadmap' }
        },
        getAllPages() {
          return Object.values(this.pages)
        }
      },
      
      // Backend-specific Configuration
      backend: {
        // Will be populated if processEnv is provided
      }
      
    }

    // Add backend-specific configuration if processEnv is provided
    if (this.processEnv && Object.keys(this.processEnv).length > 0) {
      // Server Configuration
      config.backend.port = getEnvVarWithFallback(this.processEnv, 'PORT', '3000', 'Server port')
      config.backend.maxRetry = getEnvVarWithFallback(this.processEnv, 'MAX_RETRY', '3', 'Max retry count')
      config.backend.delayBetweenRetry = getEnvVarWithFallback(this.processEnv, 'DELAY_BETWEEN_RETRY', '2', 'Retry delay')
      
      // Jira Configuration (backend-specific) - using JiraConfig class
      const useFakeData = this._getUseFakeData()
      // Update the common config with the actual useFakeData value
      config.common.development.useFakeData = useFakeData
      const jiraConfig = new JiraConfig(this.processEnv, useFakeData)
      config.backend.jira = jiraConfig.getConfig()
      config.backend.useFakeData = useFakeData
    }

    return config
  }


  

  /**
   * Apply configuration overrides
   * @private
   */
  _applyOverrides() {
    if (this.overrides) {
      this.config = this._deepMerge(this.config, this.overrides)
    }
  }

  /**
   * Deep merge objects
   * @private
   */
  _deepMerge(target, source) {
    const result = { ...target }
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(target[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }
    
    return result
  }

  /**
   * Check if fake data should be used
   * @private
   */
  _getUseFakeData() {
    const useFakeData = getEnvVarWithFallback(this.processEnv, 'USE_FAKE_DATA', 'false', 'Fake data mode')
    return useFakeData === 'true' || useFakeData === '1' || useFakeData === true
  }

  /**
   * Get backend host based on environment
   * @private
   */
  _getBackendHost() {
    // Check for environment variable first
    const envBackendHost = this.processEnv.API_HOST || this.processEnv.REACT_APP_API_HOST;
    if (envBackendHost) {
      return envBackendHost;
    }
    
    // Fall back to environment-specific defaults
    const environmentConfig = this.config.common.environments[this.environment];
    if (environmentConfig && environmentConfig.backendHost) {
      return environmentConfig.backendHost;
    }
    
    // Final fallback to development
    return this.config.common.environments.development.backendHost;
  }
  /**
   * Get configuration value by key
   * @param {string} key - Configuration key (supports dot notation)
   * @returns {any} Configuration value
   */
  get(key) {
    return key.split('.').reduce((obj, k) => obj?.[k], this.config)
  }

  /**
   * Set configuration value by key
   * @param {string} key - Configuration key (supports dot notation)
   * @param {any} value - Configuration value
   */
  set(key, value) {
    const keys = key.split('.')
    const lastKey = keys.pop()
    const target = keys.reduce((obj, k) => {
      if (!obj[k]) obj[k] = {}
      return obj[k]
    }, this.config)
    target[lastKey] = value
  }

  /**
   * Get full configuration object
   * @returns {object} Full configuration
   */
  getConfig() {
    return this.config
  }

  /**
   * Get backend host
   * @returns {string} Backend host URL
   */
  getHost() {
    return this._getBackendHost()
  }


  /**
   * Get full URL for backend endpoint
   * @param {string} endpoint - Backend endpoint path
   * @returns {string} Full backend URL
   */
  getUrl(endpoint) {
    return `${this._getBackendHost()}${endpoint}`
  }

  /**
   * Get API endpoints
   * @returns {object} API endpoints configuration
   */
  getEndpoints() {
    return {
      HEALTH_CHECK: '/healthcheck',
      CYCLE_OVERVIEW: '/cycles/:id/overview',
      CYCLES_ROADMAP: '/cycles/roadmap',
    }
  }

  /**
   * Get cache configuration
   * @returns {object} Cache configuration
   */
  getCacheConfig() {
    return this.config.common.cache
  }

  /**
   * Get cache TTL
   * @returns {number} Cache TTL in milliseconds
   */
  getCacheTTL() {
    return this.config.common.cache.roadmapTTL
  }

  /**
   * Get Jira configuration
   * @returns {object} Jira configuration
   */
  getJiraConfig() {
    return this.config.backend.jira
  }

  /**
   * Check if fake cycle data is being used or whether are real data backend is used that is e.g. accesssing JIRA.
   * 
   * @returns {boolean} True if fake data is enabled
   */
  isUsingFakeCycleData() {
    return this.config.common.development.useFakeData || false
  }

  /**
   * Get stages configuration
   * @returns {array} Stages configuration
   */
  getStages() {
    return this.config.common.releaseStrategy.stages || []
  }

  /**
   * Get stage categories configuration
   * @returns {object} Stage categories configuration
   */
  getStageCategories() {
    return this.config.common.releaseStrategy.stageCategories || {}
  }

  /**
   * Get current environment configuration
   * @returns {object} Current environment configuration
   */
  getEnvironmentConfig() {
    return this.config.common.environments[this.environment] || this.config.common.environments.development
  }

  /**
   * Get organization configuration
   * @returns {object} Organization configuration (areas and teams)
   */
  getOrganisationConfig() {
    return this.config.common.organisation
  }

  /**
   * Get areas configuration
   * @returns {object} Areas configuration
   */
  getAreas() {
    return this.config.common.organisation.areas
  }

  /**
   * Get teams configuration
   * @returns {object} Teams configuration
   */
  getTeams() {
    return this.config.common.organisation.teams
  }

  /**
   * Get product strategy configuration
   * @returns {object} Product strategy configuration (themes, initiatives)
   */
  getProductStrategyConfig() {
    return this.config.common.productStrategy
  }

  /**
   * Get themes configuration
   * @returns {object} Themes configuration
   */
  getThemes() {
    return this.config.common.productStrategy.themes
  }

  /**
   * Get initiatives configuration
   * @returns {object} Initiatives configuration
   */
  getInitiatives() {
    return this.config.common.productStrategy.initiatives
  }


  /**
   * Check if a stage is a final release stage
   * @param {string} stage - Stage value to check
   * @returns {boolean} True if stage is final release
   */
  isFinalReleaseStage(stage) {
    return this.config.common.releaseStrategy.stageCategories.finalReleaseStage.includes(stage)
  }

  /**
   * Check if a stage is releasable
   * @param {string} stage - Stage value to check
   * @returns {boolean} True if stage is releasable
   */
  isReleasableStage(stage) {
    return this.config.common.releaseStrategy.stageCategories.releasableStage.includes(stage)
  }

  /**
   * Check if a stage is external
   * @param {string} stage - Stage value to check
   * @returns {boolean} True if stage is external
   */
  isExternalStage(stage) {
    return this.config.common.releaseStrategy.stageCategories.externalStages.includes(stage)
  }

  /**
   * Get release strategy configuration
   * @returns {object} Release strategy configuration
   */
  getReleaseStrategyConfig() {
    return this.config.common.releaseStrategy
  }

  /**
   * Get no prerelease allowed label
   * @returns {string} No prerelease allowed label
   */
  getNoPrereleaseAllowedLabel() {
    return this.config.common.releaseStrategy.noPrereleaseAllowedLabel
  }

  /**
   * Get item status configuration
   * @returns {object} Item status configuration
   */
  getItemStatusConfig() {
    return this.config.common.itemStatuses
  }

  /**
   * Get item status values
   * @returns {object} Item status values
   */
  getItemStatusValues() {
    return this.config.common.itemStatuses.values
  }

  /**
   * Get item status categories
   * @returns {object} Item status categories
   */
  getItemStatusCategories() {
    return this.config.common.itemStatuses.categories
  }

  /**
   * Check if status is finished
   * @param {string} status - Status value
   * @returns {boolean} True if status is finished
   */
  isFinishedStatus(status) {
    return this.config.common.itemStatuses.categories.finished.includes(status)
  }

  /**
   * Check if status is active
   * @param {string} status - Status value
   * @returns {boolean} True if status is active
   */
  isActiveStatus(status) {
    return this.config.common.itemStatuses.categories.active.includes(status)
  }

  /**
   * Check if status is future
   * @param {string} status - Status value
   * @returns {boolean} True if status is future
   */
  isFutureStatus(status) {
    return this.config.common.itemStatuses.categories.future.includes(status)
  }

  /**
   * Get frontend configuration
   * @returns {object} Frontend configuration
   */
  getFrontendConfig() {
    return this.config.frontend
  }

  /**
   * Get backend configuration
   * @returns {object} Backend configuration
   */
  getBackendConfig() {
    return this.config.backend
  }

  /**
   * Get common configuration (shared between frontend and backend)
   * @returns {object} Common configuration
   */
  getCommonConfig() {
    return this.config.common
  }


  /**
   * Get label translations (legacy method for backward compatibility)
   * @returns {object} Label translations in legacy format
   */
  getLabelTranslations() {
    return {
      areas: this.getAreas(),
      teams: this.getTeams(),
      themes: this.getThemes(),
      initiatives: this.getInitiatives()
    }
  }

  /**
   * Get validation dictionary
   * @returns {object} Validation dictionary
   */
  getValidationDictionary() {
    return validationDictionary
  }

  /**
   * Get a specific page by ID
   * @param {string} pageId - Page ID (e.g., 'CYCLE_OVERVIEW')
   * @returns {object} Page configuration object
   */
  getPage(pageId) {
    return this.config.frontend.pages[pageId]
  }


  /**
   * Check if running in development mode
   * @returns {boolean} True if development mode
   */
  isDevelopment() {
    return this.environment === 'development'
  }

  /**
   * Check if running in production mode
   * @returns {boolean} True if production mode
   */
  isProduction() {
    return this.environment === 'production'
  }
}
