/**
 * Unified Data System
 * 
 * This system provides a unified data structure and filtering approach
 * for both roadmap and cycle overview views, eliminating the need for
 * different filtering logic and data transformations.
 */

/**
 * @typedef {Object} Cycle
 * @property {string} id
 * @property {string} name
 * @property {string} start
 * @property {string} delivery
 * @property {string} end
 * @property {number} progress
 * @property {number} progressWithInProgress
 * @property {number} progressByReleaseItems
 * @property {number} weeks
 * @property {number} weeksDone
 * @property {number} weeksInProgress
 * @property {number} weeksNotToDo
 * @property {number} weeksCancelled
 * @property {number} weeksPostponed
 * @property {number} releaseItemsCount
 * @property {number} releaseItemsDoneCount
 * @property {number} percentageNotToDo
 */

/**
 * @typedef {Object} Sprint
 * @property {string} id
 * @property {string} name
 * @property {string} startDate
 * @property {string} endDate
 */

/**
 * @typedef {Object} ReleaseItem
 * @property {string} id
 * @property {string} ticketId
 * @property {string} area
 * @property {string[]} areaIds
 * @property {string} stage
 * @property {string} status
 * @property {number} effort
 * @property {Object} assignee
 * @property {string[]} teams
 * @property {Array} validations
 */

/**
 * @typedef {Object} RoadmapItem
 * @property {string} id
 * @property {string} name
 * @property {string} area
 * @property {string} theme
 * @property {string} projectId
 * @property {string} url
 * @property {string} startDate
 * @property {Array} validations
 * @property {ReleaseItem[]} releaseItems
 */

/**
 * @typedef {Object} Initiative
 * @property {string} initiativeId
 * @property {string} initiative
 * @property {RoadmapItem[]} roadmapItems
 */

/**
 * @typedef {Object} UnifiedData
 * @property {Object} metadata
 * @property {'roadmap'|'cycle-overview'} metadata.type
 * @property {Cycle|null} metadata.cycle
 * @property {Sprint[]} metadata.sprints
 * @property {Sprint|null} metadata.activeSprint
 * @property {Initiative[]} initiatives
 */

/**
 * @typedef {Object} FilterConfig
 * @property {string} [area]
 * @property {Array} [initiatives]
 * @property {Array} [stages]
 */

/**
 * RUNTIME VALIDATION
 * 
 * These functions provide runtime type checking to catch issues during refactoring
 */

/**
 * Validates that a value is a non-empty string
 * @param {any} value
 * @param {string} fieldName
 * @throws {Error} If value is not a non-empty string
 */
const validateString = (value, fieldName) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Invalid ${fieldName}: expected non-empty string, got ${typeof value}`)
  }
}

/**
 * Validates that a value is an array
 * @param {any} value
 * @param {string} fieldName
 * @throws {Error} If value is not an array
 */
const validateArray = (value, fieldName) => {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid ${fieldName}: expected array, got ${typeof value}`)
  }
}

/**
 * Validates that a value is an object (not null)
 * @param {any} value
 * @param {string} fieldName
 * @throws {Error} If value is not an object
 */
const validateObject = (value, fieldName) => {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`Invalid ${fieldName}: expected object, got ${typeof value}`)
  }
}

/**
 * Validates unified data structure
 * @param {any} data
 * @param {boolean} strict - Whether to use strict validation
 * @throws {Error} If data doesn't match unified structure
 */
