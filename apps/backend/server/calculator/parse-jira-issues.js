import pkg from 'lodash';
const { groupBy, omit, get } = pkg;
import { ReleaseItemParser } from './release-item-parser.js';
import { RoadmapItemParser } from './roadmap-item-parser.js';
import { translateLabel } from './parse-common.js';

class IssueParser {
  constructor(issues, roadmapItems, sprint, omegaConfig) {
    this.issues = issues;
    this.roadmapItems = roadmapItems;
    this.omegaConfig = omegaConfig;
    this._releaseItemParser = new ReleaseItemParser(sprint, omegaConfig);
    this._roadmapItemParser = new RoadmapItemParser(roadmapItems, omegaConfig);
  }

  parse() {
    const releaseItems = this.issues.map(issue => this._releaseItemParser.parse(issue));

    const roadmapItems = this._groupByRoadmapItems(releaseItems);
    return this._groupByObjectives(roadmapItems);
  }

  _groupByRoadmapItems(parsed) {
    const grouped = groupBy(parsed, (releaseItem) => releaseItem.projectId);

    return Object.values(grouped).map((roadmapItemGroup) => {
      const projectId = roadmapItemGroup[0].projectId;
      const releaseItems = roadmapItemGroup.map(releaseItem => omit(releaseItem, ['projectId']));
      return this._roadmapItemParser.parse(projectId, releaseItems);
    });
  }

  _groupByObjectives(roadmapItems) {
    const virtualId = 'virtual';
    const virtualLabel = translateLabel('theme', virtualId, this.omegaConfig);
    const virtuals = roadmapItems.filter(roadmapItem => roadmapItem.theme === virtualLabel);
    const nonVirtuals = roadmapItems.filter(roadmapItem => roadmapItem.theme !== virtualLabel);
    const grouped = groupBy(nonVirtuals, roadmapItem => {
      return roadmapItem.theme ? `${roadmapItem.theme} - ${roadmapItem.initiative}` : roadmapItem.initiative;
    });

    const nonVirtualObjectives = Object.entries(grouped).map(([key, value]) => {
      return {
        objective: key,
        theme: get(value, '0.theme'),
        initiative: get(value, '0.initiative'),
        initiativeId: get(value, '0.initiativeId'),
        roadmapItems: value.map(roadmapItem => omit(roadmapItem, ['theme', 'initiative', 'initiativeId']))
      };
    });

    return [
      ...nonVirtualObjectives,
      {
        objective: virtualLabel,
        initiative: virtualLabel,
        initiativeId: virtualId,
        roadmapItems: virtuals.map(roadmapItem => omit(roadmapItem, ['theme', 'initiative', 'initiativeId']))
      }
    ];
  }
}

export default (issues, roadmapItems, sprint, omegaConfig) => {
  return (new IssueParser(issues, roadmapItems, sprint, omegaConfig)).parse();
}
