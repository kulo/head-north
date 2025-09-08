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
 *   const config = new OmegaConfig('development')
 *   const apiHost = config.getHost()
 *   const endpoints = config.getEndpoints()
 */

import labelTranslations from './label-translations.js'
import validationDictionary from './validation-dictionary.js'

export default class OmegaConfig {
  constructor(environment = 'development', processEnv = {}, overrides = {}) {
    this.environment = environment
    this.processEnv = processEnv
    this.overrides = overrides
    
    // Initialize configuration
    this.config = this._initializeConfig()
    
    // Create FrontendConfig property for easier access
    this.FrontendConfig = this.config.frontend
    
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
      
      // API Configuration
      api: {
        host: this._getApiHost(),
        timeout: 30000,
        retries: 3,
        retryDelay: 1000
      },
      
      // Cache Configuration
      cache: {
        ttl: 5 * 60 * 1000, // 5 minutes
        roadmapTTL: 5 * 60 * 1000, // 5 minutes
        defaultTTL: 2 * 60 * 1000  // 2 minutes
      },
      
      // Frontend Configuration
      frontend: {
        pages: {
          CYCLE_OVERVIEW: { id: 'cycle-overview', path: '/cycles/overview', name: 'Cycle Overview' },
          ROADMAP: { id: 'roadmap', path: '/cycles/roadmap', name: 'Roadmap' },
          ROOT: { id: 'root', path: '/', name: 'Omega Home' }
        },
        getAllPages() {
          return Object.values(this.pages)
        }
      }
    }

    // Add Node.js specific configuration if available
    if (typeof process !== 'undefined' && process.env) {
      config.port = parseInt(process.env.PORT) || 3000
      config.maxRetry = parseInt(process.env.MAX_RETRY) || 3
      config.delayBetweenRetry = parseInt(process.env.DELAY_BETWEEN_RETRY) || 2
      config.jiraUser = process.env.JIRA_USER || null
      config.jiraToken = process.env.JIRA_TOKEN || null
      config.jiraHost = process.env.JIRA_HOST || null
      
      // Jira Configuration
      config.jira = {
        user: config.jiraUser,
        token: config.jiraToken,
        host: config.jiraHost,
        boardId: 825,
        fields: {
          epic: 'customfield_10014',
          sprint: 'customfield_10020',
          storyPoints: 'customfield_10016'
        },
        limits: {
          maxResults: 1000,
          maxIssuesPerRequest: 100
        }
      }
      
      // Stages Configuration
      config.stages = [
        { name: 'To Do', value: 'To Do' },
        { name: 'In Progress', value: 'In Progress' },
        { name: 'Done', value: 'Done' },
        { name: 'Blocked', value: 'Blocked' }
      ]
    }

    return config
  }

  /**
   * Get API host based on environment
   * @private
   */
  _getApiHost() {
    if (this.environment === 'production') {
      return 'https://api.omega.com'
    } else if (this.environment === 'staging') {
      return 'https://staging-api.omega.com'
    } else {
      return 'http://localhost:3000'
    }
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
   * Get API host
   * @returns {string} API host URL
   */
  getHost() {
    return this.config.api.host
  }

  /**
   * Set API host
   * @param {string} host - API host URL
   */
  setHost(host) {
    this.config.api.host = host
  }

  /**
   * Get full URL for endpoint
   * @param {string} endpoint - Endpoint path
   * @returns {string} Full URL
   */
  getUrl(endpoint) {
    return `${this.config.api.host}${endpoint}`
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
    return this.config.cache
  }

  /**
   * Get cache TTL
   * @returns {number} Cache TTL in milliseconds
   */
  getCacheTTL() {
    return this.config.cache.roadmapTTL
  }

  /**
   * Get Jira configuration
   * @returns {object} Jira configuration
   */
  getJiraConfig() {
    return this.config.jira
  }

  /**
   * Get stages configuration
   * @returns {array} Stages configuration
   */
  getStages() {
    return this.config.stages || []
  }

  /**
   * Get frontend configuration
   * @returns {object} Frontend configuration
   */
  getFrontendConfig() {
    return this.config.frontend
  }


  /**
   * Get label translations
   * @returns {object} Label translations
   */
  getLabelTranslations() {
    return labelTranslations
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
    return this.FrontendConfig.pages[pageId]
  }

  /**
   * Get configuration value by key
   * @param {string} key - Configuration key
   * @returns {any} Configuration value
   */
  get(key) {
    return this.config[key]
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
