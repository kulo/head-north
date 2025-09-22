/**
 * Cycle Data Service
 * Centralized service for cycle and roadmap data with error handling and retry logic
 * 
 * This service handles communication between the frontend and the backend API
 * for cycle-related data operations. All endpoints are defined in the shared configuration.
 */

import { logger } from '@omega-one/shared-utils'
import type { OmegaConfig } from '@omega/shared-config'
import type { 
  Cycle, 
  RoadmapItem, 
  ReleaseItem, 
  Area, 
  Initiative, 
  Assignee, 
  CycleData,
  Team 
} from '@omega/shared-types'

interface AreaWithTeams {
  id: string
  name: string
  teams: Team[]
}

class CycleDataService {
  private config: OmegaConfig
  private _unifiedCache: CycleData | null = null
  private _cacheTimestamp: number | null = null
  private _cacheTTL: number
  private _apiTimeout: number
  private _apiRetries: number

  constructor(omegaConfig: OmegaConfig) {
    if (!omegaConfig) {
      throw new Error('CycleDataService requires an OmegaConfig instance to be injected')
    }
    this.config = omegaConfig
    
    // Unified cache management - single cache for all data
    this._cacheTTL = this.config.getCacheTTL()
    this._apiTimeout = this.config.getEnvironmentConfig().timeout
    this._apiRetries = this.config.getEnvironmentConfig().retries
  }

  /**
   * Check if unified cache is still valid
   * @returns True if cache is valid
   * @private
   */
  private _isCacheValid(): boolean {
    if (!this._unifiedCache || !this._cacheTimestamp) return false
    return (Date.now() - this._cacheTimestamp) < this._cacheTTL
  }

  /**
   * Clear unified cache
   * @private
   */
  private _clearCache(): void {
    this._unifiedCache = null
    this._cacheTimestamp = null
  }

  /**
   * Set cache timestamp when any data is cached
   * @private
   */
  private _setCacheTimestamp(): void {
    this._cacheTimestamp = Date.now()
  }

  /**
   * Get cycle data with caching
   * @returns The cycle data
   * @private
   */
  private async _getCycleData(): Promise<CycleData> {
    // Check if unified cache is still valid
    if (this._isCacheValid()) {
      return this._unifiedCache!
    }
    
    // Clear cache if invalid
    this._clearCache()
    
    // Fetch fresh data from cycle-data endpoint
    const endpoints = this.config.getEndpoints()
    const cycleData = await this._request(endpoints.CYCLE_DATA)
    
    // Cache the cycle data
    this._unifiedCache = cycleData
    this._setCacheTimestamp()
    
    return cycleData
  }

  /**
   * Make an HTTP request with error handling and retry logic
   * @param endpoint - The API endpoint
   * @param options - Fetch options
   * @returns The response data
   */
  private async _request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = this.config.getUrl(endpoint)
    
