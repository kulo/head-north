/**
 * Cycle Data Service
 * Centralized service for cycle and roadmap data with error handling and retry logic
 *
 * This service handles communication between the frontend and the backend API
 * for cycle-related data operations. All endpoints are defined in the shared configuration.
 */

import { logger } from "@omega/utils";
import type { OmegaConfig } from "@omega/config";
import type {
  Cycle,
  CycleId,
  Initiative,
  Person,
  Area,
  Stage,
  RawCycleData,
  CycleData,
} from "@omega/types";

/**
 * Cycle Data Service
 *
 * Centralized service for managing cycle and roadmap data with comprehensive caching,
 * error handling, and retry logic. This service acts as the primary data layer between
 * the frontend application and the backend API.
 *
 * ## Purpose
 * - Provides unified access to cycle, roadmap, and organizational data
 * - Implements intelligent caching to minimize API calls and improve performance
 * - Handles data transformation from raw backend responses to frontend-ready formats
 * - Manages error handling and retry logic for robust data fetching
 *
 * ## Data Flow
 * ```
 * Backend API → CycleDataService → Frontend Components
 *     ↓              ↓                    ↓
 * RawCycleData → Cached Data → Processed UI Data
 * ```
 *
 * @class CycleDataService
 * @since 1.0.0
 */
class CycleDataService {
  #config: OmegaConfig;
  #cachedCycleData: CycleData | null;
  #cacheTimestamp: number | null;
  #cacheTTL: number;
  #apiTimeout: number;
  #apiRetries: number;

  constructor(omegaConfig: OmegaConfig) {
    if (!omegaConfig) {
      throw new Error(
        "CycleDataService requires an OmegaConfig instance to be injected",
      );
    }
    this.#config = omegaConfig;

    // Unified cache management - single cache for all data
    this.#cachedCycleData = null;
    this.#cacheTimestamp = null;
    this.#cacheTTL = this.#config.getCacheTTL();
    this.#apiTimeout = this.#config.getEnvironmentConfig().timeout;
    this.#apiRetries = this.#config.getEnvironmentConfig().retries;
  }

  /**
   * Check if unified cache is still valid
   * @returns True if cache is valid
   */
  #isCacheValid(): boolean {
    if (!this.#cachedCycleData || !this.#cacheTimestamp) return false;
    return Date.now() - this.#cacheTimestamp < this.#cacheTTL;
  }

  /**
   * Clear unified cache
   */
  clearCache() {
    this.#cachedCycleData = null;
    this.#cacheTimestamp = null;
  }

  /**
   * Transform raw cycle data to processed cycle data for frontend consumption
   * @param {RawCycleData} rawData - Raw data from backend
   * @returns {CycleData} Processed data ready for frontend
   */
  #transformRawToProcessed(rawData: RawCycleData): CycleData {
    return {
      cycles: rawData.cycles, // Return raw cycles without progress calculations
      roadmapItems: rawData.roadmapItems,
      releaseItems: rawData.releaseItems,
      areas: Object.values(rawData.areas), // Convert Record<string, Area> to Area[]
      initiatives: rawData.initiatives,
      assignees: rawData.assignees,
      stages: rawData.stages, // Keep Stage[] as-is
    };
  }

  /**
   * Get cached cycle data with automatic loading
   * This method handles all cache management internally
   * @returns {Promise<CycleData>} The cycle data
   */
  async #getCachedCycleData(): Promise<CycleData> {
    // Check if unified cache is still valid
    if (this.#isCacheValid()) {
      return this.#cachedCycleData!;
    } else {
      const cycleData = await this.#loadCycleData();
      this.#cachedCycleData = cycleData;
      this.#cacheTimestamp = Date.now();
      return cycleData;
    }
  }

  /**
   * Load cycle data from the API and transform it
   * This method fetches data from the API and transforms it for caching
   * @returns {Promise<CycleData>} The fetched and transformed cycle data
   */
  async #loadCycleData(): Promise<CycleData> {
    const endpoints = this.#config.getEndpoints();
    const rawData: RawCycleData = await this.#request(endpoints.CYCLE_DATA);

    return this.#transformRawToProcessed(rawData);
  }

  /**
   * Make an HTTP request with error handling and retry logic
   * @param {string} endpoint - The API endpoint
   * @param {object} options - Fetch options
   * @returns {Promise<any>} The response data
   */
  async #request(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<RawCycleData> {
    const url = this.#config.getUrl(endpoint);

    const defaultOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: this.#apiTimeout,
    };

    const requestOptions = { ...defaultOptions, ...options };

    const errors = [];
    for (let attempt = 1; attempt <= this.#apiRetries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data as RawCycleData;
      } catch (error) {
        const errorInfo = {
          attempt,
          error: error.message || error.toString(),
          timestamp: new Date().toISOString(),
        };
        errors.push(errorInfo);
        logger.service.warnSafe(
          `API request attempt ${attempt} failed`,
          error,
          { attempt },
        );

        if (attempt < this.#apiRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // Show all errors that occurred during retry attempts
    const errorSummary = errors
      .map((e) => `Attempt ${e.attempt}: ${e.error}`)
      .join("; ");
    const finalErrorMessage = `API request failed after ${this.#apiRetries} attempts. Errors: ${errorSummary}`;
    throw new Error(finalErrorMessage);
  }

  /**
   * Get all initiatives from the unified data
   * @returns {Promise<Initiative[]>} Array of initiatives with id and name properties
   */
  async getAllInitiatives(): Promise<readonly Initiative[]> {
    const data = await this.#getCachedCycleData();
    return data.initiatives;
  }

  /**
   * Get config areas for translations
   * @returns {Area[]} Array of config areas
   */
  #getConfigAreas(): Area[] {
    const config = this.#config.getAreas();
    return Object.entries(config).map(([id, name]) => ({
      id,
      name,
      teams: [],
    }));
  }

  /**
   * Get all areas from appropriate data source union with areas from the configuration.   *
   * @returns {Promise<Area[]>} Array of areas with id and name properties
   */
  async getAllAreas(_cycleId: CycleId | null = null): Promise<Area[]> {
    const areasFromCycles = (await this.#getCachedCycleData()).areas;
    const areasFromConfig = this.#getConfigAreas();
    const allAreas = new Set([...areasFromCycles, ...areasFromConfig]);
    return Array.from(allAreas);
  }

  /**
   * Get all cycles from the unified data
   * @returns {Promise<Cycle[]>} Array of cycles
   */
  async getAllCycles(): Promise<readonly Cycle[]> {
    const data = await this.#getCachedCycleData();
    return data.cycles;
  }

  /**
   * Get all stages from the unified data
   * @returns {Promise<Stage[]>} Array of stages
   */
  async getAllStages(): Promise<readonly Stage[]> {
    const data = await this.#getCachedCycleData();
    return data.stages;
  }

  /**
   * Get all assignees from the organisation
   * @returns {Promise<Person[]>} Array of assignees
   */
  async getAllAssignees(): Promise<readonly Person[]> {
    const data = await this.#getCachedCycleData();
    return data.assignees;
  }

  /**
   * Get cycle data with automatic loading
   * This is the main method for getting data - it handles loading automatically
   * @returns {Promise<CycleData>} Processed cycle data structure
   */
  async getCycleData(): Promise<CycleData> {
    // Get cached data (already transformed)
    return await this.#getCachedCycleData();
  }
}

export default CycleDataService;
