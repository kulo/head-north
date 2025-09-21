import pkg from 'lodash';
const { groupBy, omit, get } = pkg;
import { ReleaseItemParser } from './release-item-parser.js';
import { RoadmapItemParser } from './roadmap-item-parser.js';
import { translateLabel } from './parse-common.js';
import type { OmegaConfig } from '@omega/shared-config';

class IssueParser {
  private issues: any[];
  private roadmapItems: any;
  private omegaConfig: OmegaConfig;
  private _releaseItemParser: ReleaseItemParser;
  private _roadmapItemParser: RoadmapItemParser;

  constructor(issues: any[], roadmapItems: any, sprint: any, omegaConfig: OmegaConfig) {
    this.issues = issues;
    this.roadmapItems = roadmapItems;
    this.omegaConfig = omegaConfig;
    this._releaseItemParser = new ReleaseItemParser(sprint, omegaConfig);
    this._roadmapItemParser = new RoadmapItemParser(roadmapItems, omegaConfig);
  }

  parse() {
    const releaseItems = this.issues.map(issue => this._releaseItemParser.parse(issue));

    const roadmapItems = this._groupByRoadmapItems(releaseItems);
    return this._groupByInitiatives(roadmapItems);
  }

  private _groupByRoadmapItems(parsed: any[]) {
    const grouped = groupBy(parsed, (releaseItem) => releaseItem.projectId);

    return Object.values(grouped).map((roadmapItemGroup) => {
      const projectId = roadmapItemGroup[0].projectId;
      const releaseItems = roadmapItemGroup.map(releaseItem => omit(releaseItem, ['projectId'])) as any[];
      return this._roadmapItemParser.parse(projectId, releaseItems);
    });
  }

  private _groupByInitiatives(roadmapItems: any[]) {
    const virtualId = 'virtual';
    const virtualLabel = translateLabel('theme', virtualId, this.omegaConfig);
    const virtuals = roadmapItems.filter(roadmapItem => roadmapItem.theme === virtualLabel);
    const nonVirtuals = roadmapItems.filter(roadmapItem => roadmapItem.theme !== virtualLabel);
    
    // Group by initiative instead of theme + initiative
    const grouped = groupBy(nonVirtuals, roadmapItem => roadmapItem.initiativeId);

    const initiatives = Object.entries(grouped).map(([initiativeId, value]) => {
      return {
        initiative: get(value, '0.initiative'),
        initiativeId: initiativeId,
        roadmapItems: value.map(roadmapItem => omit(roadmapItem, ['theme', 'initiative', 'initiativeId']))
      };
    });

    // Add virtual items as a separate initiative
    if (virtuals.length > 0) {
      initiatives.push({
        initiative: virtualLabel,
        initiativeId: virtualId,
        roadmapItems: virtuals.map(roadmapItem => omit(roadmapItem, ['theme', 'initiative', 'initiativeId']))
      });
    }

    return initiatives;
  }
}

export default (issues: any[], roadmapItems: any, sprint: any, omegaConfig: OmegaConfig) => {
  return (new IssueParser(issues, roadmapItems, sprint, omegaConfig)).parse();
}
