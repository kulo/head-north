/**
 * Cycle filtering utilities
 * Filters items by cycle (case-insensitive)
 * Works with both roadmap and cycle-overview data structures
 */

interface RoadmapItem {
  id: string
  area?: string
  releaseItems?: ReleaseItem[]
}

interface ReleaseItem {
  area?: string
  cycleId?: string
  sprint?: { id: string }
}

interface Initiative {
  initiativeId: string
  roadmapItems: RoadmapItem[]
}

interface Item {
  roadmapItems?: RoadmapItem[]
  initiatives?: Initiative[]
}

interface Cycle {
  id: string
  name?: string
}

/**
 * Filter items by cycle
 * Works with both roadmap and cycle-overview data structures
 * 
 * @param items - Array of items to filter
 * @param selectedCycle - Selected cycle ID or cycle object to filter by
 * @returns Filtered items
 */
export const filterByCycle = (items: Item[], selectedCycle: string | Cycle): Item[] => {
  if (selectedCycle === null || selectedCycle === undefined) {
    console.error('filterByCycle: No cycle provided. Client code must ensure a valid cycle is passed.')
    return []
  }

  // Extract cycle ID from cycle object or use the value directly
  const cycleId = typeof selectedCycle === 'object' ? selectedCycle.id : selectedCycle
  
  if (!cycleId || cycleId === 'all' || cycleId === '') {
    console.error('filterByCycle: Invalid cycle ID provided. Client code must ensure a valid cycle ID is passed.')
    return []
  }

  // Handle null or invalid data
  if (!items || !Array.isArray(items)) {
    console.error('filterByCycle: Invalid items data provided. Expected an array.')
    return []
  }

  return items.map(item => {
    // Handle different data structures
    const roadmapItems = item.roadmapItems || item.initiatives?.flatMap(init => init.roadmapItems) || []
    
    const filteredRoadmapItems = roadmapItems.map(roadmapItem => {
      const filteredReleaseItems = roadmapItem.releaseItems ? roadmapItem.releaseItems.filter(releaseItem => {
        // Check cycleId match
        if (releaseItem.cycleId && releaseItem.cycleId === cycleId) {
          return true
        }
        
        // Check if release item belongs to the selected cycle through sprint
        if (releaseItem.sprint && releaseItem.sprint.id === cycleId) {
          return true
        }
        
        return false
      }) : []
      
      const hasMatchingReleaseItems = filteredReleaseItems.length > 0
      
      if (hasMatchingReleaseItems) {
        return { ...roadmapItem, releaseItems: filteredReleaseItems }
      }
      
      return null
    }).filter(item => item !== null)

    // Return filtered item with appropriate structure
    if (item.roadmapItems) {
      // Roadmap structure
      return { ...item, roadmapItems: filteredRoadmapItems }
    } else if (item.initiatives) {
      // Cycle-overview structure
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
    // Remove items with no matching roadmap items
    if (item.roadmapItems) {
      return item.roadmapItems.length > 0
    } else if (item.initiatives) {
      return item.initiatives.length > 0
    }
    return true
  })
}

export default filterByCycle
