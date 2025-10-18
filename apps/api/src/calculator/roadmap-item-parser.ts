import _ from "lodash";
import { getJiraLink } from "./parse-common";
import { logger } from "@omega/utils";
import LabelResolver from "./resolve-labels";
import { createValidationItem } from "./validation-helper";
import type { OmegaConfig } from "@omega/config";
import type {
  RoadmapItem,
  ReleaseItem,
  ValidationItem,
  TeamId,
} from "@omega/types";
import type { ParsedRoadmapItem } from "../types";
import {
  getDefaultTeamId,
  getDefaultStage,
  getDefaultTicketId,
} from "../constants/default-values";

export class RoadmapItemParser {
  private roadmapItems: Record<string, RoadmapItem>;
  private omegaConfig: OmegaConfig;

  constructor(
    roadmapItems: Record<string, RoadmapItem>,
    omegaConfig: OmegaConfig,
  ) {
    this.roadmapItems = roadmapItems;
    this.omegaConfig = omegaConfig;
  }

  parse(
    projectId: string,
    releaseItems: ReleaseItem[] = [],
  ): ParsedRoadmapItem {
    const allTeamIds: string[] = _.uniq(_.map(releaseItems, "teams").flat());
    const owningTeam: TeamId = getDefaultTeamId(allTeamIds[0]);
    const url = getJiraLink(projectId, this.omegaConfig);

    if (!Object.hasOwn(this.roadmapItems, projectId)) {
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
      validations: this._collectValidations(projectId, project, [
        area,
        theme,
        initiative,
      ]),
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
      const stage = getDefaultStage(item.stage);
      const ticketId = getDefaultTicketId(item.ticketId);
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
            createValidationItem(
              ticketId,
              "tooLowStageWithoutProperRoadmapItem",
            ),
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
        validations: [...validations, ...validationErrors],
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

  private _collectValidations(
    projectId: string,
    project: RoadmapItem,
    labelResults: Array<{
      validationCodes: string[];
      validationParameter?: string;
      validationParameters?: string[];
    }>,
  ): ValidationItem[] {
    const validations: ValidationItem[] = [];

    // Collect validations from label resolution
    labelResults.forEach((result) => {
      result.validationCodes.forEach((code) => {
        if (result.validationParameter) {
          validations.push(createValidationItem(projectId, code, "error"));
        } else if (result.validationParameters) {
          result.validationParameters.forEach((_param) => {
            validations.push(createValidationItem(projectId, code, "error"));
          });
        } else {
          validations.push(createValidationItem(projectId, code));
        }
      });
    });

    // Add missing validation checks for roadmap items
    this._checkMissingExternalRoadmap(projectId, project, validations);
    this._checkInternalWithStagedReleaseItem(projectId, project, validations);
    this._checkMissingExternalRoadmapDescription(
      projectId,
      project,
      validations,
    );

    return validations;
  }

  private _checkMissingExternalRoadmap(
    projectId: string,
    project: RoadmapItem,
    validations: ValidationItem[],
  ): void {
    // Check if external roadmap field is missing
    // This would need to be implemented based on how external roadmap is determined
    // For now, we'll add a placeholder check
    if (project.isExternal === undefined) {
      validations.push(
        createValidationItem(projectId, "missingExternalRoadmap"),
      );
    }
  }

  private _checkInternalWithStagedReleaseItem(
    projectId: string,
    project: RoadmapItem,
    validations: ValidationItem[],
  ): void {
    // Check if internal roadmap has release items with external stages
    if (project.isExternal === false && project.releaseItems) {
      const hasExternalStages = project.releaseItems.some((item) => {
        const stage = getDefaultStage(item.stage);
        return this.omegaConfig.isExternalStage(stage);
      });

      if (hasExternalStages) {
        validations.push(
          createValidationItem(projectId, "iternalWithStagedReleaseItem"),
        );
      }
    }
  }

  private _checkMissingExternalRoadmapDescription(
    projectId: string,
    project: RoadmapItem,
    validations: ValidationItem[],
  ): void {
    // Check if external roadmap items have descriptions
    if (
      project.isExternal === true &&
      (!project.summary || project.summary.trim() === "")
    ) {
      validations.push(
        createValidationItem(projectId, "missingExternalRoadmapDescription"),
      );
    }
  }
}
