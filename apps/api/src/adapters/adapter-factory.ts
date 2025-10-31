/**
 * Adapter Factory
 *
 * Creates the appropriate JIRA adapter based on configuration.
 * Handles validation and adapter selection at application startup.
 */

import { logger } from "@omega/utils";
import type { Either } from "@omega/utils";
import { Right } from "@omega/utils";
import type { OmegaConfig, JiraConfigData } from "@omega/config";
import { JiraClient } from "@omega/jira-primitives";
import type { JiraConfig } from "@omega/jira-primitives";
import type { JiraAdapter } from "./jira-adapter.interface";
import { DefaultJiraAdapter } from "./default-jira-adapter";
import { FakeDataAdapter } from "./fake-data-adapter";

/**
 * Transform validated JiraConfigData to JiraConfig format expected by JiraClient
 * After validation, connection fields are guaranteed to be non-null strings
 */
function transformJiraConfigData(config: JiraConfigData): JiraConfig {
  return {
    statusMappings: config.statusMappings,
    statusCategories: {
      finished: config.statusCategories.finished.join(","),
      active: config.statusCategories.active.join(","),
      future: config.statusCategories.future.join(","),
    },
    limits: {
      maxResults: config.limits.maxResults,
    },
    fields: {
      ...config.fields,
    },
    connection: {
      // After validation, these fields are guaranteed to be non-null strings
      host: config.connection.host || "",
      user: config.connection.user || "",
      token: config.connection.token || "",
      boardId: config.connection.boardId,
    },
  };
}

/**
 * Create the appropriate JIRA adapter based on configuration
 * - If using fake data: returns FakeDataAdapter
 * - If using real JIRA: validates config and returns DefaultJiraAdapter
 * - Returns Either<Error, JiraAdapter> - client code should fail fast on Left
 *
 * @param omegaConfig - Omega configuration instance
 * @returns Either<Error, JiraAdapter> - Right contains adapter, Left contains validation error
 */
export function createJiraAdapter(
  omegaConfig: OmegaConfig,
): Either<Error, JiraAdapter> {
  if (omegaConfig.isUsingFakeCycleData()) {
    logger.default.info("Using FakeDataAdapter for cycle data");
    return Right(new FakeDataAdapter(omegaConfig));
  }

  // Validate JIRA config - return Left if invalid (no fallback for production)
  const jiraConfigResult = omegaConfig.getJiraConfig();
  return jiraConfigResult.map((jiraConfig) => {
    logger.default.info("JIRA configuration validated successfully");

    // Transform validated config to JiraClient format
    const clientConfig = transformJiraConfigData(jiraConfig);
    const jiraClient = new JiraClient(clientConfig);

    return new DefaultJiraAdapter(jiraClient, omegaConfig, jiraConfig);
  });
}
