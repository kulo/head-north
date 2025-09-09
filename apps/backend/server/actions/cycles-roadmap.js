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
    return roadmapItem.sprints.map(sprint => {
      return sprint.releaseItems.map(releaseItem => releaseItem.assignee);
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
    return roadmapItem.sprints.map(sprint => {
      return sprint.releaseItems.map(item => item.areaIds).flat();
    }).flat();
  }).flat();

  const uniqAreaIds = uniq(areaIds);
  return pick(omegaConfig.getLabelTranslations().area, uniqAreaIds);
};

export default async (context) => {
  
  const omegaConfig = context.omegaConfig;
  
  const { projects, issuesByRoadmapItems, issues, sprint, sprints } = await collectRoadmapData(omegaConfig);
  
  let roadmapItems = buildOverview(issues, issuesByRoadmapItems, projects, sprints, omegaConfig);

  let initiatives = getInitiatives(roadmapItems);
  let areas = getAreas(roadmapItems, omegaConfig);
  let assignees = getAssignees(roadmapItems);
  
  context.body = {
    groupedRoadmapItems: groupBy(roadmapItems, x => x.initiativeId),
    sprint,
    sprints,
    stages: omegaConfig.getStages(),
    area: areas,
    assignees: assignees,
    initiatives: initiatives
  };
};
