import type { OmegaConfig } from "@omega/config";
import type { RawCycleData } from "@omega/types";
import type { JiraAdapter } from "../adapters/jira-adapter.interface";
import { DefaultJiraAdapter } from "../adapters/default-jira-adapter";
import { FakeDataAdapter } from "../adapters/fake-data-adapter";
import { JiraClient } from "@omega/jira-primitives";

/**
 * Collect cycle data using the appropriate adapter
 * This service now focuses on business logic and adapter selection
 */
export default async function collectCycleData(
  omegaConfig: OmegaConfig,
  _extraFields: string[] = [],
): Promise<RawCycleData> {
  const adapter = createAdapter(omegaConfig);
  const rawData = await adapter.fetchCycleData();
  return applyBusinessLogic(rawData, omegaConfig);
}

/**
 * Create the appropriate adapter based on configuration
 */
function createAdapter(omegaConfig: OmegaConfig): JiraAdapter {
  if (omegaConfig.isUsingFakeCycleData()) {
    return new FakeDataAdapter(omegaConfig);
  }

  const jiraConfig = omegaConfig.getJiraConfig()!;
  const jiraClient = new JiraClient({
    statusMappings: {},
    statusCategories: {},
    limits: { maxResults: 1000 },
    fields: {},
    connection: {
      host: jiraConfig.connection.host || "https://example.atlassian.net",
      user: jiraConfig.connection.user || "user@example.com",
      token: jiraConfig.connection.token || "dummy-token",
      boardId: jiraConfig.connection.boardId,
    },
  });
  return new DefaultJiraAdapter(jiraClient, omegaConfig);
}

/**
 * Apply Omega-specific business logic to raw data
 */
function applyBusinessLogic(
  rawData: RawCycleData,
  _omegaConfig: OmegaConfig,
): RawCycleData {
  // Calculate progress for each cycle based on release item completion
  const cyclesWithProgress = rawData.cycles.map((cycle) => {
    const cycleReleaseItems = rawData.releaseItems.filter(
      (ri) => ri.cycleId === cycle.id,
    );

    if (cycleReleaseItems.length === 0) {
      return { ...cycle, progress: 0 };
    }

    const completedItems = cycleReleaseItems.filter((ri) => {
      const status = ri.status?.toLowerCase();
      return status === "done" || status === "completed" || status === "closed";
    });

    const progress = Math.round(
      (completedItems.length / cycleReleaseItems.length) * 100,
    );
    return { ...cycle, progress };
  });

  return {
    ...rawData,
    cycles: cyclesWithProgress,
  };
}
