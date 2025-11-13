/**
 * Koa Context Extensions
 *
 * Type definitions for extended Koa context properties
 */

import type { Context } from "koa";
import type { HeadNorthConfig } from "@headnorth/config";
import type { JiraAdapter } from "../adapters/jira-adapter.interface";

/**
 * Extended Koa context with Head North-specific properties
 */
export interface HeadNorthContext extends Context {
  headNorthConfig: HeadNorthConfig;
  jiraAdapter: JiraAdapter;
}

/**
 * Type guard to check if context has Head North properties
 */
export function isHeadNorthContext(
  context: Context,
): context is HeadNorthContext {
  return (
    "headNorthConfig" in context &&
    "jiraAdapter" in context &&
    typeof (context as HeadNorthContext).headNorthConfig !== "undefined" &&
    typeof (context as HeadNorthContext).jiraAdapter !== "undefined"
  );
}
