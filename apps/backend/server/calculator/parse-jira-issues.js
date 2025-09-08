import pkg from 'lodash';
const { groupBy, omit, get } = pkg;
import { ReleaseItemParser } from './release-item-parser.js';
import { RoadmapItemParser } from './roadmap-item-parser.js';
import { translateLabel } from './parse-common.js';

class IssueParser {
  constructor(issues, projects, sprint, omegaConfig) {
    this.issues = issues;
    this.projects = projects;
    this.omegaConfig = omegaConfig;
    this._releaseItemParser = new ReleaseItemParser(sprint, omegaConfig);
    this._roadmapItemParser = new RoadmapItemParser(projects, omegaConfig);
  }

  parse() {
    const epics = this.issues.map(issue => this._releaseItemParser.parse(issue));

    const projects = this._groupByProjects(epics);
    return this._groupByObjectives(projects);
  }

  _groupByProjects(parsed) {
    const grouped = groupBy(parsed, (epic) => epic.projectId);

    return Object.values(grouped).map((project) => {
      const projectId = project[0].projectId;
      const epics = project.map(epic => omit(epic, ['projectId']));
      return this._roadmapItemParser.parse(projectId, epics);
    });
  }

  _groupByObjectives(projects) {
    const virtualId = 'virtual';
    const virtualLabel = translateLabel('theme', virtualId, this.omegaConfig);
    const virtuals = projects.filter(project => project.theme === virtualLabel);
    const nonVirtuals = projects.filter(project => project.theme !== virtualLabel);
    const grouped = groupBy(nonVirtuals, project => {
      return project.theme ? `${project.theme} - ${project.initiative}` : project.initiative;
    });

    const nonVirtualObjectives = Object.entries(grouped).map(([key, value]) => {
      return {
        objective: key,
        theme: get(value, '0.theme'),
        initiative: get(value, '0.initiative'),
        initiativeId: get(value, '0.initiativeId'),
        projects: value.map(project => omit(project, ['theme', 'initiative', 'initiativeId']))
      };
    });

    return [
      ...nonVirtualObjectives,
      {
        objective: virtualLabel,
        initiative: virtualLabel,
        initiativeId: virtualId,
        projects: virtuals.map(project => omit(project, ['theme', 'initiative', 'initiativeId']))
      }
    ];
  }
}

export default (issues, projects, sprint, omegaConfig) => {
  return (new IssueParser(issues, projects, sprint, omegaConfig)).parse();
}
