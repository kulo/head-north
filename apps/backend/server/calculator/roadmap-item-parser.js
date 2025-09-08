import pkg from 'lodash';
const { map, reduce, uniq, property } = pkg;
import { getJiraLink, getLabelsWithPrefix, translateLabelWithoutFallback } from './parse-common.js';
import { logger } from '@omega-one/shared-utils';
import { externalStages, finalReleaseStage } from './release-item-parser.js';
import LabelResolver from './resolve-labels.js';
const noPreReleaseAllowedLabel = 'omega:no-pre-release-allowed';

class RoadmapItemParser {
  constructor(projects, omegaConfig) {
    this.projects = projects;
    this.omegaConfig = omegaConfig;
    this.validationDictionary = omegaConfig.getValidationDictionary();
  }

  parse(projectId, epics = []) {
    const crew = uniq(map(epics, 'teams').flat()).join(', ');
    const url = getJiraLink(projectId, this.omegaConfig);

    if (!this.projects.hasOwnProperty(projectId)) {
      const ticketIds = epics.map(epic => epic.ticketId);
      logger.calculator.info('not-found-project', { project_id: projectId, ticket_ids: ticketIds });
      return { epics, crew, url, validations: [] };
    }

    const project = this.projects[projectId];

    const name = this._parseProjectName(project.summary);
    const area = LabelResolver.collectArea(project, this.omegaConfig);
    const theme = LabelResolver.collectTheme(project, this.omegaConfig);
    const initiative = LabelResolver.collectInitiative(project, this.omegaConfig);
    const release = this._collectReleaseInfo(epics);
    const external = this._collectExternal(project, epics);
    const hasNoPreReleaseAllowedLabel = this._hasNoPreReleaseAllowedLabel(project);

    const res = {
      initiative: initiative.value,
      initiativeId: project.initiativeId || initiative.id,
      name,
      theme: theme.value,
      projectId,
      area: area.value,
      isExternal: external.value,
      epics: this._updateReleaseItemsExternalState(projectId, external.value, hasNoPreReleaseAllowedLabel, epics),
      crew: uniq(map(epics, 'teams').flat()).join(', '),
      url: getJiraLink(projectId, this.omegaConfig),
      validations: [
        area.validations,
        theme.validations,
        initiative.validations,
        external.validations
      ].flat(),
      isPartOfReleaseNarrative: release.isPartOfNarrative,
      isReleaseAtRisk: release.isAtRisk
    };

    return res;
  }

  _updateReleaseItemsExternalState(projectId, isRoadmapItemExternal, hasNoPreReleaseAllowedLabel, releaseItems) {
    return releaseItems.map((item) => {
      // Handle cases where item doesn't have expected properties (e.g., from fake data)
      const stage = item.stage || 'unknown';
      const ticketId = item.ticketId || item.id || 'unknown';
      const isExternal = item.isExternal || false;
      const validations = Array.isArray(item.validations) ? item.validations : [];
      
      const hasExternalStage = externalStages.includes(stage);
      const isFinalReleaseStage = finalReleaseStage.includes(stage);
      const hasStageViolation = hasExternalStage && hasNoPreReleaseAllowedLabel && !isFinalReleaseStage;
      const newIsExternal = hasExternalStage && (isRoadmapItemExternal || hasNoPreReleaseAllowedLabel);
      
      if (newIsExternal !== isExternal) {
        logger.calculator.info('release-item-external-changed', {
          id: ticketId,
          stage: stage,
          old_definition: isExternal,
          new_definition: newIsExternal,
          roadmap_item_id: projectId
        });
      }
      const validationErrors = hasStageViolation 
        ? [this.validationDictionary.releaseItem.tooLowStageWithoutProperRoadmapItem] 
        : [];
      if(hasStageViolation) {
        logger.calculator.info('pre-release-violation-found', {
          id: ticketId,
          stage: stage,
          roadmap_item_id: projectId
        })
      }
      return {
        ...item,
        validations: [...validations, ...validationErrors],
        isExternal: newIsExternal
      };
    });
  }

  _collectExternal(project, epics) {
    const value = this._isExternal(project);
    const validations =  [
      ...this._validateExternal(project),
      ...this._validateExternalRoadmapDescription(project),
      ...this._validateExternalReleaseStages(project, epics)
    ];
    return { value, validations };
  }

  _parseProjectName(summary) {
    const endOfPrefix = !summary.startsWith('[') ? 0 : summary.indexOf(']') + 1;
    const beginningOfSuffix = summary.lastIndexOf('[');
    const endOfProjectName = beginningOfSuffix > 0 ? beginningOfSuffix : undefined;

    const projectName = summary.substring(endOfPrefix, endOfProjectName).trim();
    return projectName;
  }

  _collectReleaseInfo(epics) {
    const OR = (a,b) => a || b;

    const epicsReleaseNarratives = map( epics, property('isPartOfReleaseNarrative') );
    const isProjectPartOfNarrative = reduce( epicsReleaseNarratives, OR );

    const epicsReleaseRisks = map( epics, property('isReleaseAtRisk') );
    const isProjectAtRisk = reduce( epicsReleaseRisks, OR );

    return {
        isPartOfNarrative: isProjectPartOfNarrative,
        isAtRisk: isProjectAtRisk
    }
  }

  _isExternal(project) {
    return project.externalRoadmap === 'Yes';
  }

  _hasNoPreReleaseAllowedLabel(project) {
    return project.labels.includes(noPreReleaseAllowedLabel);
  }

  _validateExternalRoadmapDescription(project) {
    const hasExternalRoadmapDescription = project.externalRoadmapDescription !== null;
    if(this._isExternal(project) && !hasExternalRoadmapDescription) {
      return [this.validationDictionary.roadmapItem.missingExternalRoadmapDescription];
    }

    return [];
  }

  _validateExternal(project) {
    if( !project.externalRoadmap ) {
      return [this.validationDictionary.roadmapItem.missingExternalRoadmap]; 
    }
    else {
      return [];
    }
  }

  _validateExternalReleaseStages(project, epics) {
    const hasReleaseItemWithStage = epics.some(epic => externalStages.includes(epic.stage));
    if(!this._isExternal(project) && hasReleaseItemWithStage) {
      return [this.validationDictionary.roadmapItem.iternalWithStagedReleaseItem];
    }

    return [];
  }
}

export { RoadmapItemParser };
