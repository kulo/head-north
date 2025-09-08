'use strict';

const { writeFileSync } = require('fs');
const parseJiraIssues = require('../server/calculator/parse-jira-issues');
const collectJiraData = require('../server/service/collect-jira-data');

(async () => {
  // const sprintId = '5421';
  // const { projects, issues, sprint } = await collectJiraData(sprintId);
  const { projects, issues, sprint } = await collectJiraData();
  const parsed = parseJiraIssues(issues, projects, sprint);
  writeFileSync('./parsed.json', JSON.stringify(parsed, null, 4));
})();
