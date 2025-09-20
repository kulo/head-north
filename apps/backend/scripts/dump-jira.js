'use strict';

const { writeFileSync } = require('fs');
const parseJiraIssues = require('../server/calculator/parse-jira-issues');
const collectCycleData = require('../server/service/collect-cycle-data');

(async () => {
  // const sprintId = '5421';
  // const { projects, issues, sprint } = await collectCycleOverviewData(sprintId);
  const { roadmapItems, issues, cycles } = await collectCycleData();
  const parsed = parseJiraIssues(issues, roadmapItems, cycles[0]);
  writeFileSync('./parsed.json', JSON.stringify(parsed, null, 4));
})();
