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
  CycleWithProgress,
  Initiative,
  Assignee,
  Area,
  Stage,
  RawData,
} from "@omega/types";

class CycleDataService {
  private config: OmegaConfig;
  private _unifiedCache: RawData | null;
  private _cacheTimestamp: number | null;
  private _cacheTTL: number;
  private _apiTimeout: number;
  private _apiRetries: number;
  private _apiAttempts: number;

  constructor(omegaConfig: OmegaConfig) {
    if (!omegaConfig) {
      throw new Error(
        "CycleDataService requires an OmegaConfig instance to be injected",
      );
    }
    this.config = omegaConfig;

    // Unified cache management - single cache for all data
    this._unifiedCache = null;
    this._cacheTimestamp = null;
    this._cacheTTL = this.config.getCacheTTL();
    this._apiTimeout = this.config.getEnvironmentConfig().timeout;
    this._apiRetries = this.config.getEnvironmentConfig().retries;
    this._apiAttempts = this.config.getEnvironmentConfig().retries || 3;
  }

  /**
   * Check if unified cache is still valid
   * @returns True if cache is valid
   * @private
   */
  private _isCacheValid(): boolean {
    if (!this._unifiedCache || !this._cacheTimestamp) return false;
    return Date.now() - this._cacheTimestamp < this._cacheTTL;
  }

  /**
   * Clear unified cache
   * @private
   */
  _clearCache() {
    this._unifiedCache = null;
    this._cacheTimestamp = null;
  }

  /**
   * Set cache timestamp when any data is cached
   * @private
   */
  _setCacheTimestamp() {
    this._cacheTimestamp = Date.now();
  }

  /**
   * Get cycle data with caching
   * @returns {Promise<object>} The cycle data
   * @private
   */
  async _getCycleData() {
    // Check if unified cache is still valid
    if (this._isCacheValid()) {
      return this._unifiedCache;
    }

    // Clear cache if invalid
    this._clearCache();

    // Fetch fresh data from cycle-data endpoint
    const endpoints = this.config.getEndpoints();
    const cycleData = await this._request(endpoints.CYCLE_DATA);

    // Cache the cycle data
    this._unifiedCache = cycleData;
    this._setCacheTimestamp();

    return cycleData;
  }

  /**
   * Make an HTTP request with error handling and retry logic
   * @param {string} endpoint - The API endpoint
   * @param {object} options - Fetch options
   * @returns {Promise<any>} The response data
   */
  async _request(endpoint, options = {}) {
    const url = this.config.getUrl(endpoint);

    const defaultOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: this._apiTimeout,
    };

    const requestOptions = { ...defaultOptions, ...options };

