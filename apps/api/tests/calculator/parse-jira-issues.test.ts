/**
 * Tests for parse-jira-issues.ts
 *
 * Tests the IssueParser class that groups and structures Jira issues by roadmap items and initiatives.
 */

import { describe, it, expect, beforeEach } from "vitest";
import parseJiraIssues from "../../src/calculator/parse-jira-issues";
import { createMockOmegaConfig } from "../../../../tests/fixtures/config-fixtures";
import {
  createMockJiraIssue,
  createTestIssueCollection,
  createMockRoadmapItemsData,
  createMockSprintCollection,
} from "../fixtures/jira-fixtures";

describe("parse-jira-issues", () => {
  let mockConfig: any;
  let mockRoadmapItems: any;
  let mockSprint: any;

  beforeEach(() => {
    mockConfig = createMockOmegaConfig();
    mockRoadmapItems = createMockRoadmapItemsData();
    mockSprint = createMockSprintCollection()[0];
  });

  describe("IssueParser", () => {
    it("should parse and group issues by roadmap items", () => {
      const issues = [
        createMockJiraIssue({
          key: "RELEASE-001",
          fields: {
            ...createMockJiraIssue().fields,
            parent: { key: "ROADMAP-456" },
          },
        }),
        createMockJiraIssue({
          key: "RELEASE-002",
          fields: {
            ...createMockJiraIssue().fields,
            parent: { key: "ROADMAP-456" },
          },
        }),
        createMockJiraIssue({
          key: "RELEASE-003",
          fields: {
            ...createMockJiraIssue().fields,
            parent: { key: "ROADMAP-789" },
          },
        }),
      ];

      const result = parseJiraIssues(
        issues,
        mockRoadmapItems,
        mockSprint,
        mockConfig,
      );

      expect(result).toHaveLength(2); // Two initiatives
      expect(result[0].initiative.name).toBe("Initiative One");
      expect(result[0].roadmapItems).toHaveLength(1);
      expect(result[0].roadmapItems[0].releaseItems).toHaveLength(2);
      expect(result[1].initiative.name).toBe("Initiative Two");
      expect(result[1].roadmapItems).toHaveLength(1);
      expect(result[1].roadmapItems[0].releaseItems).toHaveLength(1);
    });

    it("should group issues by initiatives", () => {
      const issues = [
        createMockJiraIssue({
          key: "RELEASE-001",
          fields: {
            ...createMockJiraIssue().fields,
            parent: { key: "ROADMAP-456" },
            labels: ["area:frontend", "theme:platform", "initiative:init-1"],
          },
        }),
        createMockJiraIssue({
          key: "RELEASE-002",
          fields: {
            ...createMockJiraIssue().fields,
            parent: { key: "ROADMAP-789" },
            labels: ["area:backend", "theme:performance", "initiative:init-2"],
          },
        }),
      ];

      const result = parseJiraIssues(
        issues,
        mockRoadmapItems,
        mockSprint,
        mockConfig,
      );

      expect(result).toHaveLength(2);
      expect(result[0].initiative.name).toBe("Initiative One");
      expect(result[1].initiative.name).toBe("Initiative Two");
    });

    it("should handle virtual initiatives", () => {
      const issues = [
        createMockJiraIssue({
          key: "RELEASE-001",
          fields: {
            ...createMockJiraIssue().fields,
            parent: { key: "ROADMAP-VIRTUAL" },
            labels: ["theme:virtual"],
          },
        }),
      ];

      const result = parseJiraIssues(
        issues,
        mockRoadmapItems,
        mockSprint,
        mockConfig,
      );

      expect(result).toHaveLength(1);
      expect(result[0].initiative).toEqual({
        id: "uncategorized",
        name: "uncategorized",
      });
      expect(result[0].id).toBe("uncategorized");
    });

    it("should handle mixed virtual and regular initiatives", () => {
      const issues = [
        createMockJiraIssue({
          key: "RELEASE-001",
          fields: {
            ...createMockJiraIssue().fields,
            parent: { key: "ROADMAP-456" },
            labels: ["area:frontend", "theme:platform", "initiative:init-1"],
          },
        }),
        createMockJiraIssue({
          key: "RELEASE-002",
          fields: {
            ...createMockJiraIssue().fields,
            parent: { key: "ROADMAP-VIRTUAL" },
            labels: ["theme:virtual"],
          },
        }),
      ];

      const result = parseJiraIssues(
        issues,
        mockRoadmapItems,
        mockSprint,
        mockConfig,
      );

      expect(result).toHaveLength(2);
      expect(result[0].initiative.name).toBe("Initiative One");
      expect(result[1].initiative).toEqual({
        id: "uncategorized",
        name: "uncategorized",
      });
    });

    it("should handle empty issues array", () => {
      const result = parseJiraIssues(
        [],
        mockRoadmapItems,
        mockSprint,
        mockConfig,
      );

      expect(result).toHaveLength(0); // Empty issues array results in empty result
    });

    it("should handle issues with no parent (missing project ID)", () => {
      const issues = [
        createMockJiraIssue({
          key: "RELEASE-001",
          fields: {
            ...createMockJiraIssue().fields,
            parent: null,
          },
        }),
      ];

      const result = parseJiraIssues(
        issues,
        mockRoadmapItems,
        mockSprint,
        mockConfig,
      );

      expect(result).toHaveLength(1); // Items with missing project ID are still included but with null projectId
    });

    it("should handle issues with unknown roadmap items", () => {
      const issues = [
        createMockJiraIssue({
          key: "RELEASE-001",
          fields: {
            ...createMockJiraIssue().fields,
            parent: { key: "ROADMAP-UNKNOWN" },
          },
        }),
      ];

      const result = parseJiraIssues(
        issues,
        mockRoadmapItems,
        mockSprint,
        mockConfig,
      );

      expect(result).toHaveLength(1); // Items with missing project ID are still included but with null projectId
    });

    it("should handle issues with missing labels", () => {
      const issues = [
        createMockJiraIssue({
          key: "RELEASE-001",
          fields: {
            ...createMockJiraIssue().fields,
            parent: { key: "ROADMAP-456" },
            labels: [],
          },
        }),
      ];

      const result = parseJiraIssues(
        issues,
        mockRoadmapItems,
        mockSprint,
        mockConfig,
      );

      expect(result).toHaveLength(1);
      expect(result[0].initiativeId).toBeUndefined();
    });

    it("should handle issues with untranslated labels", () => {
      const issues = [
        createMockJiraIssue({
          key: "RELEASE-001",
          fields: {
            ...createMockJiraIssue().fields,
            parent: { key: "ROADMAP-456" },
            labels: ["area:frontend", "theme:unknown", "initiative:unknown"],
          },
        }),
      ];

      const result = parseJiraIssues(
        issues,
        mockRoadmapItems,
        mockSprint,
        mockConfig,
      );

      expect(result).toHaveLength(1);
      expect(result[0].initiative.name).toBe("Initiative One");
    });

    it("should group multiple roadmap items under same initiative", () => {
      const roadmapItemsWithSameInitiative = {
        "ROADMAP-001": {
          summary: "Roadmap Item 1",
          labels: ["area:frontend", "theme:platform", "initiative:init-1"],
        },
        "ROADMAP-002": {
          summary: "Roadmap Item 2",
          labels: ["area:backend", "theme:platform", "initiative:init-1"],
        },
      };

      const issues = [
        createMockJiraIssue({
          key: "RELEASE-001",
          fields: {
            ...createMockJiraIssue().fields,
            parent: { key: "ROADMAP-001" },
          },
        }),
        createMockJiraIssue({
          key: "RELEASE-002",
          fields: {
            ...createMockJiraIssue().fields,
            parent: { key: "ROADMAP-002" },
          },
        }),
      ];

      const result = parseJiraIssues(
        issues,
        roadmapItemsWithSameInitiative,
        mockSprint,
        mockConfig,
      );

      expect(result).toHaveLength(1);
      expect(result[0].initiative.name).toBe("Initiative One");
      expect(result[0].roadmapItems).toHaveLength(2);
    });

    it("should handle issues with different sprint configurations", () => {
      const sprintWithDifferentDates = {
        id: 2,
        name: "Sprint 2",
        startDate: "2024-02-01T00:00:00.000Z",
        endDate: "2024-02-14T23:59:59.000Z",
      };

      const issues = [
        createMockJiraIssue({
          key: "RELEASE-001",
          fields: {
            ...createMockJiraIssue().fields,
            parent: { key: "ROADMAP-456" },
            sprint: {
              id: 2,
              name: "Sprint 2",
              state: "active" as const,
              startDate: "2024-02-01T00:00:00.000Z",
              endDate: "2024-02-14T23:59:59.000Z",
              originBoardId: 123,
            },
          },
        }),
      ];

      const result = parseJiraIssues(
        issues,
        mockRoadmapItems,
        sprintWithDifferentDates,
        mockConfig,
      );

      expect(result).toHaveLength(1);
      expect(result[0].roadmapItems[0].releaseItems[0].status).toBe(
        "inprogress",
      );
    });

    it("should handle issues with validation errors", () => {
      const issues = [
        createMockJiraIssue({
          key: "RELEASE-001",
          fields: {
            ...createMockJiraIssue().fields,
            parent: { key: "ROADMAP-456" },
            effort: 1.3, // Invalid effort
            labels: [], // Missing area and team labels
          },
        }),
      ];

      const result = parseJiraIssues(
        issues,
        mockRoadmapItems,
        mockSprint,
        mockConfig,
      );

      expect(result).toHaveLength(1);
      expect(
        result[0].roadmapItems[0].releaseItems[0].validations,
      ).toHaveLength(4);
    });

    it("should handle complex issue collection", () => {
      const issues = createTestIssueCollection();

      const result = parseJiraIssues(
        issues,
        mockRoadmapItems,
        mockSprint,
        mockConfig,
      );

      expect(result.length).toBeGreaterThan(0);
      result.forEach((initiative) => {
        expect(initiative.initiative).toBeDefined();
        expect(initiative.roadmapItems).toBeDefined();
        expect(Array.isArray(initiative.roadmapItems)).toBe(true);
      });
    });

    it("should preserve issue order within roadmap items", () => {
      const issues = [
        createMockJiraIssue({
          key: "RELEASE-001",
          fields: {
            ...createMockJiraIssue().fields,
            parent: { key: "ROADMAP-456" },
          },
        }),
        createMockJiraIssue({
          key: "RELEASE-002",
          fields: {
            ...createMockJiraIssue().fields,
            parent: { key: "ROADMAP-456" },
          },
        }),
        createMockJiraIssue({
          key: "RELEASE-003",
          fields: {
            ...createMockJiraIssue().fields,
            parent: { key: "ROADMAP-456" },
          },
        }),
      ];

      const result = parseJiraIssues(
        issues,
        mockRoadmapItems,
        mockSprint,
        mockConfig,
      );

      expect(result).toHaveLength(1);
      expect(result[0].roadmapItems[0].releaseItems).toHaveLength(3);
      expect(result[0].roadmapItems[0].releaseItems[0].id).toBe("RELEASE-001");
      expect(result[0].roadmapItems[0].releaseItems[1].id).toBe("RELEASE-002");
      expect(result[0].roadmapItems[0].releaseItems[2].id).toBe("RELEASE-003");
    });
  });
});
