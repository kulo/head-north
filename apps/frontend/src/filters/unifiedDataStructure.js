/**
 * Unified Data Structure Design
 * 
 * This document outlines the proposed unified data structure that can be used
 * for both roadmap and cycle overview views, eliminating the need for different
 * filtering approaches and data transformations.
 */

/**
 * UNIFIED DATA STRUCTURE
 * 
 * All data will follow this consistent structure:
 */
export const UNIFIED_DATA_STRUCTURE = {
  // Common metadata
  metadata: {
    type: 'roadmap' | 'cycle-overview',
    cycle: {
      id: 'string',
      name: 'string', 
      start: 'date',
      delivery: 'date',
      end: 'date',
      progress: 'number',
      // ... other cycle properties
    },
    sprints: [
      {
        id: 'string',
        name: 'string',
        startDate: 'date',
        endDate: 'date'
      }
    ],
    activeSprint: {
      id: 'string',
      name: 'string'
    }
  },
  
  // Unified initiatives structure
  initiatives: [
    {
      initiativeId: 'string',
      initiative: 'string', // display name
      roadmapItems: [
        {
          id: 'string',
          name: 'string',
          area: 'string',
          theme: 'string',
          projectId: 'string',
          url: 'string',
          startDate: 'date',
          validations: [],
          releaseItems: [
            {
              id: 'string',
              ticketId: 'string',
              area: 'string',
              areaIds: ['string'],
              stage: 'string',
              status: 'string',
              effort: 'number',
              assignee: 'object',
              teams: ['string'],
              validations: []
            }
          ]
        }
      ]
    }
  ]
}

/**
 * DATA TRANSFORMATION UTILITIES
 * 
 * These functions convert between the current structures and the unified structure
 */

/**
 * Convert roadmap data to unified structure
 */
export const transformRoadmapToUnified = (roadmapData) => {
  return {
    metadata: {
      type: 'roadmap',
      cycle: null, // Roadmap doesn't have cycle data
      sprints: roadmapData.orderedSprints || [],
      activeSprint: roadmapData.activeSprint || null
    },
    initiatives: roadmapData.roadmapItems || []
  }
}

/**
 * Convert cycle overview data to unified structure  
 */
export const transformCycleOverviewToUnified = (cycleOverviewData) => {
  return {
    metadata: {
      type: 'cycle-overview',
      cycle: cycleOverviewData.cycle || null,
      sprints: [], // Cycle overview doesn't have sprints
      activeSprint: null
    },
    initiatives: cycleOverviewData.initiatives || []
  }
}

/**
 * Convert unified structure back to roadmap format
 */
export const transformUnifiedToRoadmap = (unifiedData) => {
  return {
    orderedSprints: unifiedData.metadata.sprints,
    activeSprint: unifiedData.metadata.activeSprint,
    roadmapItems: unifiedData.initiatives
  }
}

/**
 * Convert unified structure back to cycle overview format
 */
export const transformUnifiedToCycleOverview = (unifiedData) => {
  return {
    cycle: unifiedData.metadata.cycle,
    initiatives: unifiedData.initiatives
  }
}

/**
 * UNIFIED FILTERING
 * 
 * With the unified structure, we only need ONE filtering function
 */
export const filterUnifiedData = (unifiedData, filters) => {
  if (!unifiedData || !unifiedData.initiatives) {
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
      const filteredRoadmapItems = initiative.roadmapItems
        .map(roadmapItem => {
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

  return {
    ...unifiedData,
    initiatives: filteredInitiatives
  }
}

/**
 * MIGRATION STRATEGY
 * 
 * 1. Create unified data structure
 * 2. Add transformation utilities
 * 3. Update store to use unified structure internally
 * 4. Update components to work with unified structure
 * 5. Remove old data structures
 */

export default {
  UNIFIED_DATA_STRUCTURE,
  transformRoadmapToUnified,
  transformCycleOverviewToUnified,
  transformUnifiedToRoadmap,
  transformUnifiedToCycleOverview,
  filterUnifiedData
}
