import collectJiraData from '../service/collect-release-overview.js';
import buildOverview from '../calculator/buid-overview.js';
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
  // Get omegaConfig from context
  const omegaConfig = context.omegaConfig;
  
  const { projects, issuesByRoadmapItems, issues, sprint, sprints } = await collectJiraData(omegaConfig);
  
  
  let roadmapItems = buildOverview(issues, issuesByRoadmapItems, projects, sprints, omegaConfig);
  
  
  // If no roadmap items generated, create some basic ones from projects
  if (roadmapItems.length === 0) {
    logger.service.info('No roadmap items generated, creating basic ones from projects');
    roadmapItems = Object.entries(projects).map(([projectId, project]) => ({
      id: projectId,
      summary: project.summary,
      initiative: project.externalRoadmap,
      initiativeId: project.initiativeId,
      theme: project.externalRoadmapDescription,
      area: project.area,
      url: `https://example.com/browse/${projectId}`,
      validations: {
        hasScheduledRelease: Math.random() > 0.5,
        hasGlobalReleaseInBacklog: Math.random() > 0.5
      },
      sprints: sprints.map(sprint => ({
        sprintId: sprint.id,
        releaseItems: [
          {
            ticketId: `${projectId}-TASK-1`,
            name: `${project.summary} - Task 1`,
            url: `https://example.com/browse/${projectId}-TASK-1`,
            stage: 's1',
            isExternal: true
          },
          {
            ticketId: `${projectId}-TASK-2`,
            name: `${project.summary} - Task 2`,
            url: `https://example.com/browse/${projectId}-TASK-2`,
            stage: 's2',
            isExternal: true
          }
        ]
      }))
    }));
    logger.service.info('Created basic roadmap items', { count: roadmapItems.length });
  }
  
  // Get initiatives and areas from fake data generator if available
  let initiatives = getInitiatives(roadmapItems);
  let areas = getAreas(roadmapItems, omegaConfig);
  let assignees = getAssignees(roadmapItems);
  
  // If no initiatives/areas/assignees from roadmap items, try to get them from fake data generator
  if (initiatives.length === 0 || Object.keys(areas).length === 0 || assignees.length <= 1) {
    const { default: FakeDataGenerator } = await import('../service/fake-data-generator.js');
    const fakeData = new FakeDataGenerator();
    initiatives = fakeData.getInitiatives();
    areas = fakeData.getAreas().reduce((acc, area) => {
      acc[area.id] = area.name;
      return acc;
    }, {});
    assignees = fakeData.getAssignees();
  }
  
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
