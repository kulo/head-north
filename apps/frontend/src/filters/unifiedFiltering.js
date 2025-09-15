/**
 * Unified filtering system
 * Combines predicate-based and imperative filtering approaches
 */

import { createFilterPredicates } from './predicateFilters.js'
import { calculateAreaData } from '@/libraries/calculateAreaData.js'

/**
 * Apply filters using the predicate-based approach (for calculateAreaData)
 * @param {Object} cycleData - Cycle data object
 * @param {Object} filters - Filter configuration
 * @returns {Object} Filtered area data
 */
export const applyFiltersWithPredicates = (cycleData, filters) => {
  const { releaseItemPredicate, initiativePredicate } = createFilterPredicates(filters)
  return calculateAreaData(cycleData, releaseItemPredicate, initiativePredicate)
}

/**
 * Apply filters using the imperative approach (for roadmap data)
 * @param {Array} items - Array of items to filter
 * @param {Object} filters - Filter configuration
 * @returns {Array} Filtered items
 */
export const applyFiltersImperative = (items, filters) => {
  if (!items) return items

  let filtered = items

  // Area filtering
  if (filters.area && filters.area !== 'all') {
    filtered = filterByAreaImperative(filtered, filters.area)
  }

  // Initiative filtering
  if (filters.initiatives && filters.initiatives.length > 0) {
    const isAllSelected = filters.initiatives.some(init => 
      init && (init.id === 'all' || init.value === 'all')
    )
    if (!isAllSelected) {
      filtered = filterByInitiativesImperative(filtered, filters.initiatives)
    }
  }

  // Stage filtering
  if (filters.stages && filters.stages.length > 0) {
    const isAllSelected = filters.stages.some(stage => 
      stage && (stage.id === 'all' || stage.value === 'all')
    )
    if (!isAllSelected) {
      filtered = filterByStagesImperative(filtered, filters.stages)
    }
  }

  return filtered
}

/**
 * Imperative area filtering (for roadmap data)
 */
const filterByAreaImperative = (items, selectedArea) => {
  return items.map(item => {
    const roadmapItems = item.roadmapItems || item.initiatives?.flatMap(init => init.roadmapItems) || []
    
    const filteredRoadmapItems = roadmapItems.map(roadmapItem => {
      const filteredReleaseItems = roadmapItem.releaseItems ? roadmapItem.releaseItems.filter(releaseItem => {
        // Check direct area match (case-insensitive)
        if (releaseItem.area && releaseItem.area.toLowerCase() === selectedArea.toLowerCase()) {
          return true
        }
        
        // Check area from roadmap item (case-insensitive)
        if (roadmapItem.area && roadmapItem.area.toLowerCase() === selectedArea.toLowerCase()) {
          return true
        }
        
        return false
      }) : []
      
      const hasMatchingReleaseItems = filteredReleaseItems.length > 0
      const hasDirectAreaMatch = roadmapItem.area && roadmapItem.area.toLowerCase() === selectedArea.toLowerCase()
      
      if (hasMatchingReleaseItems || hasDirectAreaMatch) {
        return { ...roadmapItem, releaseItems: filteredReleaseItems }
      }
      
      return null
    }).filter(item => item !== null)

    if (item.roadmapItems) {
      return { ...item, roadmapItems: filteredRoadmapItems }
    } else if (item.initiatives) {
      return {
        ...item,
        initiatives: item.initiatives.map(initiative => ({
          ...initiative,
          roadmapItems: filteredRoadmapItems.filter(roadmapItem => 
            initiative.roadmapItems.some(orig => orig.id === roadmapItem.id)
          )
        })).filter(initiative => initiative.roadmapItems.length > 0)
      }
    }
    
    return item
  }).filter(item => {
    if (item.roadmapItems) {
      return item.roadmapItems.length > 0
    } else if (item.initiatives) {
      return item.initiatives.length > 0
    }
    return true
  })
}

/**
 * Imperative initiative filtering (for roadmap data)
 */
const filterByInitiativesImperative = (items, selectedInitiatives) => {
  const selectedInitiativeIds = selectedInitiatives
    .filter(init => init && init.id)
    .map(init => String(init.id))
    .filter(id => id !== 'all')

  return items.filter(item => {
    if (item.initiativeId) {
      return selectedInitiativeIds.includes(String(item.initiativeId))
    } else if (item.initiatives) {
      const filteredInitiatives = item.initiatives.filter(initiative => 
        selectedInitiativeIds.includes(String(initiative.initiativeId))
      )
      return filteredInitiatives.length > 0
    }
    return true
  })
}

/**
 * Imperative stage filtering (for roadmap data)
 */
const filterByStagesImperative = (items, selectedStages) => {
  const selectedStageValues = selectedStages
    .filter(stage => stage && (stage.value || stage.id || stage.name))
    .map(stage => stage.value || stage.id || stage.name)
    .filter(value => value !== 'all')

  return items.map(item => {
    const roadmapItems = item.roadmapItems || item.initiatives?.flatMap(init => init.roadmapItems) || []
    
    const filteredRoadmapItems = roadmapItems.map(roadmapItem => {
      const filteredReleaseItems = roadmapItem.releaseItems ? roadmapItem.releaseItems.filter(releaseItem => {
        if (releaseItem.stage && selectedStageValues.includes(releaseItem.stage)) {
          return true
        }
        return false
      }) : []
      
      if (filteredReleaseItems.length > 0) {
        return { ...roadmapItem, releaseItems: filteredReleaseItems }
      }
      
      return null
    }).filter(item => item !== null)

    if (item.roadmapItems) {
      return { ...item, roadmapItems: filteredRoadmapItems }
    } else if (item.initiatives) {
      return {
        ...item,
        initiatives: item.initiatives.map(initiative => ({
          ...initiative,
          roadmapItems: filteredRoadmapItems.filter(roadmapItem => 
            initiative.roadmapItems.some(orig => orig.id === roadmapItem.id)
          )
        })).filter(initiative => initiative.roadmapItems.length > 0)
      }
    }
    
    return item
  }).filter(item => {
    if (item.roadmapItems) {
      return item.roadmapItems.length > 0
    } else if (item.initiatives) {
      return item.initiatives.length > 0
    }
    return true
  })
}

/**
 * Main unified filtering function
 * Automatically chooses the appropriate filtering approach based on data type
 * @param {Array|Object} data - Data to filter (array for roadmap, object for cycle data)
 * @param {Object} filters - Filter configuration
 * @returns {Array|Object} Filtered data
 */
export const applyFilters = (data, filters) => {
  if (!data) return data

  // If it's cycle data (has initiatives property), use predicate-based approach
  if (data.initiatives && Array.isArray(data.initiatives)) {
    return applyFiltersWithPredicates(data, filters)
  }

  // If it's an array of items, use imperative approach
  if (Array.isArray(data)) {
    return applyFiltersImperative(data, filters)
  }

  // Fallback to original data
  return data
}

export default {
  applyFilters,
  applyFiltersWithPredicates,
  applyFiltersImperative
}