export const validateUnifiedData = (data, strict = true) => {
  validateObject(data, 'unifiedData')
  
  // Validate metadata
  validateObject(data.metadata, 'metadata')
  validateString(data.metadata.type, 'metadata.type')
  
  if (!['roadmap', 'cycle-overview'].includes(data.metadata.type)) {
    throw new Error(`Invalid metadata.type: expected 'roadmap' or 'cycle-overview', got '${data.metadata.type}'`)
  }
  
  // Validate initiatives
  validateArray(data.initiatives, 'initiatives')
  
  data.initiatives.forEach((initiative, index) => {
    validateObject(initiative, `initiatives[${index}]`)
    validateString(initiative.initiativeId, `initiatives[${index}].initiativeId`)
    
    // initiative field is optional - some data structures don't have it
    if (initiative.initiative !== undefined) {
      validateString(initiative.initiative, `initiatives[${index}].initiative`)
    } else if (strict) {
      // In strict mode, we expect the initiative field to be present
      console.warn(`Warning: initiatives[${index}].initiative is undefined, using fallback`)
    }
    
    validateArray(initiative.roadmapItems, `initiatives[${index}].roadmapItems`)
    
    initiative.roadmapItems.forEach((roadmapItem, itemIndex) => {
      validateObject(roadmapItem, `initiatives[${index}].roadmapItems[${itemIndex}]`)
      
      // For roadmap items, we need at least one identifier (id, name, summary, or title)
      const hasIdentifier = roadmapItem.id || roadmapItem.name || roadmapItem.summary || roadmapItem.title
      if (!hasIdentifier) {
        console.warn(`Warning: roadmap item at initiatives[${index}].roadmapItems[${itemIndex}] has no identifier (id, name, summary, or title)`)
      }
      
      // Only validate name if it exists
      if (roadmapItem.name !== undefined) {
        validateString(roadmapItem.name, `initiatives[${index}].roadmapItems[${itemIndex}].name`)
      }
      
      // Only validate releaseItems if it exists
      if (roadmapItem.releaseItems !== undefined) {
        validateArray(roadmapItem.releaseItems, `initiatives[${index}].roadmapItems[${itemIndex}].releaseItems`)
      }
    })
  })
}

/**
 * DATA TRANSFORMATION UTILITIES
 * 
 * These functions convert between current structures and the unified structure
 */

/**
 * Convert roadmap data to unified structure
 * @param {Object} roadmapData - Current roadmap data structure
 * @returns {UnifiedData} Unified data structure
 */
export const transformRoadmapToUnified = (roadmapData) => {
  if (!roadmapData) {
    throw new Error('Roadmap data is required')
  }

  // Transform roadmap items to initiatives format
  const initiatives = (roadmapData.roadmapItems || []).map(item => ({
    initiativeId: item.initiativeId,
    initiative: item.initiative || `Initiative ${item.initiativeId}`, // Fallback if missing
    roadmapItems: (item.roadmapItems || []).map(roadmapItem => ({
      ...roadmapItem,
      // Ensure releaseItems exists - if it doesn't, create empty array
      releaseItems: roadmapItem.releaseItems || []
    }))
  }))

  const unifiedData = {
    metadata: {
      type: 'roadmap',
      cycle: null, // Roadmap doesn't have cycle data
      sprints: roadmapData.orderedSprints || [],
      activeSprint: roadmapData.activeSprint || null
    },
    initiatives: initiatives
  }

  // Validate the transformed data
  validateUnifiedData(unifiedData, false)
  
  return unifiedData
}

/**
 * Convert cycle overview data to unified structure
 * @param {Object} cycleOverviewData - Current cycle overview data structure
 * @returns {UnifiedData} Unified data structure
 */
export const transformCycleOverviewToUnified = (cycleOverviewData) => {
  if (!cycleOverviewData) {
    throw new Error('Cycle overview data is required')
  }

  const unifiedData = {
    metadata: {
      type: 'cycle-overview',
      cycle: cycleOverviewData.cycle || null,
      sprints: [], // Cycle overview doesn't have sprints
      activeSprint: null
    },
    initiatives: cycleOverviewData.initiatives || []
  }

  // Validate the transformed data
  validateUnifiedData(unifiedData, false)
  
  return unifiedData
}

/**
 * Convert unified structure back to roadmap format
 * @param {UnifiedData} unifiedData - Unified data structure
 * @returns {Object} Roadmap data structure
 */
