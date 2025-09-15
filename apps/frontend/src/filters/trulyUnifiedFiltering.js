/**
 * Truly unified filtering system
 * Works with both roadmap and cycle overview data using the same logic
 */

/**
 * Filter initiatives array by area, initiatives, and stages
 * Works for both roadmap and cycle overview data
 * @param {Array} initiatives - Array of initiatives to filter
 * @param {Object} filters - Filter configuration
 * @returns {Array} Filtered initiatives
 */
export const filterInitiatives = (initiatives, filters) => {
  if (!initiatives || !Array.isArray(initiatives)) {
    return initiatives
  }

  let filtered = initiatives

  // Initiative filtering (filter the initiatives themselves)
  if (filters.initiatives && filters.initiatives.length > 0) {
    const isAllSelected = filters.initiatives.some(init => 
      init && (init.id === 'all' || init.value === 'all')
    )
    
    if (!isAllSelected) {
      const selectedInitiativeIds = filters.initiatives
        .filter(init => init && init.id)
        .map(init => String(init.id))
        .filter(id => id !== 'all')

      filtered = filtered.filter(initiative => 
        selectedInitiativeIds.includes(String(initiative.initiativeId))
      )
    }
  }

  // Area and stage filtering (filter within each initiative's roadmap items)
  if (filters.area || filters.stages) {
    filtered = filtered.map(initiative => {
      const filteredRoadmapItems = initiative.roadmapItems
        .map(roadmapItem => {
          // Filter release items by area and stage
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

          // Only keep roadmap items that have matching release items
          if (filteredReleaseItems.length > 0) {
            return { ...roadmapItem, releaseItems: filteredReleaseItems }
          }
          
          return null
        })
        .filter(item => item !== null)

      return { ...initiative, roadmapItems: filteredRoadmapItems }
    })
    .filter(initiative => initiative.roadmapItems.length > 0)
  }

  return filtered
}

/**
 * Main unified filtering function
 * Automatically detects data type and applies appropriate filtering
 * @param {Array|Object} data - Data to filter
 * @param {Object} filters - Filter configuration
 * @returns {Array|Object} Filtered data
 */
export const applyFilters = (data, filters) => {
  if (!data) return data

  // If it's an array of initiatives, filter directly
  if (Array.isArray(data)) {
    return filterInitiatives(data, filters)
  }

  // If it's cycle data with initiatives property, filter the initiatives
  if (data.initiatives && Array.isArray(data.initiatives)) {
    return {
      ...data,
      initiatives: filterInitiatives(data.initiatives, filters)
    }
  }

  // If it's roadmap data with roadmapItems, convert to initiatives format and filter
  if (data.roadmapItems && Array.isArray(data.roadmapItems)) {
    // Convert roadmap data to initiatives format
    const initiatives = Object.values(
      data.roadmapItems.reduce((acc, item) => {
        const initiativeId = item.initiativeId
        if (!acc[initiativeId]) {
          acc[initiativeId] = {
            initiativeId,
            initiative: item.initiative,
            roadmapItems: []
          }
        }
        acc[initiativeId].roadmapItems.push(item)
        return acc
      }, {})
    )

    const filteredInitiatives = filterInitiatives(initiatives, filters)
    
    // Convert back to roadmap format
    const filteredRoadmapItems = filteredInitiatives.flatMap(initiative => 
      initiative.roadmapItems
    )

    return {
      ...data,
      roadmapItems: filteredRoadmapItems
    }
  }

  // Fallback to original data
  return data
}

export default {
  applyFilters,
  filterInitiatives
}
