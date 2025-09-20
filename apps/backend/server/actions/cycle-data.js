import collectCycleData from '../service/collect-cycle-data.js';
import buildOverview from '../calculator/generate-overview.js';
import { logger } from '@omega-one/shared-utils';
import pkg from "lodash";
const { groupBy } = pkg;

/**
 * Cycle data endpoint that serves both roadmap and cycle overview data
 * This replaces the need for separate cycle-overview.js and cycles-roadmap.js actions
 */
export default async (context) => {
  const omegaConfig = context.omegaConfig;
  
  // Get parameters
  const cycleId = context.params.id || context.query.cycleId;
  const filters = context.query.filters ? JSON.parse(context.query.filters) : {};
  
  logger.default.info('building cycle data', { cycleId, filters });

  try {
    // Collect all necessary data
    const { 
      roadmapItems, 
      issues, 
      issuesByRoadmapItems, 
      cycle, 
      cycles, 
      assignees, 
      areas, 
      initiatives: configInitiatives, 
      stages,
      teams 
    } = await collectCycleData(cycleId, omegaConfig);

    // Build unified data structure that both views can use
    const roadmapData = buildOverview(issues, issuesByRoadmapItems, roadmapItems, cycles, omegaConfig);
    const groupedInitiatives = groupBy(roadmapData, x => x.initiativeId);
    
    // Convert to unified structure
    const unifiedInitiatives = Object.entries(groupedInitiatives).map(([initiativeId, roadmapItems]) => ({
      initiativeId,
      initiative: roadmapItems[0]?.initiative || initiativeId,
      roadmapItems: roadmapItems.map(item => {
        // Calculate progress from release items
        const allReleaseItems = item.sprints?.flatMap(sprint => sprint.releaseItems || []) || [];
        const completedItems = allReleaseItems.filter(ri => ri.status === 'done').length;
        const totalItems = allReleaseItems.length;
        const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        
        // Calculate total weeks from effort
        const totalWeeks = allReleaseItems.reduce((sum, ri) => sum + (ri.effort || 0), 0);
        
        // Get primary owner from most recent release item
        const primaryOwner = allReleaseItems.length > 0 
          ? allReleaseItems[allReleaseItems.length - 1].assignee || 'Unassigned'
          : 'Unassigned';
        
        // Get cycle names from cycles data
        const getCycleName = (sprintId) => {
          const cycle = cycles.find(c => c.id === sprintId);
          return cycle ? cycle.name : `Cycle ${sprintId}`;
        };
        
        return {
          id: item.id,
          name: item.summary || item.name || `Roadmap Item ${item.id}`, // Map summary to name
          area: item.area,
          theme: item.theme,
          owner: primaryOwner,
          progress: progress,
          weeks: totalWeeks,
          url: item.url || `https://example.com/browse/${item.id}`,
          validations: item.validations || [],
          releaseItems: item.sprints?.flatMap(sprint => 
            (sprint.releaseItems || []).map(releaseItem => ({
              ...releaseItem,
              cycle: {
                id: sprint.sprintId,
                name: getCycleName(sprint.sprintId)
              }
            }))
          ) || []
        };
      })
    }));

    // Convert areas object to array for consistency
    const areasArray = Object.entries(areas).map(([id, areaData]) => ({
      id,
      ...areaData
    }));

    // Simplified response structure - frontend works directly with this data
    const response = {
      cycles,
      stages,
      areas: areasArray,
      assignees,
      initiatives: unifiedInitiatives
    };

    // Apply server-side filtering if requested
    if (Object.keys(filters).length > 0) {
      response = applyServerSideFilters(response, filters);
    }

    context.body = response;

  } catch (error) {
    logger.default.error('Error building unified data', error);
    context.status = 500;
    context.body = {
      success: false,
      error: error.message,
      message: 'Failed to build unified data'
    };
  }
};


/**
 * Apply server-side filtering to the data
 * This is a placeholder for future server-side filtering implementation
 */
