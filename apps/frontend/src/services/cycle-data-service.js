/**
 * Cycle Data Service
 * Centralized service for cycle and roadmap data with error handling and retry logic
 * 
 * This service handles communication between the frontend and the backend API
 * for cycle-related data operations. All endpoints are defined in the shared configuration.
 */

import { logger } from '@omega-one/shared-utils'

class CycleDataService {
  constructor(omegaConfig) {
    if (!omegaConfig) {
      throw new Error('CycleDataService requires an OmegaConfig instance to be injected')
    }
    this.config = omegaConfig
    this._roadmapCache = null
    this._roadmapCacheTimestamp = null
    this._roadmapCacheTTL = this.config.getCacheTTL()
    this._apiTimeout = this.config.getEnvironmentConfig().timeout
    this._apiRetries = this.config.getEnvironmentConfig().retries
    this._apiAttempts = this.config.getEnvironmentConfig().attempts
  }

  /**
   * Get roadmap data with caching
   * @returns {Promise<object>} The roadmap data
   * @private
   */
  async _getRoadmapData() {
    const now = Date.now()
    
    // Return cached data if it's still valid
    if (this._roadmapCache && this._roadmapCacheTimestamp && 
        (now - this._roadmapCacheTimestamp) < this._roadmapCacheTTL) {
      return this._roadmapCache
    }
    
    // Fetch fresh data
    const endpoints = this.config.getEndpoints()
    const data = await this._request(endpoints.CYCLES_ROADMAP)
    
    // Cache the data
    this._roadmapCache = data
    this._roadmapCacheTimestamp = now
    
    return data
  }

  /**
   * Make an HTTP request with error handling and retry logic
   * @param {string} endpoint - The API endpoint
   * @param {object} options - Fetch options
   * @returns {Promise<any>} The response data
   */
  async _request(endpoint, options = {}) {
    const url = this.config.getUrl(endpoint)
    

    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: this._apiTimeout
    }

    const requestOptions = { ...defaultOptions, ...options }

    let lastError
    for (let attempt = 1; attempt <= this._apiRetries; attempt++) {
      try {
        const response = await fetch(url, requestOptions)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        return data
      } catch (error) {
        lastError = error
        logger.service.warnSafe(`API request attempt ${attempt} failed`, error, { attempt })
        
        if (attempt < this._apiRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // TODO actually show all errors and not just the last
    const finalErrorMessage = lastError?.message || lastError?.toString() || 'Unknown error'
    throw new Error(`API request failed after ${this._apiRetries} attempts: ${finalErrorMessage}`)
  }

  /**
   * Get overview data for a specific cycle/sprint
   * This is the main data source for the Area component
   * @param {string|number} cycleId - The cycle or sprint ID to get overview for
   * @returns {Promise<object>} Cycle overview data with devCycleData
   */
  async getOverviewForCycle(cycleId) {
    const endpoints = this.config.getEndpoints()
    const endpoint = cycleId 
      ? endpoints.CYCLE_OVERVIEW.replace(':id', cycleId.toString())
      : endpoints.CYCLE_OVERVIEW.replace(':id', 'default')
    return this._request(endpoint)
  }

  /**
   * Get cycles roadmap data showing past, current, and future cycles
   * Used by the Roadmap component
   * @returns {Promise<object>} Cycles roadmap data
   */
  async getCyclesRoadmap() {
    const endpoints = this.config.getEndpoints()
    return this._request(endpoints.CYCLES_ROADMAP)
  }


  /**
   * Get all initiatives from the roadmap data
   * @returns {Promise<Array>} Array of initiatives
   */
  async getAllInitiatives() {
    const data = await this._getRoadmapData()
    return data.initiatives || []
  }

  /**
   * Get all assignees from the roadmap data
   * @returns {Promise<Array>} Array of assignees with id and name
   */
  async getAllAssignees() {
    const data = await this._getRoadmapData()
    return data.assignees?.map(assignee => ({
      id: assignee.accountId,
      name: assignee.displayName
    })) || []
  }

  /**
   * Get all areas from the roadmap data
   * @returns {Promise<Array>} Array of areas with id and name
   */
  async getAllAreas() {
    const data = await this._getRoadmapData()
    return data.area ? Object.entries(data.area).map(([id, name]) => ({ id, name })) : []
  }

  /**
   * Get all cycles from the roadmap data
   * @returns {Promise<Array>} Array of cycles
   */
  async getAllCycles() {
    const data = await this._getRoadmapData()
    // Map sprints to cycles for consistency
    return data.sprints || []
  }

  /**
   * Get all stages from the roadmap data
   * @returns {Promise<Array>} Array of stages
   */
  async getAllStages() {
    const data = await this._getRoadmapData()
    return data.stages || []
  }

  /**
   * Clear the roadmap cache (useful for testing or when data needs to be refreshed)
   */
  clearRoadmapCache() {
    this._roadmapCache = null
    this._roadmapCacheTimestamp = null
  }
}

export default CycleDataService
