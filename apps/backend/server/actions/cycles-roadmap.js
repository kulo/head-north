import collectRoadmapData from '../service/collect-roadmap-data.js';
import buildOverview from '../calculator/generate-overview.js';
import { logger } from '@omega-one/shared-utils';
import pkg from "lodash";
const { uniqBy, uniq, groupBy, pick } = pkg;

const getInitiatives = (roadmapItems) => {
  const usedInitiatives = roadmapItems.map(roadmapItem => ({
    id: roadmapItem.initiativeId,
    name: roadmapItem.initiative
  }));
  return uniqBy(usedInitiatives, initiative => initiative.id);
};

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

const getAreas = (roadmapItems, omegaConfig) => {
  const areaIds = roadmapItems.map(roadmapItem => {
    return roadmapItem.cycles.map(cycle => {
      return cycle.releaseItems.map(item => item.areaIds).flat();
    }).flat();
  }).flat();

  const uniqAreaIds = uniq(areaIds);
  return pick(omegaConfig.getLabelTranslations().area, uniqAreaIds);
};

export default async (context) => {
  
  const omegaConfig = context.omegaConfig;
  
  const { roadmapItems, issuesByRoadmapItems, issues, cycle, cycles } = await collectRoadmapData(omegaConfig);
  
  let roadmapItemsResult = buildOverview(issues, issuesByRoadmapItems, roadmapItems, cycles, omegaConfig);

  let initiatives = getInitiatives(roadmapItemsResult);
  let areas = getAreas(roadmapItemsResult, omegaConfig);
  let assignees = getAssignees(roadmapItemsResult);
  
  context.body = {
    groupedRoadmapItems: groupBy(roadmapItemsResult, x => x.initiativeId),
    cycle,  // Use cycle instead of sprint
    cycles, // Use cycles instead of sprints
    stages: omegaConfig.getStages(),
    area: areas,
    assignees: assignees,
    initiatives: initiatives
  };
};
