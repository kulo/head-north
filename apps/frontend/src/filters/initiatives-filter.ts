/**
 * Initiatives filtering utilities
 * Filters items by selected initiatives
 */

interface Initiative {
  id?: string
  value?: string
}

interface Item {
  initiativeId?: string
  initiatives?: Initiative[]
}

/**
 * Filter items by selected initiatives
 * 
 * @param items - Array of items to filter
 * @param selectedInitiatives - Array of selected initiatives
 * @returns Filtered items
 */
export const filterByInitiatives = (items: Item[], selectedInitiatives: Initiative[]): Item[] => {
  if (!selectedInitiatives || selectedInitiatives.length === 0) {
    return items
  }

  // Check if "All" is selected
  const isAllSelected = selectedInitiatives.some(init => 
    init && (init.id === 'all' || init.value === 'all')
  )
  
  if (isAllSelected) {
    return items
  }

  // Filter by selected initiative IDs
  const selectedInitiativeIds = selectedInitiatives
    .filter(init => init && init.id)
    .map(init => String(init.id))
    .filter(id => id !== 'all')

  return items.filter(item => {
    if (item.initiativeId) {
      // Roadmap structure
      return selectedInitiativeIds.includes(String(item.initiativeId))
    } else if (item.initiatives) {
      // Cycle-overview structure - filter initiatives within the item
      const filteredInitiatives = item.initiatives.filter(initiative => 
        selectedInitiativeIds.includes(String(initiative.initiativeId))
      )
      return filteredInitiatives.length > 0
    }
    return true
  })
}

export default filterByInitiatives
