'use strict';

const { writeFileSync } = require('fs');
const parseJiraIssues = require('../server/calculator/parse-jira-issues');
const collectCycleOverviewData = require('../server/service/collect-cycle-overview-data');

(async () => {
  // const sprintId = '5421';
  // const { projects, issues, sprint } = await collectCycleOverviewData(sprintId);
  const { projects, issues, sprint } = await collectCycleOverviewData();
  const parsed = parseJiraIssues(issues, projects, sprint);
  writeFileSync('./parsed.json', JSON.stringify(parsed, null, 4));
})();
