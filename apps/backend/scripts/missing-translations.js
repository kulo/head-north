const collectCycleData = require('../server/service/collect-cycle-data');
const { jiraLabelTranslations: labelTranslations } = require('../server/config');
const { uniq } = require('lodash');

const getLabels = (labels, prefix) => {
  const prefixWithColon = `${prefix}:`;
  return labels
    .filter(label => label.startsWith(prefixWithColon))
    .map(label => label.replace(prefixWithColon, ''));
};

(async () => {
  const { roadmapItems, issues } = await collectCycleData();

  const isssuesWithLabels = issues.filter(issue => {
    return issue.fields.labels.length !== 0;
  });

  console.log('Untranslated team labels: ');
  const teamLabels = isssuesWithLabels.map(issue => {
    return getLabels(issue.fields.labels, 'team');
  });
  uniq(teamLabels.flat()).filter(label => {
    return !Object.keys(labelTranslations.team).includes(label);
  }).forEach((label) => console.log(label));

  console.log('Untranslated area labels:')
  const areaLabels = isssuesWithLabels.map(issue => {
    return getLabels(issue.fields.labels, 'area');
  });
  uniq(areaLabels.flat()).filter(label => {
    return !Object.keys(labelTranslations.area).includes(label);
  }).forEach((label) => console.log(label));

  const usedProjects = Object.entries(roadmapItems).filter(([projectId, value]) => {
    return issues.some(issue => issue.fields.parent && issue.fields.parent.key === projectId);
  });

  console.log('Untranslated theme labels:')
  const themeLabels = usedProjects.map(([projectId, value]) => {
    return getLabels(value.labels, 'theme');
  });

  uniq(themeLabels.flat()).filter(label => {
    return !Object.keys(labelTranslations.theme).includes(label);
  }).forEach((label) => console.log(label));

  console.log('Untranslated initiative labels:')
  const initiativeLabels = usedProjects.map(([projectId, value]) => {
    return getLabels(value.labels, 'initiative');
  });

  uniq(initiativeLabels.flat()).filter(label => {
    return !Object.keys(labelTranslations.initiative).includes(label);
  }).forEach((label) => console.log(label));
})();
