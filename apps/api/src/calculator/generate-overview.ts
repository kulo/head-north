import { ReleaseItemParser } from "./release-item-parser";
import { RoadmapItemParser } from "./roadmap-item-parser";
import {
  resolveStage,
  isReleasableStage,
  isFinalReleaseStage,
} from "./resolve-stage";
import { resolveStatus } from "./resolve-status";
import type { OmegaConfig } from "@omega/config";

const hasAnyReleaseItem = (x: { releaseItems: unknown[] }) =>
  x.releaseItems.length > 0;

// Helper functions (moved from resolve-sprint.js)
const isScheduledForFuture = (issueFields: {
  sprint?: { endDate: string };
}): boolean => {
  return (
    !!issueFields.sprint && new Date() < new Date(issueFields.sprint.endDate)
  );
};

const isInBacklog = (
  issueFields: { sprint?: unknown },
  omegaConfig: OmegaConfig,
): boolean => {
  const status = resolveStatus(issueFields, null, omegaConfig);
  return omegaConfig.isFutureStatus(status) && !issueFields.sprint;
};

const validateGTMPlan = (releaseItems: unknown[], omegaConfig: OmegaConfig) => {
  if (!releaseItems) return {};
  const releaseItemStates = releaseItems.map((releaseItem) => {
    const stage = resolveStage(releaseItem.summary, omegaConfig);
    return {
      stage,
      isInFutureSprint: isScheduledForFuture(releaseItem),
      isInBacklog: isInBacklog(releaseItem, omegaConfig),
      isReleasableStage: isReleasableStage(stage, omegaConfig),
      isFinalReleaseStage: isFinalReleaseStage(stage, omegaConfig),
      isPossibleFutureStatus: omegaConfig.isFutureStatus(
        resolveStatus(releaseItem, null, omegaConfig),
      ),
    };
  });
  return {
    hasScheduledRelease: releaseItemStates.some((releaseItemState) => {
      return (
        releaseItemState.isInFutureSprint && releaseItemState.isReleasableStage
      );
    }),
    hasGlobalReleaseInBacklog: releaseItemStates.some((releaseItemState) => {
      return (
        (releaseItemState.isInBacklog || releaseItemState.isInFutureSprint) &&
        releaseItemState.isFinalReleaseStage
      );
    }),
  };
};

export default (
  issues: unknown[][],
  issuesByRoadmapItems: Record<string, unknown[]>,
  roadmapItems: Record<string, unknown>,
  sprints: unknown[],
  omegaConfig: OmegaConfig,
): unknown[] => {
  const roadmapItemParser = new RoadmapItemParser(roadmapItems, omegaConfig);
  const releaseItemsPerSprintGroups = issues.map((issueList, index) => {
    const currentSprint = sprints[index];
    const parser = new ReleaseItemParser(currentSprint, omegaConfig);
    const releaseItems = issueList.map((issue: unknown) => parser.parse(issue));

    return {
      sprintId: currentSprint.id,
      releaseItems: releaseItems,
    };
  });

  const roadmapItemsResult = Object.entries(roadmapItems)
    .map(([id, _roadmapItemData]) => {
      const roadmapItem = roadmapItemParser.parse(
        id,
        issuesByRoadmapItems[id] || [],
      );
      return {
        summary: roadmapItem.name,
        id: roadmapItem.initiative.id,
        name: roadmapItem.initiative.name,
        theme: roadmapItem.theme,
        area: roadmapItem.area,
        url: roadmapItem.url,
        validations: validateGTMPlan(issuesByRoadmapItems[id], omegaConfig),
        sprints: releaseItemsPerSprintGroups
          .map((releaseItems) => {
            const releaseItemsForRoadmapItem = releaseItems.releaseItems.filter(
              (item: { projectId: string }) => item.projectId === id,
            );
            const { releaseItems: parsedReleaseItems } =
              roadmapItemParser.parse(id, releaseItemsForRoadmapItem);
            return {
              ...releaseItems,
              releaseItems: parsedReleaseItems.filter(
                (item: { isExternal: boolean }) => item.isExternal,
              ),
            };
          })
          .filter(hasAnyReleaseItem),
      };
    })
    .filter((entry) => entry.sprints.some(hasAnyReleaseItem));

  return roadmapItemsResult;
};
