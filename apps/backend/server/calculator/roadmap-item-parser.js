import pkg from 'lodash';
const { map, reduce, uniq, property } = pkg;
import { getJiraLink, getLabelsWithPrefix, translateLabelWithoutFallback } from './parse-common.js';
import { logger } from '@omega-one/shared-utils';
import LabelResolver from './resolve-labels.js';

class RoadmapItemParser {
  constructor(roadmapItems, omegaConfig) {
    this.roadmapItems = roadmapItems;
    this.omegaConfig = omegaConfig;
    this.validationDictionary = omegaConfig.getValidationDictionary();
  }

  parse(projectId, releaseItems = []) {
    const crew = uniq(map(releaseItems, 'teams').flat()).join(', ');
    const url = getJiraLink(projectId, this.omegaConfig);

    if (!this.roadmapItems.hasOwnProperty(projectId)) {
      const ticketIds = releaseItems.map(releaseItem => releaseItem.ticketId);
      logger.calculator.info('not-found-project', { project_id: projectId, ticket_ids: ticketIds });
      return { releaseItems, crew, url, validations: [] };
    }

    const project = this.roadmapItems[projectId];

    const name = this._parseProjectName(project.summary);
    const area = LabelResolver.collectArea(project, this.omegaConfig);
    const theme = LabelResolver.collectTheme(project, this.omegaConfig);
    const initiative = LabelResolver.collectInitiative(project, this.omegaConfig);
    const release = this._collectReleaseInfo(releaseItems);
    const external = this._collectExternal(project, releaseItems);
    const hasNoPreReleaseAllowedLabel = this._hasNoPreReleaseAllowedLabel(project);

    const res = {
      initiative: initiative.value,
      initiativeId: project.initiativeId || initiative.id,
      name,
      theme: theme.value,
      projectId,
      area: area.value,
      isExternal: external.value,
      releaseItems: this._updateReleaseItemsExternalState(projectId, external.value, hasNoPreReleaseAllowedLabel, releaseItems),
      crew: uniq(map(releaseItems, 'teams').flat()).join(', '),
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
      
      const hasExternalStage = this.omegaConfig.isExternalStage(stage);
      const isFinalReleaseStage = this.omegaConfig.isFinalReleaseStage(stage);
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

  _collectExternal(project, releaseItems) {
    const value = this._isExternal(project);
    const validations =  [
      ...this._validateExternal(project),
      ...this._validateExternalRoadmapDescription(project),
      ...this._validateExternalReleaseStages(project, releaseItems)
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

  _collectReleaseInfo(releaseItems) {
    const OR = (a,b) => a || b;

    const releaseItemsReleaseNarratives = map( releaseItems, property('isPartOfReleaseNarrative') );
    const isProjectPartOfNarrative = reduce( releaseItemsReleaseNarratives, OR );

    const releaseItemsReleaseRisks = map( releaseItems, property('isReleaseAtRisk') );
    const isProjectAtRisk = reduce( releaseItemsReleaseRisks, OR );

    return {
        isPartOfNarrative: isProjectPartOfNarrative,
        isAtRisk: isProjectAtRisk
    }
  }

  _isExternal(project) {
    return project.externalRoadmap === 'Yes';
  }

  _hasNoPreReleaseAllowedLabel(project) {
    const noPreReleaseAllowedLabel = this.omegaConfig.getNoPrereleaseAllowedLabel();
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

  _validateExternalReleaseStages(project, releaseItems) {
    const externalStages = this.omegaConfig.getStageCategories().externalStages;
    const hasReleaseItemWithStage = releaseItems.some(releaseItem => externalStages.includes(releaseItem.stage));
    if(!this._isExternal(project) && hasReleaseItemWithStage) {
      return [this.validationDictionary.roadmapItem.iternalWithStagedReleaseItem];
    }

    return [];
  }
}

export { RoadmapItemParser };
