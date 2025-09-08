import { ReleaseItemParser } from './release-item-parser.js';
import { RoadmapItemParser } from './roadmap-item-parser.js';
import { resolveStage, isReleasableStage, isFinalReleaseStage } from './resolve-stage.js';
import { possibleFutureStatus } from './resolve-status.js';
import { isScheduledForFuture, isInBacklog } from './resolve-sprint.js';

const hasAnyReleaseItem = (x) => x.releaseItems.length > 0;
const validateGTMPlan = (releaseItems) => {
  if(!releaseItems) return {};
  const releaseItemStates = releaseItems.map(releaseItem => {
    const stage = resolveStage(releaseItem.summary);
    return {
      stage,
      isInFutureSprint: isScheduledForFuture(releaseItem),
      isInBacklog: isInBacklog(releaseItem),
      isReleasableStage: isReleasableStage(stage),
      isFinalReleaseStage: isFinalReleaseStage(stage),
      isPossibleFutureStatus: possibleFutureStatus(releaseItem)
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

  return Object.entries(projects).map(([id, project]) => {
    const roadmapItem = roadmapItemParser.parse(id, issuesByRoadmapItems[id] || []);
    return {
      summary: roadmapItem.name,
      id,
      initiative: roadmapItem.initiative,
      initiativeId: roadmapItem.initiativeId,
      theme: roadmapItem.theme,
      area: roadmapItem.area,
      url: roadmapItem.url,
      validations:validateGTMPlan(issuesByRoadmapItems[id]),
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
}
