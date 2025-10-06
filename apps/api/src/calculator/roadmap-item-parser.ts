import { map, uniq } from "lodash";
import { getJiraLink } from "./parse-common";
import { logger } from "@omega/utils";
import LabelResolver from "./resolve-labels";
import type { OmegaConfig } from "@omega/config";
import type {
  RoadmapItem,
  ReleaseItem,
  ValidationItem,
  TeamId,
} from "@omega/types";
import type { ParsedRoadmapItem } from "../types";
import type { ValidationRule } from "@omega/config";

export class RoadmapItemParser {
  private roadmapItems: Record<string, RoadmapItem>;
  private omegaConfig: OmegaConfig;
  private validationDictionary: any;

  constructor(
    roadmapItems: Record<string, RoadmapItem>,
    omegaConfig: OmegaConfig,
  ) {
    this.roadmapItems = roadmapItems;
    this.omegaConfig = omegaConfig;
    this.validationDictionary = omegaConfig.getValidationDictionary();
  }

  private _convertValidationRulesToItems(
    validationRules: ValidationRule[],
  ): ValidationItem[] {
    return validationRules.map((rule, index) => ({
      id: `validation-${index}`,
      name: rule.label,
      status: "error",
      description: rule.reference,
    }));
  }

  parse(
    projectId: string,
    releaseItems: ReleaseItem[] = [],
  ): ParsedRoadmapItem {
    const allTeamIds: string[] = uniq(map(releaseItems, "teams").flat());
    const owningTeam: TeamId = allTeamIds[0] || "unknown";
    const url = getJiraLink(projectId, this.omegaConfig);

    if (!this.roadmapItems.hasOwnProperty(projectId)) {
      const ticketIds = releaseItems.map((releaseItem) => releaseItem.ticketId);
      logger.calculator.info("not-found-project", {
        project_id: projectId,
        ticket_ids: ticketIds,
      });
      return {
        id: projectId,
        initiativeId: null,
        name: "",
        theme: {},
        area: {},
        isExternal: false,
        releaseItems,
        owningTeam,
        url,
        validations: [],
      };
    }

    const project = this.roadmapItems[projectId];

    if (!project) {
      const ticketIds = releaseItems.map((releaseItem) => releaseItem.ticketId);
      logger.calculator.info("not-found-project", {
        project_id: projectId,
        ticket_ids: ticketIds,
      });
      return {
        id: projectId,
        initiativeId: null,
        name: "",
        theme: {},
        area: {},
        isExternal: false,
        releaseItems,
        owningTeam,
        url,
        validations: [],
      };
    }

    const name = this._parseProjectName(project.summary || "");
    const area = LabelResolver.collectArea(project, this.omegaConfig);
    const theme = LabelResolver.collectTheme(project, this.omegaConfig);
    const initiative = LabelResolver.collectInitiative(
      project,
      this.omegaConfig,
    );
    const hasNoPreReleaseAllowedLabel =
      this._hasNoPreReleaseAllowedLabel(project);

    const res: ParsedRoadmapItem = {
      id: projectId,
      initiativeId: initiative.id,
      name,
      theme: { name: theme.value },
      area: { name: area.value },
      isExternal: false,
      releaseItems: this._updateReleaseItemsExternalState(
        projectId,
        false,
        hasNoPreReleaseAllowedLabel,
        releaseItems,
      ),
      owningTeam,
      url: getJiraLink(projectId, this.omegaConfig),
      validations: this._convertValidationRulesToItems(
        [area.validations, theme.validations, initiative.validations].flat(),
      ),
    };

    return res;
  }

  private _updateReleaseItemsExternalState(
    projectId: string,
    isRoadmapItemExternal: boolean,
    hasNoPreReleaseAllowedLabel: boolean,
    releaseItems: ReleaseItem[],
  ): ReleaseItem[] {
    return releaseItems.map((item) => {
      // Handle cases where item doesn't have expected properties (e.g., from fake data)
      const stage = item.stage || "unknown";
      const ticketId = item.ticketId || "unknown";
      const isExternal = item.isExternal || false;
      const validations = Array.isArray(item.validations)
        ? item.validations
        : [];

      const hasExternalStage = this.omegaConfig.isExternalStage(stage);
      const isFinalReleaseStage = this.omegaConfig.isFinalReleaseStage(stage);
      const hasStageViolation =
        hasExternalStage && hasNoPreReleaseAllowedLabel && !isFinalReleaseStage;
      const newIsExternal =
        hasExternalStage &&
        (isRoadmapItemExternal || hasNoPreReleaseAllowedLabel);

      if (newIsExternal !== isExternal) {
        logger.calculator.info("release-item-external-changed", {
          id: ticketId,
          stage: stage,
          old_definition: isExternal,
          new_definition: newIsExternal,
          roadmap_item_id: projectId,
        });
      }
      const validationErrors = hasStageViolation
        ? [
            this.validationDictionary.releaseItem
              .tooLowStageWithoutProperRoadmapItem,
          ]
        : [];
      if (hasStageViolation) {
        logger.calculator.info("pre-release-violation-found", {
          id: ticketId,
          stage: stage,
          roadmap_item_id: projectId,
        });
      }
      return {
        ...item,
        validations: [
          ...validations,
          ...this._convertValidationRulesToItems(validationErrors),
        ],
        isExternal: newIsExternal,
      };
    });
  }

  private _parseProjectName(summary: string): string {
    const endOfPrefix = !summary.startsWith("[") ? 0 : summary.indexOf("]") + 1;
    const beginningOfSuffix = summary.lastIndexOf("[");
    const endOfProjectName =
      beginningOfSuffix > 0 ? beginningOfSuffix : undefined;

    const projectName = summary.substring(endOfPrefix, endOfProjectName).trim();
    return projectName;
  }

  private _hasNoPreReleaseAllowedLabel(project: RoadmapItem): boolean {
    const noPreReleaseAllowedLabel =
      this.omegaConfig.getNoPrereleaseAllowedLabel();
    return project.labels?.includes(noPreReleaseAllowedLabel) || false;
  }
}
