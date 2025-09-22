/**
 * Area filtering utilities
 * Filters items by area (case-insensitive)
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

/**
 * Filter items by area (case-insensitive)
 * Works with both roadmap and cycle-overview data structures
 * 
 * @param items - Array of items to filter
 * @param selectedArea - Selected area to filter by
 * @returns Filtered items
 */
export const filterByArea = (items: Item[], selectedArea: string): Item[] => {
  if (!selectedArea || selectedArea === 'all') {
    return items
  }

  return items.map(item => {
    // Handle different data structures
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

export default filterByArea