    const defaultOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }

    const requestOptions = { ...defaultOptions, ...options }

    const errors: Array<{ attempt: number; error: string; timestamp: string }> = []
    for (let attempt = 1; attempt <= this._apiRetries; attempt++) {
      try {
        const response = await fetch(url, requestOptions)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        return data
      } catch (error) {
        const errorInfo = {
          attempt,
          error: (error as Error).message || error?.toString() || 'Unknown error',
          timestamp: new Date().toISOString()
        }
        errors.push(errorInfo)
        logger.service.warnSafe(`API request attempt ${attempt} failed`, error, { attempt })
        
        if (attempt < this._apiRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // Show all errors that occurred during retry attempts
    const errorSummary = errors.map(e => `Attempt ${e.attempt}: ${e.error}`).join('; ')
    const finalErrorMessage = `API request failed after ${this._apiRetries} attempts. Errors: ${errorSummary}`
    throw new Error(finalErrorMessage)
  }

  /**
   * Get overview data for all cycles
   * This is the main data source for the Area component
   * @returns Cycle overview data with all cycles
   */
  async getOverviewForCycle(): Promise<CycleData> {
    // Use cycle cache - all data is available in the cycle structure
    const data = await this._getCycleData()
    
    // Return the full unified data as it contains all cycles
    return data
  }

  /**
   * Get cycles roadmap data showing past, current, and future cycles
   * Used by the Roadmap component
   * @returns Cycles roadmap data
   */
  async getCyclesRoadmap(): Promise<CycleData> {
    // Use unified cache - all data is available in the unified structure
    return this._getCycleData()
  }

  /**
   * Get the currently active cycle
   * @returns Active cycle data or null if none found
   */
  async getActiveCycle(): Promise<Cycle | null> {
    const data = await this._getCycleData()
    return data.cycles?.find(cycle => cycle.isActive) || null
  }

  /**
   * Get all initiatives from the unified data
   * @param cycleId - The cycle ID to get initiatives for
   * @returns Array of initiatives with id and name properties
   */
  async getAllInitiatives(cycleId: string | null = null): Promise<Array<{ id: string; name: string }>> {
    const data = await this.getOverviewForCycle()
    const initiatives = data.initiatives || []
    
    // Return initiatives as they are (already in correct format from backend)
    return initiatives
      .filter(initiative => initiative.id || initiative.initiativeId)
      .map(initiative => ({
        id: initiative.id || initiative.initiativeId!,
        name: initiative.name || initiative.initiative || 'Unknown Initiative'
      }))
  }

  /**
   * Extract area IDs from unified data
   * @param data - Unified data from backend
   * @returns Array of area IDs
   * @private
   */
  private _extractAreasFromData(data: CycleData): string[] {
    // Handle simplified data structure (areas is now directly available)
    if (data.areas && Array.isArray(data.areas)) {
      return data.areas.map(area => area.id) // Get area IDs
    }
    
    return []
  }

  /**
   * Get config areas for translations
   * @returns Array of config areas
   * @private
   */
  private _getConfigAreas(): Array<{ id: string; name: string }> {
    const config = this.config.getAreas()
    return Object.entries(config).map(([id, name]) => ({ id, name }))
  }

  /**
   * Create union of backend areas and config areas with proper fallbacks
   * @param backendAreaIds - Area IDs from backend
   * @param configAreas - Config areas with translations
   * @returns Union of areas with fallbacks
   * @private
   */
  private _createAreaUnion(backendAreaIds: string[], configAreas: Array<{ id: string; name: string }>): Array<{ id: string; name: string }> {
    const areaMap = new Map<string, string>()
    
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
   * @param cycleId - The cycle ID to get areas for
   * @returns Array of areas with id and name properties
   */
  async getAllAreas(cycleId: string | null = null): Promise<Array<{ id: string; name: string }>> {
    try {
      // Get areas from unified data source
      const sourceData = await this._getCycleData()
      
      // Extract areas directly from simplified backend data
      if (sourceData.areas && Array.isArray(sourceData.areas)) {
        return sourceData.areas.map(area => ({
          id: area.id,
          name: area.name || area.id
        }))
      }
      
      // Fallback to config areas if backend data is not available
      return this._getConfigAreas()
    } catch (error) {
      // Fallback to config only if backend fails
      return this._getConfigAreas()
    }
  }

  /**
   * Get all cycles from the unified data
   * @returns Array of cycles
   */
  async getAllCycles(): Promise<Cycle[]> {
    const data = await this._getCycleData()
    return data.cycles || []
  }

  /**
   * Get all stages from the unified data
   * @returns Array of stages
   */
  async getAllStages(): Promise<any[]> {
    const data = await this._getCycleData()
    return data.stages || []
  }

  /**
   * Get all teams from all areas in the organisation
   * @returns Array of all teams across all areas
   */
  async getAllTeams(): Promise<Team[]> {
    const data = await this._getCycleData()
    const areas = data.areas || []
    
    const allTeams: Team[] = []
    areas.forEach((areaData: any) => {
      if (areaData.teams && Array.isArray(areaData.teams)) {
        areaData.teams.forEach((team: any) => {
          allTeams.push({
            ...team,
            areaId: areaData.id,
            areaName: areaData.name || areaData.id
          })
        })
      }
    })
    
    return allTeams
  }

  /**
   * Get teams for a specific area
   * @param areaId - The area ID to get teams for
   * @returns Array of teams for the specified area
   */
  async getTeamsForArea(areaId: string): Promise<Team[]> {
    const data = await this._getCycleData()
    const areas = data.areas || []
    const area = areas.find(a => a.id === areaId)
    
    if (!area || !(area as any).teams) {
      return []
    }
    
    return (area as any).teams.map((team: any) => ({
      ...team,
      areaId,
      areaName: area.name || areaId
    }))
  }

  /**
   * Get organisation data (areas with teams and assignees)
   * @returns Organisation data structure
   */
  async getOrganisationData(): Promise<{ areas: Area[]; assignees: Assignee[] }> {
    const data = await this._getCycleData()
    return {
      areas: data.areas || [],
      assignees: data.assignees || []
    }
  }

  /**
   * Get all assignees from the organisation
   * @returns Array of assignees
   */
  async getAllAssignees(): Promise<Array<{ id: string; name: string }>> {
    const data = await this._getCycleData()
    const assignees = data.assignees || []
    return assignees.map(assignee => ({
      id: assignee.accountId,
      name: assignee.displayName
    }))
  }

  /**
   * Get cycle data directly from the cycle-data endpoint
   * This is the new preferred method for getting data
   * @returns Cycle data structure
   */
  async getCycleData(): Promise<CycleData> {
    // Always use cached data since we fetch all data at once
    return this._getCycleData()
  }

  /**
   * Get active cycles from the unified data
   * @returns Array of active cycles
   */
  async getActiveCycles(): Promise<Cycle[]> {
    const data = await this._getCycleData()
    const cycles = data.cycles || []
    return cycles.filter(cycle => cycle.state === 'active')
  }

  /**
   * Get cycles by state from the unified data
   * @param state - The state to filter by ('active', 'closed', 'future')
   * @returns Array of cycles with the specified state
   */
  async getCyclesByState(state: string): Promise<Cycle[]> {
    const data = await this._getCycleData()
    const cycles = data.cycles || []
    return cycles.filter(cycle => cycle.state === state)
  }

  /**
   * Get ordered cycles from the unified data
   * @param sortBy - The field to sort by ('start', 'name', 'id')
   * @returns Array of cycles sorted by the specified field
   */
  async getOrderedCycles(sortBy: string = 'start'): Promise<Cycle[]> {
    const data = await this._getCycleData()
    const cycles = data.cycles || []
    
    return [...cycles].sort((a, b) => {
      if (sortBy === 'start') {
        return new Date(a.start).getTime() - new Date(b.start).getTime()
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'id') {
        return a.id.localeCompare(b.id)
      }
      return 0
    })
  }

  /**
   * Clear all caches (useful for testing or when data needs to be refreshed)
   */
  clearCache(): void {
    this._clearCache()
  }
}

export default CycleDataService
