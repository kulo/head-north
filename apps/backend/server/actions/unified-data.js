import collectUnifiedData from '../service/collect-unified-data.js';
import parseJiraIssues from '../calculator/parse-jira-issues.js';
import buildOverview from '../calculator/generate-overview.js';
import { logger } from '@omega-one/shared-utils';
import pkg from "lodash";
const { uniqBy, uniq, groupBy, pick } = pkg;

/**
 * Unified data endpoint that serves both roadmap and cycle overview data
 * This replaces the need for separate cycle-overview.js and cycles-roadmap.js actions
 */
export default async (context) => {
  const omegaConfig = context.omegaConfig;
  
  // Get parameters
  const cycleId = context.params.id || context.query.cycleId || context.query.sprintId;
  const view = context.query.view || 'both'; // 'roadmap', 'cycle-overview', or 'both'
  const filters = context.query.filters ? JSON.parse(context.query.filters) : {};
  
  logger.default.info('building unified data', { cycleId, view, filters });

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

    // Build response based on view type
    const response = {
      metadata: {
        type: view === 'both' ? 'unified' : view,
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
      data: {}
    };

    // Add roadmap data if requested
    if (view === 'roadmap' || view === 'both') {
      const roadmapData = buildOverview(issues, issuesByRoadmapItems, roadmapItems, cycles, omegaConfig);
      response.data.roadmap = {
        groupedRoadmapItems: groupBy(roadmapData, x => x.initiativeId),
        initiatives: getInitiatives(roadmapData),
        areas: getAreas(roadmapData, omegaConfig),
        assignees: getAssignees(roadmapData)
      };
    }

    // Add cycle overview data if requested
    if (view === 'cycle-overview' || view === 'both') {
      const cycleIssues = cycleId ? issues[0] : issues.flat();
      const initiatives = parseJiraIssues(cycleIssues, roadmapItems, cycle, omegaConfig);
      
      response.data.cycleOverview = {
        devCycleData: {
          cycle,
          initiatives,
          area: omegaConfig.getLabelTranslations().areas,
          assignees,
          teams
        }
      };
    }

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
 * Extract initiatives from roadmap data
 */
const getInitiatives = (roadmapItems) => {
  const usedInitiatives = roadmapItems.map(roadmapItem => ({
    id: roadmapItem.initiativeId,
    name: roadmapItem.initiative
  }));
  return uniqBy(usedInitiatives, initiative => initiative.id);
};

/**
 * Extract areas from roadmap data
 */
const getAreas = (roadmapItems, omegaConfig) => {
  const areaIds = roadmapItems.map(roadmapItem => {
    return roadmapItem.cycles.map(cycle => {
      return cycle.releaseItems.map(item => item.areaIds).flat();
    }).flat();
  }).flat();

  const uniqAreaIds = uniq(areaIds);
  return pick(omegaConfig.getLabelTranslations().area, uniqAreaIds);
};

/**
 * Extract assignees from roadmap data
 */
const getAssignees = (roadmapItems) => {
  const assignees = roadmapItems.map(roadmapItem => {
    return roadmapItem.cycles.map(cycle => {
      return cycle.releaseItems.map(releaseItem => releaseItem.assignee);
    }).flat();
  }).flat();
  const orderedAssignees = uniqBy(assignees.filter(assignee => assignee !== null), 'accountId')
    .sort((assignee1, assignee2) => assignee1.displayName > assignee2.displayName ? 1 : -1);

  return [{
    displayName: 'All Assignees',
    accountId: 'all'
  }].concat(orderedAssignees);
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
