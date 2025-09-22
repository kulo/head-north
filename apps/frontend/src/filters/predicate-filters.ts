/**
 * Predicate-based filtering system
 * Provides composable predicate functions that can be combined
 */

interface ReleaseItem {
  area?: string
  areaIds?: string[]
  initiativeId?: string
  assignee?: {
    accountId?: string
    id?: string
  }
  stage?: string
  cycleId?: string
  sprint?: { id: string }
}

interface Initiative {
  id?: string
  value?: string
}

interface Assignee {
  id?: string
  value?: string
}

interface Stage {
  id?: string
  value?: string
  name?: string
}

interface Cycle {
  id: string
  name?: string
}

/**
 * Create a predicate that filters by area
 * @param selectedArea - Selected area to filter by
 * @returns Predicate function
 */
export const createAreaPredicate = (selectedArea: string) => {
  if (!selectedArea || selectedArea === 'all') {
    return () => true // No filtering
  }

  return (releaseItem: ReleaseItem): boolean => {
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
 * @param selectedInitiatives - Array of selected initiatives
 * @returns Predicate function
 */
export const createInitiativesPredicate = (selectedInitiatives: Initiative[]) => {
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

  return (item: any): boolean => {
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
 * @param selectedStages - Array of selected stages
 * @returns Predicate function
 */
export const createStagesPredicate = (selectedStages: Stage[]) => {
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

  return (releaseItem: ReleaseItem): boolean => {
    // Only filter release items by stage - roadmap items don't have stages
    if (releaseItem.stage && selectedStageValues.includes(releaseItem.stage)) {
      return true
    }
    
    return false
  }
}

/**
 * Create a predicate that filters by cycle
 * @param selectedCycle - Selected cycle ID or cycle object
 * @returns Predicate function
 */
export const createCyclePredicate = (selectedCycle: string | Cycle) => {
  if (selectedCycle === null || selectedCycle === undefined) {
    console.error('createCyclePredicate: No cycle provided. Client code must ensure a valid cycle is passed.')
    return () => false // Reject all items
  }

  // Extract cycle ID from cycle object or use the value directly
  const cycleId = typeof selectedCycle === 'object' ? selectedCycle.id : selectedCycle
  
  if (!cycleId || cycleId === 'all' || cycleId === '') {
    console.error('createCyclePredicate: Invalid cycle ID provided. Client code must ensure a valid cycle ID is passed.')
    return () => false // Reject all items
  }

  return (releaseItem: ReleaseItem): boolean => {
    // Check cycleId match
    if (releaseItem.cycleId && releaseItem.cycleId === cycleId) {
      return true
    }
    
    // Check if release item belongs to the selected cycle through sprint
    if (releaseItem.sprint && releaseItem.sprint.id === cycleId) {
      return true
    }
    
    return false
  }
}

/**
 * Combine multiple predicates using AND logic
 * @param predicates - Predicate functions to combine
 * @returns Combined predicate function
 */
export const combinePredicates = (...predicates: Array<(item: any) => boolean>) => {
  return (item: any): boolean => predicates.every(predicate => predicate(item))
}

interface FilterConfig {
  area?: string
  initiatives?: Initiative[]
  stages?: Stage[]
  cycle?: string | Cycle
}

/**
 * Create a composite predicate from filter configuration
 * @param filters - Filter configuration object
 * @returns Object containing releaseItemPredicate and initiativePredicate
 */
export const createFilterPredicates = (filters: FilterConfig) => {
  // Handle null or undefined filters
  if (!filters) {
    filters = {}
  }

  // Only include cycle predicate if cycle filter is provided
  const predicates = [
    createAreaPredicate(filters.area),
    createStagesPredicate(filters.stages)
  ]

  if (filters.cycle !== undefined) {
    predicates.push(createCyclePredicate(filters.cycle))
  }

  const releaseItemPredicate = combinePredicates(...predicates)
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
  createCyclePredicate,
  combinePredicates,
  createFilterPredicates
}
