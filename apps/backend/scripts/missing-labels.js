'use strict';
const collectJiraData = require('../server/service/collect-jira-data');
const parseJiraIssues = require('../server/calculator/parse-jira-issues');
const { jiraHost } = require('../server/config');

const logTicketId = (ticketId) => {
  const baseUrl = jiraHost.replace('/rest', '');
  return console.log(`${baseUrl}/browse/${ticketId}`);
};

(async () => {
  const { projects, issues } = await collectJiraData();

  console.log('Release Item without labels: ');
  const issuesWithLabels = issues.filter(issue => {
    if(issue.fields.labels.length === 0) {
      logTicketId(issue.key);
      return false;
    }

    return true;
  });

  console.log('Release Item without team label: ');
  const issuesWithoutTeam = issuesWithLabels.filter(issue => {
    return !issue.fields.labels.some(label => label.includes('team:'))
  });
  issuesWithoutTeam.forEach(issue => logTicketId(issue.key));

  const usedProjects = Object.entries(projects).filter(([projectId, value]) => {
    return issues.some(issue => {
      return issue.fields?.parent?.key === projectId
    })
  });

  console.log('Release Items without area:')
  const issuesWithoutArea = issuesWithLabels.filter((issue) => {
    return !issue.fields.labels.some(label => label.includes('area:'))
  });
  issuesWithoutArea.forEach(issue => logTicketId(issue.key));


  console.log('Roadmap Items without theme:')
  const projectsWithoutTheme = usedProjects.filter(([projectId, value]) => {
    return !value.labels.some(label => label.includes('theme:'))
  });
  projectsWithoutTheme.forEach(([projectId]) => logTicketId(projectId));

  console.log('Roadmap Items without initiative (excl. non-roadmap):')
  const projectsWithoutInitiative = usedProjects.filter(([projectId, value]) => {
    const noInitiative = !value.labels.some(label => label.includes('initiative:'));
    const virtualTheme = value.labels.some(label => {
     return label.includes('theme:virtual') || label.includes('theme:non-roadmap') 
    } );

    return noInitiative && !virtualTheme;
  });
  projectsWithoutInitiative.forEach(([projectId]) => logTicketId(projectId));
})();
