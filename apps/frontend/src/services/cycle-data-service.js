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
    
    // Unified cache management
    this._cacheTimestamp = null
    this._roadmapCache = null
    this._cycleOverviewCache = new Map() // Map<cycleId, data>
    this._cacheTTL = this.config.getCacheTTL()
    this._apiTimeout = this.config.getEnvironmentConfig().timeout
    this._apiRetries = this.config.getEnvironmentConfig().retries
    this._apiAttempts = this.config.getEnvironmentConfig().attempts
  }

  /**
   * Check if any cached data is still valid
   * @returns {boolean} True if cache is valid
   * @private
   */
  _isCacheValid() {
    if (!this._cacheTimestamp) return false
    return (Date.now() - this._cacheTimestamp) < this._cacheTTL
  }

  /**
   * Clear all caches
   * @private
   */
  _clearAllCaches() {
    this._roadmapCache = null
    this._cycleOverviewCache.clear()
    this._cacheTimestamp = null
  }

  /**
   * Set cache timestamp when any data is cached
   * @private
   */
  _setCacheTimestamp() {
    this._cacheTimestamp = Date.now()
  }

  /**
   * Get roadmap data with caching
   * @returns {Promise<object>} The roadmap data
   * @private
   */
  async _getRoadmapData() {
    // Check if any cached data is still valid
    if (this._isCacheValid() && this._roadmapCache) {
      return this._roadmapCache
    }
    
    // If cache is invalid, clear all caches
    if (!this._isCacheValid()) {
      this._clearAllCaches()
    }
    
    // Fetch fresh data
    const endpoints = this.config.getEndpoints()
    const data = await this._request(endpoints.CYCLES_ROADMAP)
    
    // Cache the data and set timestamp
    this._roadmapCache = data
    this._setCacheTimestamp()
    
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
   * Get cycle overview data with caching
   * @param {string|number} cycleId - The cycle or sprint ID to get overview for
   * @returns {Promise<object>} Cycle overview data
   * @private
   */
  async _getCycleOverviewData(cycleId) {
    // Check if any cached data is still valid
    if (this._isCacheValid() && this._cycleOverviewCache.has(cycleId)) {
      return this._cycleOverviewCache.get(cycleId)
    }
    
    // If cache is invalid, clear all caches
    if (!this._isCacheValid()) {
      this._clearAllCaches()
    }
    
    // Fetch fresh cycle-overview data
    const data = await this.getOverviewForCycle(cycleId)
    
    // Cache the data and set timestamp (if not already set by roadmap)
    if (!this._cacheTimestamp) {
      this._setCacheTimestamp()
    }
    
    this._cycleOverviewCache.set(cycleId, data)
    
    return data
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
   * Get the currently active sprint
   * @returns {Promise<object|null>} Active sprint data or null if none found
   */
  async getActiveSprint() {
    const data = await this._getRoadmapData()
    return data.activeSprint || data.sprints?.find(sprint => sprint.active) || null
  }


  /**
   * Get all initiatives from the cycle overview data
   * @param {string|number} cycleId - The cycle or sprint ID to get initiatives for
   * @returns {Promise<Array>} Array of initiatives with id and name properties
   */
  async getAllInitiatives(cycleId = null) {
    // Use cycle overview data as the primary source for initiatives
    const data = await this.getOverviewForCycle(cycleId)
    const initiatives = data.initiatives || []
    
    // Transform initiatives from key-value pairs to array of objects if needed
    if (initiatives && typeof initiatives === 'object' && !Array.isArray(initiatives)) {
      // Convert from {id: name} format to [{id, name}] format
      return Object.entries(initiatives).map(([id, name]) => ({ id, name }))
    }
    
    return initiatives
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
   * Extract area IDs from backend data
   * @param {object} data - Backend data (roadmap or cycle-overview)
   * @returns {Array<string>} Array of area IDs
   * @private
   */
  _extractAreasFromData(data) {
    // Handle roadmap data structure
    if (data.area && typeof data.area === 'object') {
      return Object.keys(data.area) // Get area IDs
    }
    
    // Handle cycle-overview data structure (devCycleData.area)
    if (data.devCycleData?.area && typeof data.devCycleData.area === 'object') {
      return Object.keys(data.devCycleData.area)
    }
    
    // Extract from roadmap items if available
    if (data.roadmapItems || data.groupedRoadmapItems) {
      const items = data.roadmapItems || Object.values(data.groupedRoadmapItems).flat()
      const areaIds = new Set()
      
      items.forEach(item => {
        if (item.area) areaIds.add(item.area)
        if (item.roadmapItems) {
          item.roadmapItems.forEach(ri => {
            if (ri.area) areaIds.add(ri.area)
          })
        }
      })
      
      return Array.from(areaIds)
    }
    
    return []
  }

  /**
   * Get config areas for translations
   * @returns {Array<{id: string, name: string}>} Array of config areas
   * @private
   */
  _getConfigAreas() {
    const config = this.config.getAreas()
    return Object.entries(config).map(([id, name]) => ({ id, name }))
  }

  /**
   * Create union of backend areas and config areas with proper fallbacks
   * @param {Array<string>} backendAreaIds - Area IDs from backend
   * @param {Array<{id: string, name: string}>} configAreas - Config areas with translations
   * @returns {Array<{id: string, name: string}>} Union of areas with fallbacks
   * @private
   */
  _createAreaUnion(backendAreaIds, configAreas) {
    const areaMap = new Map()
    
    // Add config areas first (for translations)
    configAreas.forEach(area => {
      areaMap.set(area.id, area.name)
    })
    
    // Add backend areas (IDs only, use config name if available)
    backendAreaIds.forEach(areaId => {
      if (!areaMap.has(areaId)) {
        areaMap.set(areaId, areaId) // Use ID as fallback name
      }
    })
    
    // Convert to array format
    return Array.from(areaMap.entries()).map(([id, name]) => ({ id, name }))
  }

  /**
   * Get all areas from appropriate data source with config fallbacks
   * @param {string|number} cycleId - The cycle or sprint ID to get areas for
   * @returns {Promise<Array>} Array of areas with id and name properties
   */
  async getAllAreas(cycleId = null) {
    try {
      // Get areas from appropriate data source
      const sourceData = cycleId 
        ? await this._getCycleOverviewData(cycleId)
        : await this._getRoadmapData()
      
      // Extract areas from backend data
      const backendAreas = this._extractAreasFromData(sourceData)
      
      // Get config areas for translations
      const configAreas = this._getConfigAreas()
      
      // Create union with proper fallbacks
      return this._createAreaUnion(backendAreas, configAreas)
    } catch (error) {
      // Fallback to config only if backend fails
      return this._getConfigAreas()
    }
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
   * Clear all caches (useful for testing or when data needs to be refreshed)
   */
  clearCache() {
    this._clearAllCaches()
  }
}

export default CycleDataService