export const transformUnifiedToRoadmap = (unifiedData) => {
  validateUnifiedData(unifiedData, false)
  
  if (unifiedData.metadata.type !== 'roadmap') {
    throw new Error(`Cannot convert unified data of type '${unifiedData.metadata.type}' to roadmap format`)
  }

  // Transform initiatives back to roadmap items format
  const roadmapItems = unifiedData.initiatives.map(initiative => ({
    initiativeId: initiative.initiativeId,
    initiative: initiative.initiative,
    roadmapItems: initiative.roadmapItems
  }))

  return {
    orderedSprints: unifiedData.metadata.sprints,
    activeSprint: unifiedData.metadata.activeSprint,
    roadmapItems: roadmapItems
  }
}

/**
 * Convert unified structure back to cycle overview format
 * @param {UnifiedData} unifiedData - Unified data structure
 * @returns {Object} Cycle overview data structure
 */
export const transformUnifiedToCycleOverview = (unifiedData) => {
  validateUnifiedData(unifiedData, false)
  
  if (unifiedData.metadata.type !== 'cycle-overview') {
    throw new Error(`Cannot convert unified data of type '${unifiedData.metadata.type}' to cycle overview format`)
  }

  return {
    cycle: unifiedData.metadata.cycle,
    initiatives: unifiedData.initiatives
  }
}

/**
 * UNIFIED FILTERING
 * 
 * Single filtering function that works with the unified data structure
 */

/**
 * Filter unified data by area, initiatives, and stages
 * @param {UnifiedData} unifiedData - Unified data to filter
 * @param {FilterConfig} filters - Filter configuration
 * @returns {UnifiedData} Filtered unified data
 */
export const filterUnifiedData = (unifiedData, filters) => {
  if (!unifiedData || !unifiedData.initiatives) {
    return unifiedData
  }

  // Validate input
  validateUnifiedData(unifiedData, false)
  
  if (!filters) {
    return unifiedData
  }

  let filteredInitiatives = unifiedData.initiatives

  // Initiative filtering
  if (filters.initiatives && filters.initiatives.length > 0) {
    const isAllSelected = filters.initiatives.some(init => 
      init && (init.id === 'all' || init.value === 'all')
    )
    
    if (!isAllSelected) {
      const selectedInitiativeIds = filters.initiatives
        .filter(init => init && init.id)
        .map(init => String(init.id))
        .filter(id => id !== 'all')

      filteredInitiatives = filteredInitiatives.filter(initiative => 
        selectedInitiativeIds.includes(String(initiative.initiativeId))
      )
    }
  }

  // Area and stage filtering
  if (filters.area || filters.stages) {
    filteredInitiatives = filteredInitiatives.map(initiative => {
      // Add null check for roadmapItems
      if (!initiative.roadmapItems || !Array.isArray(initiative.roadmapItems)) {
        console.warn('initiative.roadmapItems is missing or not an array:', initiative)
        return { ...initiative, roadmapItems: [] }
      }
      
      const filteredRoadmapItems = initiative.roadmapItems
        .map(roadmapItem => {
          // For roadmap items, we need to check area filtering on the roadmap item itself
          // since roadmap items don't have releaseItems to filter
          
          // Apply area filtering directly to roadmap items
          if (filters.area && filters.area !== 'all') {
            const roadmapAreaMatch = roadmapItem.area && 
              roadmapItem.area.toLowerCase() === filters.area.toLowerCase()
            const roadmapThemeMatch = roadmapItem.theme && 
              roadmapItem.theme.toLowerCase() === filters.area.toLowerCase()
            
            
            // If area doesn't match, return null to filter out this roadmap item
            if (!roadmapAreaMatch && !roadmapThemeMatch) {
              return null
            }
          }
          
          // Check if this roadmap item has releaseItems
          if (!roadmapItem.releaseItems || !Array.isArray(roadmapItem.releaseItems)) {
            // If no releaseItems, just return the roadmap item as-is (no filtering)
            return roadmapItem
          }
          
          const filteredReleaseItems = roadmapItem.releaseItems
            .filter(releaseItem => {
              // Area filtering
              if (filters.area && filters.area !== 'all') {
                const areaMatch = releaseItem.area && 
                  releaseItem.area.toLowerCase() === filters.area.toLowerCase()
                const areaIdsMatch = releaseItem.areaIds && 
                  releaseItem.areaIds.some(areaId => 
                    areaId.toLowerCase() === filters.area.toLowerCase()
                  )
                const roadmapAreaMatch = roadmapItem.area && 
                  roadmapItem.area.toLowerCase() === filters.area.toLowerCase()
                
                if (!areaMatch && !areaIdsMatch && !roadmapAreaMatch) {
                  return false
                }
              }

              // Stage filtering
              if (filters.stages && filters.stages.length > 0) {
                const isAllStagesSelected = filters.stages.some(stage => 
                  stage && (stage.id === 'all' || stage.value === 'all')
                )
                
                if (!isAllStagesSelected) {
                  const selectedStageValues = filters.stages
                    .filter(stage => stage && (stage.value || stage.id || stage.name))
                    .map(stage => stage.value || stage.id || stage.name)
                    .filter(value => value !== 'all')

                  if (!selectedStageValues.includes(releaseItem.stage)) {
                    return false
                  }
                }
              }

              return true
            })

          // If this roadmap item has releaseItems, filter them
          if (roadmapItem.releaseItems && roadmapItem.releaseItems.length > 0) {
            if (filteredReleaseItems.length > 0) {
              return { ...roadmapItem, releaseItems: filteredReleaseItems }
            }
            return null
          } else {
            // If no releaseItems, return the roadmap item as-is
            return roadmapItem
          }
        })
        .filter(item => item !== null)

      return { ...initiative, roadmapItems: filteredRoadmapItems }
    })
    .filter(initiative => initiative.roadmapItems.length > 0)
  }

  const result = {
    ...unifiedData,
    initiatives: filteredInitiatives
  }

  // Validate the result
  validateUnifiedData(result)
  
  return result
}

