import collectUnifiedData from '../service/collect-unified-data.js';
import buildOverview from '../calculator/generate-overview.js';
import { logger } from '@omega-one/shared-utils';
import pkg from "lodash";
const { groupBy } = pkg;

/**
 * Unified data endpoint that serves both roadmap and cycle overview data
 * This replaces the need for separate cycle-overview.js and cycles-roadmap.js actions
 */
export default async (context) => {
  const omegaConfig = context.omegaConfig;
  
  // Get parameters
  const cycleId = context.params.id || context.query.cycleId;
  const filters = context.query.filters ? JSON.parse(context.query.filters) : {};
  
  logger.default.info('building unified data', { cycleId, filters });

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
    } = await collectUnifiedData(cycleId, omegaConfig);

    // Build unified data structure that both views can use
    const roadmapData = buildOverview(issues, issuesByRoadmapItems, roadmapItems, cycles, omegaConfig);
    const groupedInitiatives = groupBy(roadmapData, x => x.initiativeId);
    
    // Convert to unified structure
    const unifiedInitiatives = Object.entries(groupedInitiatives).map(([initiativeId, roadmapItems]) => ({
      initiativeId,
      initiative: roadmapItems[0]?.initiative || initiativeId,
      roadmapItems: roadmapItems.map(item => ({
        id: item.id,
        name: item.summary || item.name || `Roadmap Item ${item.id}`, // Map summary to name
        area: item.area,
        theme: item.theme,
        owner: 'Unassigned', // TODO: Get from actual data
        progress: Math.floor(Math.random() * 100), // TODO: Calculate from actual data
        weeks: Math.floor(Math.random() * 8) + 1, // TODO: Calculate from actual data
        url: item.url || `https://example.com/browse/${item.id}`,
        validations: item.validations || [],
        releaseItems: item.sprints?.flatMap(sprint => 
          (sprint.releaseItems || []).map(releaseItem => ({
            ...releaseItem,
            cycle: {
              id: sprint.sprintId,
              name: `Cycle ${sprint.sprintId}` // TODO: Get actual cycle name
            }
          }))
        ) || []
      }))
    }));

    // Convert areas object to array for consistency
    const areasArray = Object.entries(areas).map(([id, areaData]) => ({
      id,
      ...areaData
    }));

    const response = {
      metadata: {
        cycles,
        stages,
        organisation: {
          areas: areasArray,
          assignees
        },
        initiatives: configInitiatives
      },
      data: {
        initiatives: unifiedInitiatives
      }
    };

    // Apply server-side filtering if requested
    if (Object.keys(filters).length > 0) {
      response.data = applyServerSideFilters(response.data, filters);
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
  // TODO: Implement server-side filtering
  // For now, just return the data as-is
  return data;
};
