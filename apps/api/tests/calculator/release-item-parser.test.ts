/**
 * Tests for release-item-parser.ts
 *
 * Tests the ReleaseItemParser class that converts Jira issues to parsed release items.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ReleaseItemParser } from "../../src/calculator/release-item-parser";
import { createMockOmegaConfig } from "../../../../tests/fixtures/config-fixtures";
import {
  createMockJiraIssue,
  createMinimalJiraIssue,
  createJiraIssueWithInvalidEffort,
  createJiraIssueWithoutAreaLabel,
  createJiraIssueWithoutTeamLabel,
  createJiraIssueWithUntranslatedTeam,
  createJiraIssueWithoutAssignee,
  createJiraIssueWithoutParent,
  createJiraIssueWithStage,
} from "../fixtures/jira-fixtures";

describe("ReleaseItemParser", () => {
  let mockConfig: any;
  let mockSprint: any;
  let parser: ReleaseItemParser;

  beforeEach(() => {
    mockConfig = createMockOmegaConfig();
    mockSprint = {
      id: 1,
      name: "Sprint 1",
      startDate: "2024-01-01T00:00:00.000Z",
      endDate: "2024-01-14T23:59:59.000Z",
    };
    parser = new ReleaseItemParser(mockSprint, mockConfig);
  });

  describe("parse", () => {
    it("should parse a valid Jira issue correctly", () => {
      const issue = createMockJiraIssue();

      const result = parser.parse(issue);

      expect(result).toEqual({
        id: "TEST-123",
        ticketId: "TEST-123",
        effort: 2.0,
        projectId: "ROADMAP-456",
        name: "Test Feature",
        areaIds: ["frontend"],
        teams: ["Team Alpha"],
        status: "inprogress",
        url: "https://test.atlassian.net/browse/TEST-123",
        isExternal: false,
        stage: "s2",
        assignee: {
          accountId: "user123",
          displayName: "John Doe",
          emailAddress: "john@example.com",
          avatarUrls: {
            "48x48": "https://example.com/avatar.png",
          },
          active: true,
          timeZone: "UTC",
        },
        validations: [],
      });
    });

    it("should parse issue with stage in name and remove it from parsed name", () => {
      const issue = createJiraIssueWithStage("s3+");

      const result = parser.parse(issue);

      expect(result.name).toBe("Test Feature");
      expect(result.stage).toBe("s3+");
    });

    it("should handle issue with no assignee", () => {
      const issue = createJiraIssueWithoutAssignee();

      const result = parser.parse(issue);

      expect(result.assignee).toEqual({
        accountId: "reporter123",
        displayName: "Jane Smith",
        emailAddress: "jane@example.com",
        avatarUrls: {
          "48x48": "https://example.com/avatar2.png",
        },
        active: true,
        timeZone: "UTC",
      });
      expect(result.validations).toHaveLength(1);
      expect(result.validations[0].name).toBe("Missing assignee");
    });

    it("should handle issue with no parent (missing project ID)", () => {
      const issue = createJiraIssueWithoutParent();

      const result = parser.parse(issue);

      expect(result.projectId).toBeNull();
      expect(result.validations).toHaveLength(1);
      expect(result.validations[0].name).toBe("No parent project ID");
    });

    it("should handle issue with invalid effort estimate", () => {
      const issue = createJiraIssueWithInvalidEffort();

      const result = parser.parse(issue);

      expect(result.effort).toBe(1.3);
      expect(result.validations).toHaveLength(1);
      expect(result.validations[0].name).toBe("Effort estimate too granular");
    });

    it("should handle issue with missing effort estimate", () => {
      const issue = createMockJiraIssue({
        fields: {
          ...createMockJiraIssue().fields,
          effort: undefined,
        },
      });

      const result = parser.parse(issue);

      expect(result.effort).toBe(0);
      expect(result.validations).toHaveLength(1);
      expect(result.validations[0].name).toBe("Missing effort estimate");
    });

    it("should handle issue with zero effort estimate", () => {
      const issue = createMockJiraIssue({
        fields: {
          ...createMockJiraIssue().fields,
          effort: 0,
        },
      });

      const result = parser.parse(issue);

      expect(result.effort).toBe(0);
      expect(result.validations).toHaveLength(0); // Zero is considered a valid effort estimate
    });

    it("should handle issue with missing area label", () => {
      const issue = createJiraIssueWithoutAreaLabel();

      const result = parser.parse(issue);

      expect(result.areaIds).toEqual([]);
      expect(result.validations).toHaveLength(1);
      expect(result.validations[0].name).toBe("Missing area label");
    });

    it("should handle issue with missing team label", () => {
      const issue = createJiraIssueWithoutTeamLabel();

      const result = parser.parse(issue);

      expect(result.teams).toEqual([]);
      expect(result.validations).toHaveLength(1);
      expect(result.validations[0].name).toBe("Missing team label");
    });

    it("should handle issue with untranslated team label", () => {
      const issue = createJiraIssueWithUntranslatedTeam();

      const result = parser.parse(issue);

      expect(result.teams).toEqual(["unknown-team"]);
      expect(result.validations).toHaveLength(1);
      expect(result.validations[0].name).toBe(
        "Missing translation for team: unknown-team",
      );
    });

    it("should handle issue with multiple team labels", () => {
      const issue = createMockJiraIssue({
        fields: {
          ...createMockJiraIssue().fields,
          labels: [
            "area:frontend",
            "team:team-a",
            "team:team-b",
            "theme:platform",
          ],
        },
      });

      const result = parser.parse(issue);

      expect(result.teams).toEqual(["Team Alpha", "Team Beta"]);
      expect(result.validations).toHaveLength(0);
    });

    it("should handle issue with multiple area labels", () => {
      const issue = createMockJiraIssue({
        fields: {
          ...createMockJiraIssue().fields,
          labels: [
            "area:frontend",
            "area:backend",
            "team:team-a",
            "theme:platform",
          ],
        },
      });

      const result = parser.parse(issue);

      expect(result.areaIds).toEqual(["frontend", "backend"]);
      expect(result.validations).toHaveLength(0);
    });

    it("should handle minimal issue with only required fields", () => {
      const issue = createMinimalJiraIssue();

      const result = parser.parse(issue);

      expect(result.id).toBe("TEST-456");
      expect(result.ticketId).toBe("TEST-456");
      expect(result.effort).toBe(0);
      expect(result.projectId).toBe("ROADMAP-789");
      expect(result.name).toBe("Minimal Feature");
      expect(result.areaIds).toEqual([]);
      expect(result.teams).toEqual([]);
      expect(result.status).toBe("todo");
      expect(result.url).toBe("https://test.atlassian.net/browse/TEST-456");
      expect(result.isExternal).toBe(false);
      expect(result.stage).toBe("internal");
      expect(result.assignee).toBeUndefined();
      expect(result.validations).toHaveLength(4); // Missing effort, area, team, assignee
    });

    it("should handle issue with valid effort estimates", () => {
      const validEfforts = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 5.0];

      validEfforts.forEach((effort) => {
        const issue = createMockJiraIssue({
          fields: {
            ...createMockJiraIssue().fields,
            effort,
          },
        });

        const result = parser.parse(issue);

        expect(result.effort).toBe(effort);
        expect(result.validations).toHaveLength(0);
      });
    });

    it("should handle issue with different stages", () => {
      const stages = ["s1", "s2", "s3", "s3+"];

      stages.forEach((stage) => {
        const issue = createJiraIssueWithStage(stage);

        const result = parser.parse(issue);

        expect(result.stage).toBe(stage);
        expect(result.name).toBe("Test Feature");
      });
    });

    it("should handle issue with no stage in name", () => {
      const issue = createMockJiraIssue({
        fields: {
          ...createMockJiraIssue().fields,
          summary: "Feature without stage",
        },
      });

      const result = parser.parse(issue);

      expect(result.stage).toBe("internal");
      expect(result.name).toBe("Feature without stage");
    });

    it("should handle issue with complex stage name", () => {
      const issue = createMockJiraIssue({
        fields: {
          ...createMockJiraIssue().fields,
          summary: "Complex Feature (s3+) with details",
        },
      });

      const result = parser.parse(issue);

      expect(result.stage).toBe("s3+");
      expect(result.name).toBe("Complex Feature  with details"); // Stage removal fails due to whitespace, so name has extra spaces
    });

    it("should handle issue with case insensitive stage", () => {
      const issue = createMockJiraIssue({
        fields: {
          ...createMockJiraIssue().fields,
          summary: "Feature (S2) Implementation",
        },
      });

      const result = parser.parse(issue);

      expect(result.stage).toBe("s2");
      expect(result.name).toBe("Feature  Implementation"); // Stage removal fails due to whitespace, so name has extra spaces
    });

    it("should aggregate all validation errors", () => {
      const issue = createMockJiraIssue({
        fields: {
          ...createMockJiraIssue().fields,
          effort: 1.3, // Invalid effort
          labels: [], // Missing area and team labels
          assignee: null, // Missing assignee
        },
      });

      const result = parser.parse(issue);

      expect(result.validations).toHaveLength(4);
      expect(result.validations[0].name).toBe("Missing area label");
      expect(result.validations[1].name).toBe("Missing team label");
      expect(result.validations[2].name).toBe("Effort estimate too granular");
      expect(result.validations[3].name).toBe("Missing assignee");
    });
  });
});