/**
 * MAIN UNIFIED FILTERING FUNCTION
 * 
 * This is the main entry point that automatically detects data type
 * and applies appropriate filtering
 */

/**
 * Apply filters to any data type (roadmap, cycle overview, or unified)
 * @param {any} data - Data to filter
 * @param {FilterConfig} filters - Filter configuration
 * @returns {any} Filtered data in the same format as input
 */
export const applyFilters = (data, filters) => {
  if (!data) return data

  try {

    // If it's already unified data, filter directly
    if (data.metadata && data.initiatives) {
      const filtered = filterUnifiedData(data, filters)
      return filtered
    }

    // If it's cycle overview data, convert and filter
    if (data.initiatives && Array.isArray(data.initiatives)) {
      const unified = transformCycleOverviewToUnified(data)
      const filtered = filterUnifiedData(unified, filters)
      return transformUnifiedToCycleOverview(filtered)
    }

    // If it's roadmap data, convert and filter
    if (data.roadmapItems && Array.isArray(data.roadmapItems)) {
      // Handle empty roadmap data
      if (data.roadmapItems.length === 0) {
        return {
          orderedSprints: data.orderedSprints || [],
          activeSprint: data.activeSprint || null,
          roadmapItems: []
        }
      }
      
      const unified = transformRoadmapToUnified(data)
      const filtered = filterUnifiedData(unified, filters)
      const result = transformUnifiedToRoadmap(filtered)
      return result
    }

    // If it's just an array of initiatives, filter directly
    if (Array.isArray(data)) {
      // Check if this looks like roadmap data (has initiativeId and roadmapItems)
      if (data.length > 0 && data[0].initiativeId && data[0].roadmapItems) {
        const unified = {
          metadata: { type: 'roadmap', cycle: null, sprints: [], activeSprint: null },
          initiatives: data
        }
        const filtered = filterUnifiedData(unified, filters)
        return filtered.initiatives
      } else {
        // This might be a different data structure, return as-is for now
        console.warn('Unknown array data structure, returning as-is:', data)
        return data
      }
    }

    // Fallback to original data
    return data

  } catch (error) {
    console.error('Error in applyFilters:', error)
    console.error('Data:', data)
    console.error('Filters:', filters)
    throw error
  }
}

export default {
  validateUnifiedData,
  transformRoadmapToUnified,
  transformCycleOverviewToUnified,
  transformUnifiedToRoadmap,
  transformUnifiedToCycleOverview,
  filterUnifiedData,
  applyFilters
}