    const errors = [];
    for (let attempt = 1; attempt <= this._apiRetries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
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

        if (attempt < this._apiRetries) {
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
    const finalErrorMessage = `API request failed after ${this._apiRetries} attempts. Errors: ${errorSummary}`;
    throw new Error(finalErrorMessage);
  }

  /**
   * Get overview data for all cycles
   * This is the main data source for the Area component
   * @returns {Promise<object>} Cycle overview data with all cycles
   */
  async getOverviewForCycle() {
    // Use cycle cache - all data is available in the cycle structure
    const data = await this._getCycleData();

    // Return the full unified data as it contains all cycles
    return data;
  }

  /**
   * Get cycles roadmap data showing past, current, and future cycles
   * Used by the Roadmap component
   * @returns {Promise<object>} Cycles roadmap data
   */
  async getCyclesRoadmap() {
    // Use unified cache - all data is available in the unified structure
    return this._getCycleData();
  }

  /**
   * Get all initiatives from the unified data
   * @param {string|number} cycleId - The cycle ID to get initiatives for
   * @returns {Promise<Array>} Array of initiatives with id and name properties
   */
  async getAllInitiatives(cycleId = null) {
    const data = await this.getOverviewForCycle();
    const initiatives = data.initiatives || [];

    // Return initiatives as they are (already in correct format from backend)
    return initiatives;
  }

  /**
   * Extract area IDs from unified data
   * @param {object} data - Unified data from backend
   * @returns {Array<string>} Array of area IDs
   * @private
   */
  _extractAreasFromData(data) {
    // Handle simplified data structure (areas is now directly available)
    if (data.areas && Array.isArray(data.areas)) {
      return data.areas.map((area) => area.id); // Get area IDs
    }

    return [];
  }

  /**
   * Get config areas for translations
   * @returns {Array<{id: string, name: string}>} Array of config areas
   * @private
   */
  _getConfigAreas() {
    const config = this.config.getAreas();
    return Object.entries(config).map(([id, name]) => ({ id, name }));
  }

  /**
   * Create union of backend areas and config areas with proper fallbacks
   * @param {Array<string>} backendAreaIds - Area IDs from backend
   * @param {Array<{id: string, name: string}>} configAreas - Config areas with translations
   * @returns {Array<{id: string, name: string}>} Union of areas with fallbacks
   * @private
   */
  _createAreaUnion(backendAreaIds, configAreas) {
    const areaMap = new Map();

    // Add config areas first (for translations)
    configAreas.forEach((area) => {
      areaMap.set(area.id, area.name);
    });

    // Add backend areas (IDs only, use config name if available)
    backendAreaIds.forEach((areaId) => {
      if (!areaMap.has(areaId)) {
        areaMap.set(areaId, areaId); // Use ID as fallback name
      }
    });

    // Convert to array format
    return Array.from(areaMap.entries()).map(([id, name]) => ({ id, name }));
  }

  /**
   * Get all areas from appropriate data source with config fallbacks
   * @param {string|number} cycleId - The cycle ID to get areas for
   * @returns {Promise<Array>} Array of areas with id and name properties
   */
  async getAllAreas(cycleId = null) {
    try {
      // Get areas from unified data source
      const sourceData = await this._getCycleData();

      // Extract areas directly from simplified backend data
      if (sourceData.areas && Array.isArray(sourceData.areas)) {
        return sourceData.areas.map((area) => ({
          id: area.id,
          name: area.name || area.id,
        }));
      }

      // Fallback to config areas if backend data is not available
      return this._getConfigAreas();
    } catch (error) {
      // Fallback to config only if backend fails
      return this._getConfigAreas();
    }
  }

  /**
   * Get all cycles from the unified data
   * @returns {Promise<Array>} Array of cycles
   */
  async getAllCycles() {
    const data = await this._getCycleData();
    return data.cycles || [];
  }

  /**
   * Get all stages from the unified data
   * @returns {Promise<Array>} Array of stages
   */
  async getAllStages() {
    const data = await this._getCycleData();
    return data.stages || [];
  }

  /**
   * Get all teams from all areas in the organisation
   * @returns {Promise<Array>} Array of all teams across all areas
   */
  async getAllTeams() {
    const data = await this._getCycleData();
    const areas = data.areas || [];

    const allTeams = [];
    areas.forEach((areaData) => {
      if (areaData.teams && Array.isArray(areaData.teams)) {
        areaData.teams.forEach((team) => {
          allTeams.push({
            ...team,
            areaId: areaData.id,
            areaName: areaData.name || areaData.id,
          });
        });
      }
    });

    return allTeams;
  }

  /**
   * Get teams for a specific area
   * @param {string} areaId - The area ID to get teams for
   * @returns {Promise<Array>} Array of teams for the specified area
   */
  async getTeamsForArea(areaId) {
    const data = await this._getCycleData();
    const areas = data.areas || [];
    const area = areas.find((a) => a.id === areaId);

    if (!area || !area.teams) {
      return [];
    }

    return area.teams.map((team) => ({
      ...team,
      areaId,
      areaName: area.name || areaId,
    }));
  }

  /**
   * Get organisation data (areas with teams and assignees)
   * @returns {Promise<object>} Organisation data structure
   */
  async getOrganisationData() {
    const data = await this._getCycleData();
    return {
      areas: data.areas || [],
      assignees: data.assignees || [],
    };
  }

  /**
   * Get all assignees from the organisation
   * @returns {Promise<Array>} Array of assignees
   */
  async getAllAssignees() {
    const data = await this._getCycleData();
    const assignees = data.assignees || [];
    return assignees.map((assignee) => ({
      id: assignee.accountId,
      name: assignee.displayName,
    }));
  }

  /**
   * Get cycle data directly from the cycle-data endpoint
   * This is the new preferred method for getting data
   * @returns {Promise<object>} Cycle data structure
   */
  async getCycleData() {
    // Always use cached data since we fetch all data at once
    return this._getCycleData();
  }

  /**
   * Get active cycles from the unified data
   * @returns {Promise<Array>} Array of active cycles
   */
  async getActiveCycles() {
    const data = await this._getCycleData();
    const cycles = data.cycles || [];
    return cycles.filter((cycle) => cycle.state === "active");
  }

  /**
   * Get the oldest active cycle from the unified data
   * @returns {Promise<object|null>} The oldest active cycle or null if none found
   */
  async getActiveCycle() {
    const activeCycles = await this.getActiveCycles();
    if (activeCycles.length === 0) return null;

    // Sort by start date and return the oldest (first) one
    return activeCycles.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    )[0];
  }

  /**
   * Get cycles by state from the unified data
   * @param {string} state - The state to filter by ('active', 'closed', 'future')
   * @returns {Promise<Array>} Array of cycles with the specified state
   */
  async getCyclesByState(state) {
    const data = await this._getCycleData();
    const cycles = data.cycles || [];
    return cycles.filter((cycle) => cycle.state === state);
  }

  /**
   * Get ordered cycles from the unified data
   * @param {string} sortBy - The field to sort by ('startDate', 'name', 'id')
   * @returns {Promise<Array>} Array of cycles sorted by the specified field
   */
  async getOrderedCycles(sortBy = "startDate") {
    const data = await this._getCycleData();
    const cycles = data.cycles || [];

    return [...cycles].sort((a, b) => {
      if (sortBy === "startDate") {
        return (
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "id") {
        return (a.id as number) - (b.id as number);
      }
      return 0;
    });
  }

  /**
   * Clear all caches (useful for testing or when data needs to be refreshed)
   */
  clearCache() {
    this._clearCache();
  }
}

export default CycleDataService;
