/**
 * Unified filtering utilities for roadmap and cycle-overview data
 * Provides composable filtering functions that work with different data structures
 */

// Import individual filter functions
import { filterByArea } from './areaFilter.js'
import { filterByInitiatives } from './initiativesFilter.js'
import { filterByStages } from './stagesFilter.js'

// Re-export individual filters for direct imports
export { filterByArea } from './areaFilter.js'
export { filterByInitiatives } from './initiativesFilter.js'
export { filterByStages } from './stagesFilter.js'

/**
 * Apply multiple filters in sequence
 * 
 * @param {Array} items - Array of items to filter
 * @param {Object} filters - Object containing filter configurations
 * @param {string} filters.area - Area filter
 * @param {Array} filters.initiatives - Initiatives filter
 * @param {Array} filters.stages - Stages filter
 * @returns {Array} Filtered items
 */
export const applyFilters = (items, filters) => {
  if (!items) return items

  let filtered = items

  if (filters.area) {
    filtered = filterByArea(filtered, filters.area)
  }

  if (filters.initiatives) {
    filtered = filterByInitiatives(filtered, filters.initiatives)
  }

  if (filters.stages) {
    filtered = filterByStages(filtered, filters.stages)
  }

  return filtered
}

/**
 * Complete filtering utilities object for backward compatibility
 */
export const filteringUtils = {
  filterByArea,
  filterByInitiatives,
  filterByStages,
  applyFilters
}

export default filteringUtils
