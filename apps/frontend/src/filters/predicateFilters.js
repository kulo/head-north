/**
 * Predicate-based filtering system
 * Provides composable predicate functions that can be combined
 */

/**
 * Create a predicate that filters by area
 * @param {string} selectedArea - Selected area to filter by
 * @returns {Function} Predicate function
 */
export const createAreaPredicate = (selectedArea) => {
  if (!selectedArea || selectedArea === 'all') {
    return () => true // No filtering
  }

  return (releaseItem) => {
    // Check direct area match (case-insensitive)
    if (releaseItem.area && releaseItem.area.toLowerCase() === selectedArea.toLowerCase()) {
      return true
    }
    
    // Check area from areaIds array (case-insensitive)
    if (releaseItem.areaIds && releaseItem.areaIds.some(areaId => 
      areaId.toLowerCase() === selectedArea.toLowerCase()
    )) {
      return true
    }
    
    return false
  }
}

/**
 * Create a predicate that filters by initiatives
 * @param {Array} selectedInitiatives - Array of selected initiatives
 * @returns {Function} Predicate function
 */
export const createInitiativesPredicate = (selectedInitiatives) => {
  if (!selectedInitiatives || selectedInitiatives.length === 0) {
    return () => true // No filtering
  }

  // Check if "All" is selected
  const isAllSelected = selectedInitiatives.some(init => 
    init && (init.id === 'all' || init.value === 'all')
  )
  
  if (isAllSelected) {
    return () => true // No filtering
  }

  // Get selected initiative IDs
  const selectedInitiativeIds = selectedInitiatives
    .filter(init => init && init.id)
    .map(init => String(init.id))
    .filter(id => id !== 'all')

  return (item) => {
    if (item.initiativeId) {
      // Roadmap structure
      return selectedInitiativeIds.includes(String(item.initiativeId))
    } else if (item.initiatives) {
      // Cycle-overview structure - check if any initiative matches
      return item.initiatives.some(initiative => 
        selectedInitiativeIds.includes(String(initiative.initiativeId))
      )
    }
    return true
  }
}

/**
 * Create a predicate that filters by stages
 * @param {Array} selectedStages - Array of selected stages
 * @returns {Function} Predicate function
 */
export const createStagesPredicate = (selectedStages) => {
  if (!selectedStages || selectedStages.length === 0) {
    return () => true // No filtering
  }

  // Check if "All" is selected
  const isAllSelected = selectedStages.some(stage => 
    stage && (stage.id === 'all' || stage.value === 'all')
  )
  
  if (isAllSelected) {
    return () => true // No filtering
  }

  // Get selected stage values/IDs
  const selectedStageValues = selectedStages
    .filter(stage => stage && (stage.value || stage.id || stage.name))
    .map(stage => stage.value || stage.id || stage.name)
    .filter(value => value !== 'all')

  return (releaseItem) => {
    // Only filter release items by stage - roadmap items don't have stages
    if (releaseItem.stage && selectedStageValues.includes(releaseItem.stage)) {
      return true
    }
    
    return false
  }
}

/**
 * Combine multiple predicates using AND logic
 * @param {...Function} predicates - Predicate functions to combine
 * @returns {Function} Combined predicate function
 */
export const combinePredicates = (...predicates) => {
  return (item) => predicates.every(predicate => predicate(item))
}

/**
 * Create a composite predicate from filter configuration
 * @param {Object} filters - Filter configuration object
 * @param {string} filters.area - Area filter
 * @param {Array} filters.initiatives - Initiatives filter
 * @param {Array} filters.stages - Stages filter
 * @returns {Object} Object containing releaseItemPredicate and initiativePredicate
 */
export const createFilterPredicates = (filters) => {
  const releaseItemPredicate = combinePredicates(
    createAreaPredicate(filters.area),
    createStagesPredicate(filters.stages)
  )

  const initiativePredicate = createInitiativesPredicate(filters.initiatives)

  return {
    releaseItemPredicate,
    initiativePredicate
  }
}

export default {
  createAreaPredicate,
  createInitiativesPredicate,
  createStagesPredicate,
  combinePredicates,
  createFilterPredicates
}
