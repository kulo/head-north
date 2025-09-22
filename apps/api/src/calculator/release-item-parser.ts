import { resolveStatus } from "./resolve-status";
import {
  getJiraLink,
  translateLabel,
  getLabelsWithPrefix,
  translateLabelWithoutFallback,
} from "./parse-common";
import { logger } from "@omega/utils";
import { resolveStage } from "./resolve-stage";
import type { OmegaConfig } from "@omega/config";
import type { JiraIssue, ParsedReleaseItem } from "@omega/types";

export class ReleaseItemParser {
  private sprint: any;
  private omegaConfig: OmegaConfig;
  private labelTranslations: any;
  private releaseItemValidation: any;

  constructor(sprint: any, omegaConfig: OmegaConfig) {
    this.sprint = sprint;
    this.omegaConfig = omegaConfig;
    this.labelTranslations = omegaConfig.getLabelTranslations();
    this.releaseItemValidation =
      omegaConfig.getValidationDictionary().releaseItem;
  }

  parse(issue: JiraIssue): ParsedReleaseItem {
    const projectId = this._collectProjectId(issue);
    const areaIds = this._collectAreaIds(issue);
    const teams = this._collectTeams(issue);
    const effort = this._collectEffort(issue);
    const stage = this._collectStage(issue);
    const assignee = this._collectAssignee(issue);

    return {
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
      isPartOfReleaseNarrative: this._isPartOfReleaseNarrative(issue),
      isReleaseAtRisk: this._isReleaseAtRisk(issue),
    };
  }

  private _collectEffort(issue: JiraIssue): {
    value: number;
    validations: any[];
  } {
    const estimate = issue.fields.effort;
    if (!estimate && estimate !== 0) {
      return {
        value: 0,
        validations: [this.releaseItemValidation.missingEstimate],
      };
    }

    if (estimate % 0.5 !== 0) {
      return {
        value: estimate,
        validations: [this.releaseItemValidation.tooGranularEstimate],
      };
    }

    return { value: estimate, validations: [] };
  }

  private _collectProjectId(issue: JiraIssue): {
    value: string | null;
    validations: any[];
  } {
    if (!issue.fields.parent) {
      return {
        value: null,
        validations: [this.releaseItemValidation.noProjectId],
      };
    }

    return { value: issue.fields.parent.key, validations: [] };
  }

  private _collectAreaIds(issue: JiraIssue): {
    value: string[];
    validations: any[];
  } {
    const areaIds = this._parseArea(issue.fields.labels);
    if (areaIds.length === 0) {
      return {
        value: [],
        validations: [this.releaseItemValidation.missingAreaLabel],
      };
    }

    return { value: areaIds, validations: [] };
  }

  private _collectTeams(issue: JiraIssue): {
    value: string[];
    validations: any[];
  } {
    const teamLabels = getLabelsWithPrefix(issue.fields.labels, "team");

    if (teamLabels.length === 0) {
      return {
        value: [],
        validations: [this.releaseItemValidation.missingTeamLabel],
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
            this.releaseItemValidation.missingTeamTranslation(team),
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
    validations: any[];
  } {
    const stage = resolveStage(issue.fields.summary, this.omegaConfig);
    return { value: stage, validations: [] };
  }

  private _collectAssignee(issue: JiraIssue): {
    value: any;
    validations: any[];
  } {
    if (!issue.fields.assignee) {
      return {
        value: issue.fields.reporter,
        validations: [this.releaseItemValidation.missingAssignee],
      };
    }
    return { value: issue.fields.assignee, validations: [] };
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

  private _isExternalRoadmap(issue: JiraIssue): boolean {
    return (
      this._isExternal(issue) &&
      !issue.fields.summary.includes("(Internal)") &&
      !issue.fields.summary.includes("(S0)")
    );
  }

  private _isExternal(issue: JiraIssue): boolean {
    return issue.fields.externalRoadmap === "Yes";
  }

  private _isPartOfReleaseNarrative(issue: JiraIssue): boolean {
    return issue.fields.labels.includes("release:part-of-narrative");
  }

  private _isReleaseAtRisk(issue: JiraIssue): boolean {
    return (
      issue.fields.labels.includes("release:at-risk") ||
      issue.fields.labels.includes("at-risk")
    );
  }
}
