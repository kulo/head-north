import collectJiraData from '../service/collect-jira-data.js';
import parseJiraIssues from '../calculator/parse-jira-issues.js';
import pkg from "lodash";
const { uniqBy } = pkg;

const getInitiatives = (objectives) => {
  const usedInitiatives = objectives.map(objective => ({ id: objective.initiativeId, name: objective.initiative }));
  return uniqBy(usedInitiatives, initiative => initiative.id);
}

export default async (context) => {
  // Get omegaConfig from context
  const omegaConfig = context.omegaConfig;
  
  // Get cycle ID from path parameter, fallback to query parameter for backward compatibility
  const cycleId = context.params.id || context.query.sprintId;
  const { projects, issues, sprint, sprints, assignees, areas, initiatives } = await collectJiraData(cycleId, omegaConfig);
  const objectives = parseJiraIssues(issues, projects, sprint, omegaConfig);
  const teams = [ 
    { id: "CAT", name: "CAT" },
    { id: "CAST", name: "CAST" }
    ];
    //getTeams(objectives);

  context.body = {
    devCycleData: {
      cycle: sprint,
      objectives,
      area: omegaConfig.getLabelTranslations().area,
      assignees,
      teams,
      initiatives
    },
    sprints,
    stages: omegaConfig.getStages(),
    areas,
    initiatives
  };
};
