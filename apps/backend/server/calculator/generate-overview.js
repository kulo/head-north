import { ReleaseItemParser } from './release-item-parser.js';
import { RoadmapItemParser } from './roadmap-item-parser.js';
import { resolveStage, isReleasableStage, isFinalReleaseStage } from './resolve-stage.js';
import { resolveStatus } from './resolve-status.js';

const hasAnyReleaseItem = (x) => x.releaseItems.length > 0;

// Helper functions (moved from resolve-sprint.js)
const isScheduledForFuture = (issueFields) => {
  return !!issueFields.sprint && new Date() < new Date(issueFields.sprint.endDate);
};

const isInBacklog = (issueFields, omegaConfig) => {
  const status = resolveStatus(issueFields, null, omegaConfig);
  return omegaConfig.isFutureStatus(status) && !issueFields.sprint;
};

const validateGTMPlan = (releaseItems, omegaConfig) => {
  if(!releaseItems) return {};
  const releaseItemStates = releaseItems.map(releaseItem => {
    const stage = resolveStage(releaseItem.summary, omegaConfig);
    return {
      stage,
      isInFutureSprint: isScheduledForFuture(releaseItem),
      isInBacklog: isInBacklog(releaseItem, omegaConfig),
      isReleasableStage: isReleasableStage(stage, omegaConfig),
      isFinalReleaseStage: isFinalReleaseStage(stage, omegaConfig),
      isPossibleFutureStatus: omegaConfig.isFutureStatus(resolveStatus(releaseItem, null, omegaConfig))
    }
  });
  return {
    hasScheduledRelease: releaseItemStates.some(releaseItemState => {
      return releaseItemState.isInFutureSprint && releaseItemState.isReleasableStage;
    }),
    hasGlobalReleaseInBacklog: releaseItemStates.some(releaseItemState => {
      return (releaseItemState.isInBacklog || releaseItemState.isInFutureSprint) && releaseItemState.isFinalReleaseStage;
    })
  };
}


export default (issues, issuesByRoadmapItems, projects, sprints, omegaConfig) => {
  const roadmapItemParser = new RoadmapItemParser(projects, omegaConfig);
  const releaseItemsPerSprintGroups = issues.map((issueList, index) => {
    const currentSprint = sprints[index];
    const parser = new ReleaseItemParser(currentSprint, omegaConfig);
    const epics = issueList.map(issue => parser.parse(issue));

    return {
      sprintId: currentSprint.id,
      releaseItems: epics
    }
  });

  const roadmapItems = Object.entries(projects).map(([id, project]) => {
    const roadmapItem = roadmapItemParser.parse(id, issuesByRoadmapItems[id] || []);
    return {
      summary: roadmapItem.name,
      id,
      initiative: roadmapItem.initiative,
      initiativeId: roadmapItem.initiativeId,
      theme: roadmapItem.theme,
      area: roadmapItem.area,
      url: roadmapItem.url,
      validations:validateGTMPlan(issuesByRoadmapItems[id], omegaConfig),
      sprints: releaseItemsPerSprintGroups.map((releaseItems) => {
        const releaseItemsForRoadmapItem = releaseItems.releaseItems
          .filter(item => item.projectId === id);
        const { epics } = roadmapItemParser.parse(id, releaseItemsForRoadmapItem);
        return {
          ...releaseItems,
          releaseItems: epics.filter(item => item.isExternal)
        };
      }).filter(hasAnyReleaseItem)
    };
  }).filter(entry => entry.sprints.some(hasAnyReleaseItem));
  
  return roadmapItems;
}
