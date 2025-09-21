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

import validationDictionary from './validation-dictionary.js';
import JiraConfig from './jira-config.js';
import { getEnvVarWithFallback } from './utils.js';
import type { 
  ProcessEnv, 
  ConfigOverrides, 
  OmegaConfigData, 
  CommonConfig, 
  FrontendConfig, 
  BackendConfig,
  JiraConfig as JiraConfigType,
  Page,
  ValidationRules
} from './types.js';

export default class OmegaConfig {
  private processEnv: ProcessEnv;
  private overrides: ConfigOverrides;
  private environment: string;
  private config: OmegaConfigData;

  constructor({ processEnv = {}, overrides = {} }: { processEnv?: ProcessEnv; overrides?: ConfigOverrides } = {}) {
    this.processEnv = processEnv;
    this.overrides = overrides;
    
    // Extract environment from overrides or processEnv, with fallback
    this.environment = overrides.environment || processEnv.NODE_ENV || 'development';
    
    // Initialize configuration
    this.config = this._initializeConfig();
    
    // Apply overrides
    this._applyOverrides();
  }

  /**
   * Initialize configuration based on environment
   * @private
   */
  private _initializeConfig(): OmegaConfigData {
    const config: OmegaConfigData = {
      // Environment
      environment: this.environment,
      
      // Common Configuration (shared between frontend and backend)
      common: {
        
        // Cache Configuration
        cache: {
          ttl: 5 * 60 * 1000  // 5 minutes
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
        getAllPages(): Page[] {
          return Object.values(this.pages);
        }
      },
      
      // Backend-specific Configuration
      backend: {
        // Will be populated if processEnv is provided
      }
    };

    // Add backend-specific configuration if processEnv is provided
    if (this.processEnv && Object.keys(this.processEnv).length > 0) {
      // Server Configuration
      config.backend.port = getEnvVarWithFallback(this.processEnv, 'PORT', '3000', 'Server port');
      config.backend.maxRetry = getEnvVarWithFallback(this.processEnv, 'MAX_RETRY', '3', 'Max retry count');
      config.backend.delayBetweenRetry = getEnvVarWithFallback(this.processEnv, 'DELAY_BETWEEN_RETRY', '2', 'Retry delay');
      
      // Jira Configuration (backend-specific) - using JiraConfig class
      const useFakeData = this._getUseFakeData();
      // Update the common config with the actual useFakeData value
      config.common.development.useFakeData = useFakeData;
      const jiraConfig = new JiraConfig(this.processEnv, useFakeData);
      config.backend.jira = jiraConfig.getConfig();
      config.backend.useFakeData = useFakeData;
    }

    return config;
  }

  /**
   * Apply configuration overrides
   * @private
   */
  private _applyOverrides(): void {
    if (this.overrides) {
      this.config = this._deepMerge(this.config, this.overrides);
    }
  }

  /**
   * Deep merge objects
   * @private
   */
  private _deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Check if fake data should be used
   * @private
   */
  private _getUseFakeData(): boolean {
    const useFakeData = getEnvVarWithFallback(this.processEnv, 'USE_FAKE_DATA', 'false', 'Fake data mode');
    return useFakeData === 'true' || useFakeData === '1';
  }

  /**
   * Get backend host based on environment
   * @private
   */
  private _getBackendHost(): string {
    // Check for environment variable first
    const envBackendHost = this.processEnv.API_HOST || this.processEnv.REACT_APP_API_HOST;
    if (envBackendHost) {
      return envBackendHost;
    }
    
    // Fall back to environment-specific defaults
    const environmentConfig = this.config.common.environments[this.environment as keyof typeof this.config.common.environments];
    if (environmentConfig && environmentConfig.backendHost) {
      return environmentConfig.backendHost;
    }
    
    // Final fallback to development
    return this.config.common.environments.development.backendHost || 'http://localhost:3000';
  }

  /**
   * Get configuration value by key
   * @param key - Configuration key (supports dot notation)
   * @returns Configuration value
   */
  get(key: string): any {
    return key.split('.').reduce((obj: any, k) => obj?.[k], this.config);
  }

  /**
   * Set configuration value by key
   * @param key - Configuration key (supports dot notation)
   * @param value - Configuration value
   */
  set(key: string, value: any): void {
    const keys = key.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((obj, k) => {
      if (!obj[k]) obj[k] = {};
      return obj[k];
    }, this.config as any);
    target[lastKey] = value;
  }

  /**
   * Get full configuration object
   * @returns Full configuration
   */
  getConfig(): OmegaConfigData {
    return this.config;
  }

  /**
   * Get backend host
   * @returns Backend host URL
   */
  getHost(): string {
    return this._getBackendHost();
  }

  /**
   * Get full URL for backend endpoint
   * @param endpoint - Backend endpoint path
   * @returns Full backend URL
   */
  getUrl(endpoint: string): string {
    return `${this._getBackendHost()}${endpoint}`;
  }

  /**
   * Get API endpoints
   * @returns API endpoints configuration
   */
  getEndpoints(): { HEALTH_CHECK: string; CYCLE_DATA: string } {
    return {
      HEALTH_CHECK: '/healthcheck',
      CYCLE_DATA: '/cycle-data',
    };
  }

  /**
   * Get cache configuration
   * @returns Cache configuration
   */
  getCacheConfig(): { ttl: number } {
    return this.config.common.cache;
  }

  /**
   * Get cache TTL
   * @returns Cache TTL in milliseconds
   */
  getCacheTTL(): number {
    return this.config.common.cache.ttl;
  }

  /**
   * Get Jira configuration
   * @returns Jira configuration
   */
  getJiraConfig(): JiraConfigType | undefined {
    return this.config.backend.jira;
  }

  /**
   * Check if fake cycle data is being used or whether are real data backend is used that is e.g. accesssing JIRA.
   * 
   * @returns True if fake data is enabled
   */
  isUsingFakeCycleData(): boolean {
    return this.config.common.development.useFakeData || false;
  }

  /**
   * Get stages configuration
   * @returns Stages configuration
   */
  getStages(): Array<{ name: string; value: string }> {
    return this.config.common.releaseStrategy.stages || [];
  }

  /**
   * Get stage categories configuration
   * @returns Stage categories configuration
   */
  getStageCategories(): { finalReleaseStage: string[]; releasableStage: string[]; externalStages: string[] } {
    return this.config.common.releaseStrategy.stageCategories || { finalReleaseStage: [], releasableStage: [], externalStages: [] };
  }

  /**
   * Get current environment configuration
   * @returns Current environment configuration
   */
  getEnvironmentConfig(): { backendHost: string | null; timeout: number; retries: number; retryDelay: number } {
    return this.config.common.environments[this.environment as keyof typeof this.config.common.environments] || this.config.common.environments.development;
  }

  /**
   * Get organization configuration
   * @returns Organization configuration (areas and teams)
   */
  getOrganisationConfig(): { areas: Record<string, string>; teams: Record<string, string> } {
    return this.config.common.organisation;
  }

  /**
   * Get areas configuration
   * @returns Areas configuration
   */
  getAreas(): Record<string, string> {
    return this.config.common.organisation.areas;
  }

  /**
   * Get teams configuration
   * @returns Teams configuration
   */
  getTeams(): Record<string, string> {
    return this.config.common.organisation.teams;
  }

  /**
   * Get product strategy configuration
   * @returns Product strategy configuration (themes, initiatives)
   */
  getProductStrategyConfig(): { themes: Record<string, string>; initiatives: Record<string, string> } {
    return this.config.common.productStrategy;
  }

  /**
   * Get themes configuration
   * @returns Themes configuration
   */
  getThemes(): Record<string, string> {
    return this.config.common.productStrategy.themes;
  }

  /**
   * Get initiatives configuration
   * @returns Initiatives configuration
   */
  getInitiatives(): Record<string, string> {
    return this.config.common.productStrategy.initiatives;
  }

  /**
   * Check if a stage is a final release stage
   * @param stage - Stage value to check
   * @returns True if stage is final release
   */
  isFinalReleaseStage(stage: string): boolean {
    return this.config.common.releaseStrategy.stageCategories.finalReleaseStage.includes(stage);
  }

  /**
   * Check if a stage is releasable
   * @param stage - Stage value to check
   * @returns True if stage is releasable
   */
  isReleasableStage(stage: string): boolean {
    return this.config.common.releaseStrategy.stageCategories.releasableStage.includes(stage);
  }

  /**
   * Check if a stage is external
   * @param stage - Stage value to check
   * @returns True if stage is external
   */
  isExternalStage(stage: string): boolean {
    return this.config.common.releaseStrategy.stageCategories.externalStages.includes(stage);
  }

  /**
   * Get release strategy configuration
   * @returns Release strategy configuration
   */
  getReleaseStrategyConfig(): { stages: Array<{ name: string; value: string }>; stageCategories: { finalReleaseStage: string[]; releasableStage: string[]; externalStages: string[] }; noPrereleaseAllowedLabel: string } {
    return this.config.common.releaseStrategy;
  }

  /**
   * Get no prerelease allowed label
   * @returns No prerelease allowed label
   */
  getNoPrereleaseAllowedLabel(): string {
    return this.config.common.releaseStrategy.noPrereleaseAllowedLabel;
  }

  /**
   * Get item status configuration
   * @returns Item status configuration
   */
  getItemStatusConfig(): { values: { TODO: string; IN_PROGRESS: string; DONE: string; CANCELLED: string; POSTPONED: string }; categories: { finished: string[]; active: string[]; future: string[] } } {
    return this.config.common.itemStatuses;
  }

  /**
   * Get item status values
   * @returns Item status values
   */
  getItemStatusValues(): { TODO: string; IN_PROGRESS: string; DONE: string; CANCELLED: string; POSTPONED: string } {
    return this.config.common.itemStatuses.values;
  }

  /**
   * Get item status categories
   * @returns Item status categories
   */
  getItemStatusCategories(): { finished: string[]; active: string[]; future: string[] } {
    return this.config.common.itemStatuses.categories;
  }

  /**
   * Check if status is finished
   * @param status - Status value
   * @returns True if status is finished
   */
  isFinishedStatus(status: string): boolean {
    return this.config.common.itemStatuses.categories.finished.includes(status);
  }

  /**
   * Check if status is active
   * @param status - Status value
   * @returns True if status is active
   */
  isActiveStatus(status: string): boolean {
    return this.config.common.itemStatuses.categories.active.includes(status);
  }

  /**
   * Check if status is future
   * @param status - Status value
   * @returns True if status is future
   */
  isFutureStatus(status: string): boolean {
    return this.config.common.itemStatuses.categories.future.includes(status);
  }

  /**
   * Get frontend configuration
   * @returns Frontend configuration
   */
  getFrontendConfig(): FrontendConfig {
    return this.config.frontend;
  }

  /**
   * Get backend configuration
   * @returns Backend configuration
   */
  getBackendConfig(): BackendConfig {
    return this.config.backend;
  }

  /**
   * Get common configuration (shared between frontend and backend)
   * @returns Common configuration
   */
  getCommonConfig(): CommonConfig {
    return this.config.common;
  }

  /**
   * Get label translations (legacy method for backward compatibility)
   * @returns Label translations in legacy format
   */
  getLabelTranslations(): { areas: Record<string, string>; teams: Record<string, string>; themes: Record<string, string>; initiatives: Record<string, string> } {
    return {
      areas: this.getAreas(),
      teams: this.getTeams(),
      themes: this.getThemes(),
      initiatives: this.getInitiatives()
    };
  }

  /**
   * Get validation dictionary
   * @returns Validation dictionary
   */
  getValidationDictionary(): ValidationRules {
    return validationDictionary;
  }

  /**
   * Get a specific page by ID
   * @param pageId - Page ID (e.g., 'CYCLE_OVERVIEW')
   * @returns Page configuration object
   */
  getPage(pageId: string): Page | undefined {
    return this.config.frontend.pages[pageId as keyof typeof this.config.frontend.pages];
  }

  /**
   * Check if running in development mode
   * @returns True if development mode
   */
  isDevelopment(): boolean {
    return this.environment === 'development';
  }

  /**
   * Check if running in production mode
   * @returns True if production mode
   */
  isProduction(): boolean {
    return this.environment === 'production';
  }
}
