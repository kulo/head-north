import { resolveStatus } from './resolve-status.js';
import { getJiraLink, translateLabel, getLabelsWithPrefix, translateLabelWithoutFallback } from './parse-common.js';
import { logger } from '@omega-one/shared-utils';
import { resolveStage } from './resolve-stage.js';

class ReleaseItemParser {
  constructor(sprint, omegaConfig) {
    this.sprint = sprint;
    this.omegaConfig = omegaConfig;
    this.labelTranslations = omegaConfig.getLabelTranslations();
    this.releaseItemValidation = omegaConfig.getValidationDictionary().releaseItem;
  }

  parse(issue) {
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
        assignee.validations
      ].flat(),
      isPartOfReleaseNarrative: this._isPartOfReleaseNarrative(issue),
      isReleaseAtRisk: this._isReleaseAtRisk(issue)
    };
  }

  _collectEffort(issue) {
    const estimate = issue.fields.effort;
    if(!estimate && estimate !== 0) {
      return { value: 0, validations: [this.releaseItemValidation.missingEstimate] };
    }

    if(estimate % 0.5 !== 0) {
      return { value: estimate, validations: [this.releaseItemValidation.tooGranularEstimate] };
    }

    return { value: estimate, validations: [] };
  }

  _collectProjectId(issue) {
    if (!issue.fields.parent) {
      return { value: null, validations: [this.releaseItemValidation.noProjectId] };
    }

    return { value: issue.fields.parent.key, validations: [] };
  }

  _collectAreaIds(issue) {
    const areaIds = this._parseArea(issue.fields.labels)
    if (areaIds.length === 0) {
      return { value: [], validations: [this.releaseItemValidation.missingAreaLabel] };
    }

    return { value: areaIds, validations: [] }
  }

  _collectTeams(issue) {
    const teamLabels = getLabelsWithPrefix(issue.fields.labels, 'team');

    if(teamLabels.length === 0) {
      return { value: [], validations: [this.releaseItemValidation.missingTeamLabel] }
    }

    const teams = teamLabels.map((team) => {
        const translatedTeam = translateLabelWithoutFallback('team', team, this.omegaConfig);
      if(!translatedTeam) {
        return {
          value: team,
          validations: [this.releaseItemValidation.missingTeamTranslation(team)]
        };
      }
      return { value: translatedTeam, validations: [] };
    });

    return {
      value: teams.map(team => team.value),
      validations: teams.map(team => team.validations).flat()
    };
  }

  _collectStage(issue) {
    const stage = resolveStage(issue.fields.summary, this.omegaConfig);
    return { value: stage, validations: [] };
  }

  _collectAssignee(issue) {
    if(!issue.fields.assignee) {
      return {
        value: issue.fields.reporter,
        validations: [this.releaseItemValidation.missingAssignee]
      }
    }
    return { value: issue.fields.assignee, validations: [] };
  }

  _parseEpicName(originalName) {
    let stage = resolveStage(originalName, this.omegaConfig);
    if (!stage) { return originalName; }
    if (stage === 's3+') {
      stage = 's3\\+';
    }
    const stageRegex = new RegExp(`\\(${stage}\\)`, 'ig');
    return originalName.replace(stageRegex, '').trim();
  }

  _parseArea(labels) {
    return getLabelsWithPrefix(labels, 'area');
  }

  _parseTeams(labels) {
    return getLabelsWithPrefix(labels, 'team')
      .map(team => translateLabel('team', team, this.omegaConfig));
  }

  _getJiraLink(id) {
    return getJiraLink(id, this.omegaConfig);
  }

  _isExternalRoadmap(issue) {
    return this._isExternal(issue)
      && !issue.fields.summary.includes('(Internal)')
      && !issue.fields.summary.includes('(S0)');
  }

  _isExternal(issue) {
    return issue.fields.externalRoadmap === 'Yes';
  }

  _isPartOfReleaseNarrative(issue) {    
    return issue.fields.labels.includes('release:part-of-narrative');
  }

  _isReleaseAtRisk(issue) {
    return issue.fields.labels.includes( 'release:at-risk') 
      || issue.fields.labels.includes( 'at-risk');
  }
}

export { ReleaseItemParser };
