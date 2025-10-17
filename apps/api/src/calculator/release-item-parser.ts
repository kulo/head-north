import { resolveStatus } from "./resolve-status";
import {
  getJiraLink,
  translateLabel,
  getLabelsWithPrefix,
  translateLabelWithoutFallback,
} from "./parse-common";
import { resolveStage } from "./resolve-stage";
import type { OmegaConfig, ValidationRule } from "@omega/config";
import type { ValidationItem } from "@omega/types";
import type { JiraIssue, JiraSprint } from "../types";
import type { ParsedReleaseItem } from "../types";

export class ReleaseItemParser {
  private sprint: JiraSprint;
  private omegaConfig: OmegaConfig;
  private labelTranslations: Record<string, Record<string, string>>;
  private releaseItemValidation: Record<
    string,
    ValidationRule | ((team: string) => ValidationRule)
  >;

  constructor(sprint: JiraSprint, omegaConfig: OmegaConfig) {
    this.sprint = sprint;
    this.omegaConfig = omegaConfig;
    this.labelTranslations = omegaConfig.getLabelTranslations();
    this.releaseItemValidation =
      omegaConfig.getValidationDictionary().releaseItem;
  }

  private convertToValidationItem(rule: ValidationRule): ValidationItem {
    return {
      id: rule.reference,
      name: rule.label,
      status: "error",
      description: rule.reference,
    };
  }

  parse(issue: JiraIssue): ParsedReleaseItem {
    const projectId = this._collectProjectId(issue);
    const areaIds = this._collectAreaIds(issue);
    const teams = this._collectTeams(issue);
    const effort = this._collectEffort(issue);
    const stage = this._collectStage(issue);
    const assignee = this._collectAssignee(issue);

    return {
      id: issue.key,
      ticketId: issue.key,
      effort: effort.value,
      projectId: projectId.value,
      name: this._parseEpicName(issue.fields.summary),
      areaIds: areaIds.value,
      teams: teams.value,
      status: resolveStatus(issue.fields, this.sprint, this.omegaConfig),
      url: getJiraLink(issue.key, this.omegaConfig),
      isExternal: this._isExternalRoadmap(issue),
      stage: stage.value,
      assignee: assignee.value,
      validations: [
        projectId.validations,
        areaIds.validations,
        teams.validations,
        effort.validations,
        stage.validations,
        assignee.validations,
      ].flat(),
    };
  }

  private _collectEffort(issue: JiraIssue): {
    value: number;
    validations: ValidationItem[];
  } {
    const estimate = issue.fields.effort;
    if (!estimate && estimate !== 0) {
      return {
        value: 0,
        validations: [
          this.convertToValidationItem(
            this.releaseItemValidation.missingEstimate as ValidationRule,
          ),
        ],
      };
    }

    if (estimate % 0.5 !== 0) {
      return {
        value: estimate,
        validations: [
          this.convertToValidationItem(
            this.releaseItemValidation.tooGranularEstimate as ValidationRule,
          ),
        ],
      };
    }

    return { value: estimate, validations: [] };
  }

  private _collectProjectId(issue: JiraIssue): {
    value: string | null;
    validations: ValidationItem[];
  } {
    if (!issue.fields.parent) {
      return {
        value: null,
        validations: [
          this.convertToValidationItem(
            this.releaseItemValidation.noProjectId as ValidationRule,
          ),
        ],
      };
    }

    return { value: issue.fields.parent.key, validations: [] };
  }

  private _collectAreaIds(issue: JiraIssue): {
    value: string[];
    validations: ValidationItem[];
  } {
    const areaIds = this._parseArea(issue.fields.labels);
    if (areaIds.length === 0) {
      return {
        value: [],
        validations: [
          this.convertToValidationItem(
            this.releaseItemValidation.missingAreaLabel as ValidationRule,
          ),
        ],
      };
    }

    return { value: areaIds, validations: [] };
  }

  private _collectTeams(issue: JiraIssue): {
    value: string[];
    validations: ValidationItem[];
  } {
    const teamLabels = getLabelsWithPrefix(issue.fields.labels, "team");

    if (teamLabels.length === 0) {
      return {
        value: [],
        validations: [
          this.convertToValidationItem(
            this.releaseItemValidation.missingTeamLabel as ValidationRule,
          ),
        ],
      };
    }

    const teams = teamLabels.map((team) => {
      const translatedTeam = translateLabelWithoutFallback(
        "team",
        team,
        this.omegaConfig,
      );
      if (!translatedTeam) {
        return {
          value: team,
          validations: [
            this.convertToValidationItem(
              (
                this.releaseItemValidation.missingTeamTranslation as (
                  team: string,
                ) => ValidationRule
              )(team),
            ),
          ],
        };
      }
      return { value: translatedTeam, validations: [] };
    });

    return {
      value: teams.map((team) => team.value),
      validations: teams.map((team) => team.validations).flat(),
    };
  }

  private _collectStage(issue: JiraIssue): {
    value: string;
    validations: ValidationItem[];
  } {
    const stage = resolveStage(issue.fields.summary, this.omegaConfig);
    return { value: stage, validations: [] };
  }

  private _collectAssignee(issue: JiraIssue): {
    value: Record<string, unknown>;
    validations: ValidationItem[];
  } {
    if (!issue.fields.assignee) {
      return {
        value: issue.fields.reporter as unknown as Record<string, unknown>,
        validations: [
          this.convertToValidationItem(
            this.releaseItemValidation.missingAssignee as ValidationRule,
          ),
        ],
      };
    }
    return {
      value: issue.fields.assignee as unknown as Record<string, unknown>,
      validations: [],
    };
  }

  private _parseEpicName(originalName: string): string {
    let stage = resolveStage(originalName, this.omegaConfig);
    if (!stage) {
      return originalName;
    }
    if (stage === "s3+") {
      stage = "s3\\+";
    }
    const stageRegex = new RegExp(`\\(${stage}\\)`, "ig");
    return originalName.replace(stageRegex, "").trim();
  }

  private _parseArea(labels: string[]): string[] {
    return getLabelsWithPrefix(labels, "area");
  }

  private _parseTeams(labels: string[]): string[] {
    return getLabelsWithPrefix(labels, "team").map((team) =>
      translateLabel("team", team, this.omegaConfig),
    );
  }

  private _getJiraLink(id: string): string {
    return getJiraLink(id, this.omegaConfig);
  }

  private _isExternalRoadmap(_issue: JiraIssue): boolean {
    return false;
  }
}
