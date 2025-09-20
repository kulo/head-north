import collectCycleData from '../service/collect-cycle-data.js';
import buildOverview from '../calculator/generate-overview.js';
import { logger } from '@omega-one/shared-utils';
import pkg from "lodash";
const { groupBy } = pkg;

/**
 * Get cycle data endpoint that serves both roadmap and cycle overview data
 * This replaces the need for separate cycle-overview.js and cycles-roadmap.js actions
 */
export const getCycleData = async (context) => {
  const omegaConfig = context.omegaConfig;
  
  logger.default.info('building cycle data');

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
    } = await collectCycleData(omegaConfig);

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

    // Return all data - filtering is handled client-side
    context.body = {
      cycles,
      stages,
      areas: areasArray,
      assignees,
      initiatives: unifiedInitiatives
    };

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


