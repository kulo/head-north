import collectCycleOverviewData from '../service/collect-cycle-overview-data.js';
import parseJiraIssues from '../calculator/parse-jira-issues.js';
import pkg from "lodash";
import { logger } from '@omega-one/shared-utils';

const { uniqBy } = pkg;


export default async (context) => {
  
  const omegaConfig = context.omegaConfig;
  
  // Get cycle ID from path parameter, fallback to query parameter for backward compatibility
  const cycleId = context.params.id || context.query.sprintId;
  logger.default.info('building cycle overview data for cycleId: ', { cycleId });

  const { roadmapItems, issues, sprint, sprints, assignees, areas, initiatives: configInitiatives } = 
    await collectCycleOverviewData(cycleId, omegaConfig);
  
  const initiatives = parseJiraIssues(issues, roadmapItems, sprint, omegaConfig);
  const teams = omegaConfig.getTeams();

  context.body = {
    devCycleData: {
      cycle: sprint,
      initiatives,
      area: omegaConfig.getLabelTranslations().areas,
      assignees,
      teams
    },
    sprints,
    stages: omegaConfig.getStages(),
    areas,
    initiatives: configInitiatives
  };
};
