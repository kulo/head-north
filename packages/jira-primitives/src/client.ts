// Low-level JIRA API wrapper
import { AgileClient, Version3Client } from "jira.js";
import type { Either } from "@headnorth/utils";
import { Left, safeAsync } from "@headnorth/utils";
import type { z } from "zod";
import type { JiraIssue, JiraSprint, JiraConfig } from "./types";
import {
  validateJiraSearchResponse,
  validateJiraSprintsResponse,
  validateJiraIssue,
  formatZodError,
} from "./validation";

/**
 * Helper function to transform Zod validation errors to Error objects
 * @param validation - Either<z.ZodError, T> validation result
 * @param mapper - Optional function to extract data from validated result
 * @returns Either<Error, U> where U is the mapped data or the validated data
 */
function handleValidationError<T, U = T>(
  validation: Either<z.ZodError, T>,
  mapper?: (validated: T) => U,
): Either<Error, U> {
  return validation
    .mapLeft((zodError) => {
      return new Error(
        `Invalid JIRA API response: ${formatZodError(zodError)}`,
      );
    })
    .map(mapper || ((data) => data as unknown as U));
}

export class JiraClient {
  private agileClient: AgileClient;
  private version3Client: Version3Client;
  private config: JiraConfig;

  constructor(config: JiraConfig) {
    this.config = config;
    const authConfig = {
      host: config.connection.host,
      authentication: {
        basic: {
          email: config.connection.user,
          apiToken: config.connection.token,
        },
      },
    };

    this.agileClient = new AgileClient(authConfig);
    this.version3Client = new Version3Client(authConfig);
  }

  /**
   * Search for issues using JQL
   * @param jql - JQL query string
   * @param fields - Fields to retrieve (default: [])
   * @param boardId - Optional board ID. If provided, searches within the board context.
   *                  If not provided, uses the regular issue search API (better for Epic issues)
   * @returns Either<Error, JiraIssue[]> - Functional error handling
   */
  async searchIssues(
    jql: string,
    fields: string[] = [],
    boardId?: number,
  ): Promise<Either<Error, JiraIssue[]>> {
    // If boardId is provided, use board-specific search
    if (boardId !== undefined) {
      const fetchResult = await safeAsync(async () => {
        return await this.agileClient.board.getIssuesForBoard({
          boardId,
          maxResults: 1000,
          jql,
          fields,
        });
      });

      return fetchResult.chain((response) => {
        const validation = validateJiraSearchResponse(response);
        return handleValidationError(
          validation,
          (validated) => validated.issues,
        );
      });
    }

    // Otherwise, use the regular issue search API (better for Epic issues that aren't on boards)
    // Use the new /rest/api/3/search/jql endpoint directly (jira.js method uses deprecated endpoint)
    const host = this.config.connection.host;
    const email = this.config.connection.user;
    const apiToken = this.config.connection.token;

    if (!host || !email || !apiToken) {
      return Left(new Error("Jira configuration incomplete"));
    }

    // Make direct HTTP call to the new POST search endpoint
    const fetchResult = await safeAsync(async () => {
      const response = await fetch(`${host}/rest/api/3/search/jql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`,
        },
        body: JSON.stringify({
          jql,
          maxResults: 1000,
          fields: fields && fields.length > 0 ? fields : undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Jira API error: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      return await response.json();
    });

    return fetchResult.chain((data) => {
      const validation = validateJiraSearchResponse(data);
      return handleValidationError(validation, (validated) => validated.issues);
    });
  }

  /**
   * Get all sprints for a board
   * @returns Either<Error, JiraSprint[]> - Functional error handling
   */
  async getSprints(boardId: number): Promise<Either<Error, JiraSprint[]>> {
    const fetchResult = await safeAsync(async () => {
      return await this.agileClient.board.getAllSprints({
        boardId,
        state: "active,closed,future",
      });
    });

    return fetchResult.chain((response) => {
      // Validate response structure
      const validation = validateJiraSprintsResponse(response);
      return handleValidationError(validation, (validated) => validated.values);
    });
  }

  /**
   * Get a specific issue by key
   * @returns Either<Error, JiraIssue> - Functional error handling
   */
  async getIssue(key: string): Promise<Either<Error, JiraIssue>> {
    const fetchResult = await safeAsync(async () => {
      return await this.version3Client.issues.getIssue({
        issueIdOrKey: key,
      });
    });

    return fetchResult.chain((response) => {
      // Validate response structure
      const validation = validateJiraIssue(response);
      return handleValidationError(validation);
    });
  }

  /**
   * Get issues for a specific sprint
   * @returns Either<Error, JiraIssue[]> - Functional error handling
   */
  async getIssuesForSprint(
    sprintId: string | number,
    boardId: number,
    fields: string[] = [],
  ): Promise<Either<Error, JiraIssue[]>> {
    const fetchResult = await safeAsync(async () => {
      return await this.agileClient.board.getBoardIssuesForSprint({
        maxResults: 1000,
        boardId,
        sprintId: Number(sprintId),
        fields,
      });
    });

    return fetchResult.chain((response) => {
      // Validate response structure
      const validation = validateJiraSearchResponse(response);
      return handleValidationError(validation, (validated) => validated.issues);
    });
  }
}
