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
  const cycleId = context.params.id || context.query.cycleId || context.query.sprintId;
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
        name: item.name,
        area: item.area,
        theme: item.theme,
        releaseItems: item.sprints?.flatMap(sprint => sprint.releaseItems) || []
      }))
    }));

    const response = {
      metadata: {
        cycles: {
          active: cycle,
          ordered: cycles,
          byState: {
            active: cycles.filter(c => c.state === 'active'),
            closed: cycles.filter(c => c.state === 'closed'),
            future: cycles.filter(c => c.state === 'future')
          }
        },
        stages,
        areas,
        assignees,
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
