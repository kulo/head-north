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
    
    // Unified cache management - single cache for all data
    this._unifiedCache = null
    this._cacheTimestamp = null
    this._cacheTTL = this.config.getCacheTTL()
    this._apiTimeout = this.config.getEnvironmentConfig().timeout
    this._apiRetries = this.config.getEnvironmentConfig().retries
    this._apiAttempts = this.config.getEnvironmentConfig().attempts
  }

  /**
   * Check if unified cache is still valid
   * @returns {boolean} True if cache is valid
   * @private
   */
  _isCacheValid() {
    if (!this._unifiedCache || !this._cacheTimestamp) return false
    return (Date.now() - this._cacheTimestamp) < this._cacheTTL
  }

  /**
   * Clear unified cache
   * @private
   */
  _clearCache() {
    this._unifiedCache = null
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
   * Get unified data with caching
   * @returns {Promise<object>} The unified data
   * @private
   */
  async _getUnifiedData() {
    // Check if unified cache is still valid
    if (this._isCacheValid()) {
      return this._unifiedCache
    }
    
    // Clear cache if invalid
    this._clearCache()
    
    // Fetch fresh data from unified endpoint
    const endpoints = this.config.getEndpoints()
    const unifiedData = await this._request(endpoints.UNIFIED_DATA)
    
    // Cache the unified data
    this._unifiedCache = unifiedData
    this._setCacheTimestamp()
    
    return unifiedData
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
    // Use unified cache - all data is available in the unified structure
    const data = await this._getUnifiedData()
    
    // If a specific cycle is requested, we could filter the data here
    // For now, return the full unified data as it contains all cycles
    return data
  }

  /**
   * Get cycles roadmap data showing past, current, and future cycles
   * Used by the Roadmap component
   * @returns {Promise<object>} Cycles roadmap data
   */
  async getCyclesRoadmap() {
    // Use unified cache - all data is available in the unified structure
    return this._getUnifiedData()
  }

  /**
   * Get the currently active sprint
   * @returns {Promise<object|null>} Active sprint data or null if none found
   */
  async getActiveSprint() {
    const data = await this._getUnifiedData()
    return data.activeSprint || data.sprints?.find(sprint => sprint.active) || null
  }


  /**
   * Get all initiatives from the unified data
   * @param {string|number} cycleId - The cycle or sprint ID to get initiatives for
   * @returns {Promise<Array>} Array of initiatives with id and name properties
   */
  async getAllInitiatives(cycleId = null) {
    const data = await this.getOverviewForCycle(cycleId)
    const initiatives = data.metadata?.initiatives || {}
    
    // Convert initiatives object to array format
    return Object.entries(initiatives).map(([id, name]) => ({
      id,
      name
    }))
  }


  /**
   * Extract area IDs from unified data
   * @param {object} data - Unified data from backend
   * @returns {Array<string>} Array of area IDs
   * @private
   */
  _extractAreasFromData(data) {
    // Handle unified data structure (metadata.organisation.areas)
    if (data.metadata?.organisation?.areas && typeof data.metadata.organisation.areas === 'object') {
      return Object.keys(data.metadata.organisation.areas) // Get area IDs
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
      // Get areas from unified data source
      const sourceData = await this._getUnifiedData()
      
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
   * Get all cycles from the unified data
   * @returns {Promise<Array>} Array of cycles
   */
  async getAllCycles() {
    const data = await this._getUnifiedData()
    return data.metadata?.cycles || []
  }

  /**
   * Get all stages from the unified data
   * @returns {Promise<Array>} Array of stages
   */
  async getAllStages() {
    const data = await this._getUnifiedData()
    return data.metadata?.stages || []
  }

  /**
   * Get all teams from all areas in the organisation
   * @returns {Promise<Array>} Array of all teams across all areas
   */
  async getAllTeams() {
    const data = await this._getUnifiedData()
    const areas = data.metadata?.organisation?.areas || {}
    
    const allTeams = []
    Object.entries(areas).forEach(([areaId, areaData]) => {
      if (areaData.teams && Array.isArray(areaData.teams)) {
        areaData.teams.forEach(team => {
          allTeams.push({
            ...team,
            areaId,
            areaName: areaData.name || areaId
          })
        })
      }
    })
    
    return allTeams
  }

  /**
   * Get teams for a specific area
   * @param {string} areaId - The area ID to get teams for
   * @returns {Promise<Array>} Array of teams for the specified area
   */
  async getTeamsForArea(areaId) {
    const data = await this._getUnifiedData()
    const areas = data.metadata?.organisation?.areas || {}
    const area = areas[areaId]
    
    if (!area || !area.teams) {
      return []
    }
    
    return area.teams.map(team => ({
      ...team,
      areaId,
      areaName: area.name || areaId
    }))
  }

  /**
   * Get organisation data (areas with teams and assignees)
   * @returns {Promise<object>} Organisation data structure
   */
  async getOrganisationData() {
    const data = await this._getUnifiedData()
    return data.metadata?.organisation || {
      areas: {},
      assignees: []
    }
  }

  /**
   * Get all assignees from the organisation
   * @returns {Promise<Array>} Array of assignees
   */
  async getAllAssignees() {
    const data = await this._getUnifiedData()
    const assignees = data.metadata?.organisation?.assignees || []
    return assignees.map(assignee => ({
      id: assignee.accountId,
      name: assignee.displayName
    }))
  }

  /**
   * Get unified data directly from the unified endpoint
   * This is the new preferred method for getting data
   * @param {string|number} cycleId - Optional cycle ID
   * @param {object} filters - Optional filters to apply
   * @returns {Promise<object>} Unified data structure
   */
  async getUnifiedData(cycleId = null, filters = {}) {
    // If no specific cycle or filters, use cached data
    if (!cycleId && Object.keys(filters).length === 0) {
      return this._getUnifiedData()
    }
    
    // For specific cycles or filters, make a direct API call
    const params = new URLSearchParams()
    if (cycleId) params.set('cycleId', cycleId.toString())
    if (Object.keys(filters).length > 0) params.set('filters', JSON.stringify(filters))
    
    return this._request(`/unified-data?${params.toString()}`)
  }

  /**
   * Get active cycles from the unified data
   * @returns {Promise<Array>} Array of active cycles
   */
  async getActiveCycles() {
    const data = await this._getUnifiedData()
    const cycles = data.metadata?.cycles || []
    return cycles.filter(cycle => cycle.state === 'active')
  }

  /**
   * Get the oldest active cycle from the unified data
   * @returns {Promise<object|null>} The oldest active cycle or null if none found
   */
  async getActiveCycle() {
    const activeCycles = await this.getActiveCycles()
    if (activeCycles.length === 0) return null
    
    // Sort by start date and return the oldest (first) one
    return activeCycles.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0]
  }

  /**
   * Get cycles by state from the unified data
   * @param {string} state - The state to filter by ('active', 'closed', 'future')
   * @returns {Promise<Array>} Array of cycles with the specified state
   */
  async getCyclesByState(state) {
    const data = await this._getUnifiedData()
    const cycles = data.metadata?.cycles || []
    return cycles.filter(cycle => cycle.state === state)
  }

  /**
   * Get ordered cycles from the unified data
   * @param {string} sortBy - The field to sort by ('startDate', 'name', 'id')
   * @returns {Promise<Array>} Array of cycles sorted by the specified field
   */
  async getOrderedCycles(sortBy = 'startDate') {
    const data = await this._getUnifiedData()
    const cycles = data.metadata?.cycles || []
    
    return [...cycles].sort((a, b) => {
      if (sortBy === 'startDate') {
        return new Date(a.startDate) - new Date(b.startDate)
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'id') {
        return a.id - b.id
      }
      return 0
    })
  }

  /**
   * Clear all caches (useful for testing or when data needs to be refreshed)
   */
  clearCache() {
    this._clearAllCaches()
  }
}

export default CycleDataService
