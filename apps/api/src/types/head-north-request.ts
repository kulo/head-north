/**
 * Fastify Request Extensions
 *
 * Type definitions for extended Fastify request properties
 */

import type { FastifyRequest } from "fastify";
import type { HeadNorthConfig } from "@headnorth/config";
import type { JiraAdapter } from "../adapters/jira-adapter.interface";

/**
 * Extended Fastify request with Head North-specific properties
 */
export interface HeadNorthRequest extends FastifyRequest {
  headNorthConfig: HeadNorthConfig;
  jiraAdapter: JiraAdapter;
}

/**
 * Type guard to check if request has Head North properties
 */
export function isHeadNorthRequest(
  request: FastifyRequest,
): request is HeadNorthRequest {
  return (
    "headNorthConfig" in request &&
    "jiraAdapter" in request &&
    typeof (request as HeadNorthRequest).headNorthConfig !== "undefined" &&
    typeof (request as HeadNorthRequest).jiraAdapter !== "undefined"
  );
}
