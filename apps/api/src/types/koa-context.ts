/**
 * Koa Context Extensions
 *
 * Type definitions for extended Koa context properties
 */

import type { Context } from "koa";
import type { OmegaConfig } from "@omega/config";
import type { JiraAdapter } from "../adapters/jira-adapter.interface";

/**
 * Extended Koa context with Omega-specific properties
 */
export interface OmegaContext extends Context {
  omegaConfig: OmegaConfig;
  jiraAdapter: JiraAdapter;
}

/**
 * Type guard to check if context has Omega properties
 */
export function isOmegaContext(context: Context): context is OmegaContext {
  return (
    "omegaConfig" in context &&
    "jiraAdapter" in context &&
    typeof (context as OmegaContext).omegaConfig !== "undefined" &&
    typeof (context as OmegaContext).jiraAdapter !== "undefined"
  );
}
