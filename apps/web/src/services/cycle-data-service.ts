/**
 * Cycle Data Service
 * Centralized service for cycle and roadmap data with error handling and retry logic
 *
 * This service handles communication between the frontend and the backend API
 * for cycle-related data operations. All endpoints are defined in the shared configuration.
 */

import {
  Either,
  EitherAsync,
  logger,
  Maybe,
  retryWithBackoff,
  Right,
  safeAsync,
} from "@headnorth/utils";
import type { HeadNorthConfig } from "@headnorth/config";
import type {
  Cycle,
  Initiative,
  Person,
  Area,
  Stage,
  RawCycleData,
  CycleData,
} from "@headnorth/types";

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
// Immutable cache state
type CycleDataCache = {
  readonly data: CycleData;
  readonly timestamp: number;
};

class CycleDataService {
  readonly #config: HeadNorthConfig;
  readonly #cacheTTL: number;
  readonly #apiTimeout: number;
  readonly #apiRetries: number;
  // Use Maybe for optional immutable cache
  #cache: Maybe<CycleDataCache>;

  constructor(headNorthConfig: HeadNorthConfig) {
    this.#config = headNorthConfig;

    // Initialize with empty cache (Maybe.Nothing)
    this.#cache = Maybe.empty();
    this.#cacheTTL = this.#config.getCacheTTL();
    this.#apiTimeout = this.#config.getEnvironmentConfig().timeout;
    this.#apiRetries = this.#config.getEnvironmentConfig().retries;
  }

  /**
   * Check if unified cache is still valid
   * @returns True if cache is valid
   */
  #isCacheValid(): boolean {
    return this.#cache
      .map((cache) => Date.now() - cache.timestamp < this.#cacheTTL)
      .orDefault(false);
  }

  /**
   * Clear unified cache (creates new empty Maybe)
   */
  clearCache(): void {
    this.#cache = Maybe.empty();
  }

  /**
   * Transform raw cycle data to processed cycle data for frontend consumption
   *
   * TODO check whether we can change RawCycleData to CycleData in the backend and remove this method and the RawCycleData type
   *
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
   * This method handles all cache management internally using Maybe for safe cache access
   * @returns {Promise<Either<Error, CycleData>>} The cycle data wrapped in Either
   */
  async #getCachedCycleData(): Promise<Either<Error, CycleData>> {
    // Check if unified cache is still valid using Maybe
    const cachedData: Maybe<CycleData> = this.#cache
      .filter(() => this.#isCacheValid())
      .map((cache) => cache.data);

    return cachedData.caseOf({
      Just: (data) => Promise.resolve(Right(data)),

      Nothing: async () => {
        // Cache invalid or empty - load new data and create immutable cache state
        const loadedCycleData = await this.#loadCycleData();

        // Update cache only on success, maintaining Either chain
        return loadedCycleData.map((cycleData) => {
          const newCacheState: CycleDataCache = {
            data: cycleData,
            timestamp: Date.now(),
          };

          // Create new Maybe with fresh cache (immutable update)
          this.#cache = Maybe.of(newCacheState);
          return cycleData;
        });
      },
    });
  }

  /**
   * Load cycle data from the API and transform it
   * This method fetches data from the API and transforms it for caching
   * @returns {Promise<Either<Error, CycleData>>} The fetched and transformed cycle data wrapped in Either
   */
  async #loadCycleData(): Promise<Either<Error, CycleData>> {
    const rawData = await this.#request(this.#config.getEndpoints().CYCLE_DATA);
    const cycleData = rawData.map(this.#transformRawToProcessed);
    return cycleData;
  }

  /**
   * Fetch and parse HTTP response using functional error handling
   * Handles fetch errors, HTTP error responses, and JSON parsing errors with Either
   * @param {string} url - The full URL to fetch
   * @param {RequestInit} requestOptions - Fetch request options
   * @returns {Promise<Either<Error, RawCycleData>>} The parsed response data wrapped in Either
   */
  async #fetchAndParseResponse(
    url: string,
    requestOptions: RequestInit,
  ): Promise<Either<Error, RawCycleData>> {
    return EitherAsync<Error, RawCycleData>(async ({ fromPromise, throwE }) => {
      const response = await fromPromise(
        safeAsync(() => fetch(url, requestOptions)),
      );

      if (!response.ok) {
        throwE(new Error(`HTTP ${response.status}: ${response.statusText}`));
      }

      const data = await fromPromise(
        safeAsync(() => response.json() as Promise<RawCycleData>),
      );

      return data;
    }).run();
  }

  /**
   * Make an HTTP request with error handling and retry logic
   * Uses functional retry pattern with Either for error handling
   * @param {string} endpoint - The API endpoint
   * @param {object} options - Fetch options
   * @returns {Promise<Either<Error, RawCycleData>>} The response data wrapped in Either
   */
  async #request(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<Either<Error, RawCycleData>> {
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

    // Use functional retry utility with Either
    return retryWithBackoff(
      () => this.#fetchAndParseResponse(url, requestOptions),
      {
        maxRetries: this.#apiRetries,
        minTimeout: 1000,
        factor: 2,
        onRetry: (error, attempt) => {
          // Log the attempt failure
          logger.service.warnSafe(
            `API request attempt ${attempt} failed`,
            error,
            { attempt },
          );
        },
      },
    );
  }

  /**
   * Get all initiatives from the unified data
   * @returns {Promise<Either<Error, readonly Initiative[]>>} Array of initiatives with id and name properties wrapped in Either
   */
  async getAllInitiatives(): Promise<Either<Error, readonly Initiative[]>> {
    const data = await this.#getCachedCycleData();
    return data.map((data) => data.initiatives);
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
   * Get all areas from appropriate data source union with areas from the configuration.
   * @returns {Promise<Either<Error, Area[]>>} Array of areas with id and name properties wrapped in Either
   */
  async getAllAreas(): Promise<Either<Error, Area[]>> {
    const data = await this.#getCachedCycleData();
    return data.map((data) => {
      const areasFromCycles = data.areas;
      const areasFromConfig = this.#getConfigAreas();
      const allAreas = new Set([...areasFromCycles, ...areasFromConfig]);
      return Array.from(allAreas);
    });
  }

  /**
   * Get all cycles from the unified data
   * @returns {Promise<Either<Error, readonly Cycle[]>>} Array of cycles wrapped in Either
   */
  async getAllCycles(): Promise<Either<Error, readonly Cycle[]>> {
    const data = await this.#getCachedCycleData();
    return data.map((data) => data.cycles);
  }

  /**
   * Get all stages from the unified data
   * @returns {Promise<Either<Error, readonly Stage[]>>} Array of stages wrapped in Either
   */
  async getAllStages(): Promise<Either<Error, readonly Stage[]>> {
    const data = await this.#getCachedCycleData();
    return data.map((data) => data.stages);
  }

  /**
   * Get all assignees from the organisation
   * @returns {Promise<Either<Error, readonly Person[]>>} Array of assignees wrapped in Either
   */
  async getAllAssignees(): Promise<Either<Error, readonly Person[]>> {
    const data = await this.#getCachedCycleData();
    return data.map((data) => data.assignees);
  }

  /**
   * Get cycle data with automatic loading
   * This is the main method for getting data - it handles loading automatically
   * @returns {Promise<Either<Error, CycleData>>} Processed cycle data structure wrapped in Either
   */
  async getCycleData(): Promise<Either<Error, CycleData>> {
    // Get cached data (already transformed)
    return await this.#getCachedCycleData();
  }
}

export default CycleDataService;