const applyServerSideFilters = (data, filters) => {
  if (!filters || Object.keys(filters).length === 0) {
    return data;
  }

  let filteredData = { ...data };

  // Apply area filtering
  if (filters.area && filters.area !== 'all') {
    filteredData = filterByArea(filteredData, filters.area);
  }

  // Apply initiative filtering
  if (filters.initiatives && filters.initiatives.length > 0) {
    filteredData = filterByInitiatives(filteredData, filters.initiatives);
  }

  // Apply stage filtering
  if (filters.stages && filters.stages.length > 0) {
    filteredData = filterByStages(filteredData, filters.stages);
  }

  return filteredData;
};

// Server-side filter implementations (adapted from frontend filters)

const filterByArea = (data, selectedArea) => {
  if (!selectedArea || selectedArea === 'all') {
    return data;
  }

  const filteredInitiatives = data.initiatives.map(initiative => {
    const filteredRoadmapItems = initiative.roadmapItems.map(roadmapItem => {
      const filteredReleaseItems = roadmapItem.releaseItems ? roadmapItem.releaseItems.filter(releaseItem => {
        // Check direct area match (case-insensitive)
        if (releaseItem.area && releaseItem.area.toLowerCase() === selectedArea.toLowerCase()) {
          return true;
        }
        
        // Check areaIds array match
        if (releaseItem.areaIds && Array.isArray(releaseItem.areaIds)) {
          return releaseItem.areaIds.some(areaId => 
            areaId && areaId.toLowerCase() === selectedArea.toLowerCase()
          );
        }
        
        return false;
      }) : [];
      
      // Only keep roadmap items that have matching release items after area filtering
      if (filteredReleaseItems.length > 0) {
        return { ...roadmapItem, releaseItems: filteredReleaseItems };
      }
      
      return null;
    }).filter(item => item !== null);

    // Only keep initiatives that have matching roadmap items after filtering
    if (filteredRoadmapItems.length > 0) {
      return { ...initiative, roadmapItems: filteredRoadmapItems };
    }
    
    return null;
  }).filter(item => item !== null);

  return { ...data, initiatives: filteredInitiatives };
};

const filterByInitiatives = (data, selectedInitiatives) => {
  if (!selectedInitiatives || selectedInitiatives.length === 0) {
    return data;
  }

  // Check if "All" is selected
  const isAllSelected = selectedInitiatives.some(init => 
    init && (init.id === 'all' || init.value === 'all')
  );
  
  if (isAllSelected) {
    return data;
  }

  // Filter by selected initiative IDs
  const selectedInitiativeIds = selectedInitiatives
    .filter(init => init && init.id)
    .map(init => String(init.id));

  const filteredInitiatives = data.initiatives.filter(initiative => 
    selectedInitiativeIds.includes(String(initiative.initiativeId))
  );

  return { ...data, initiatives: filteredInitiatives };
};

const filterByStages = (data, selectedStages) => {
  if (!selectedStages || selectedStages.length === 0) {
    return data;
  }

  // Check if "All" is selected
  const isAllSelected = selectedStages.some(stage => 
    stage && (stage.id === 'all' || stage.value === 'all')
  );
  
  if (isAllSelected) {
    return data;
  }

  // Filter by selected stage values/IDs
  const selectedStageValues = selectedStages
    .filter(stage => stage && (stage.value || stage.id || stage.name))
    .map(stage => stage.value || stage.id || stage.name)
    .filter(value => value !== 'all');

  const filteredInitiatives = data.initiatives.map(initiative => {
    const filteredRoadmapItems = initiative.roadmapItems.map(roadmapItem => {
      // Only filter release items by stage - roadmap items don't have stages
      const filteredReleaseItems = roadmapItem.releaseItems ? roadmapItem.releaseItems.filter(releaseItem => {
        // Check if release item stage matches any selected stage
        if (releaseItem.stage && selectedStageValues.includes(releaseItem.stage)) {
          return true;
        }
        
        return false;
      }) : [];
      
      // Only keep roadmap items that have matching release items after stage filtering
      if (filteredReleaseItems.length > 0) {
        return { ...roadmapItem, releaseItems: filteredReleaseItems };
      }
      
      return null;
    }).filter(item => item !== null);

    // Only keep initiatives that have matching roadmap items after filtering
    if (filteredRoadmapItems.length > 0) {
      return { ...initiative, roadmapItems: filteredRoadmapItems };
    }
    
    return null;
  }).filter(item => item !== null);

  return { ...data, initiatives: filteredInitiatives };
};
