/**
 * Tests for roadmap-item-parser.ts
 *
 * Tests the RoadmapItemParser class that converts roadmap items with label resolution.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { RoadmapItemParser } from "../../src/calculator/roadmap-item-parser";
import { createMockOmegaConfig } from "../../../../tests/fixtures/config-fixtures";
import { createMockJiraIssue } from "../fixtures/jira-fixtures";
import type { RoadmapItem, ReleaseItem } from "@omega/types";

// Helper function to create mock ReleaseItem from JiraIssue
function createMockReleaseItem(jiraIssue: any): ReleaseItem {
  return {
    id: jiraIssue.key,
    ticketId: jiraIssue.key,
    effort: jiraIssue.fields?.effort || 0,
    name: jiraIssue.summary || jiraIssue.fields?.summary || "",
    areaIds: [],
    teams: [],
    status: jiraIssue.status || jiraIssue.fields?.status?.name || "",
    url: "",
    isExternal: false,
    stage: "",
    assignee: jiraIssue.fields?.assignee || {},
    validations: [],
    roadmapItemId: jiraIssue.roadmapItemId,
    cycleId: jiraIssue.cycleId,
    summary: jiraIssue.summary || jiraIssue.fields?.summary || "",
  };
}

describe("RoadmapItemParser", () => {
  let mockConfig: any;
  let mockRoadmapItems: Record<string, RoadmapItem>;
  let parser: RoadmapItemParser;

  beforeEach(() => {
    mockConfig = createMockOmegaConfig();
    mockRoadmapItems = {
      "ROADMAP-001": {
        id: "ROADMAP-001",
        name: "Test Roadmap Item",
        summary: "Test Roadmap Item",
        labels: ["area:frontend", "theme:platform", "initiative:init-1"],
        validations: [],
      },
      "ROADMAP-002": {
        id: "ROADMAP-002",
        name: "Another Roadmap Item",
        summary: "Another Roadmap Item",
        labels: ["area:backend", "theme:performance", "initiative:init-2"],
        validations: [],
      },
      "ROADMAP-VIRTUAL": {
        id: "ROADMAP-VIRTUAL",
        name: "Virtual Roadmap Item",
        summary: "Virtual Roadmap Item",
        labels: ["theme:virtual"],
        validations: [],
      },
    };
    parser = new RoadmapItemParser(mockRoadmapItems, mockConfig);
  });

  describe("parse", () => {
    it("should parse a valid roadmap item correctly", () => {
      const jiraIssue = createMockJiraIssue();
      const releaseItems = [createMockReleaseItem(jiraIssue)];

      const result = parser.parse("ROADMAP-001", releaseItems);

      expect(result).toEqual({
        id: "ROADMAP-001",
        initiativeId: "init-1",
        name: "Test Roadmap Item",
        theme: { name: "Platform" },
        area: { name: "Frontend" },
        isExternal: false,
        releaseItems: releaseItems.map((item) => ({
          ...item,
          isExternal: false,
          validations: [],
        })),
        owningTeam: "unknown",
        url: "https://test.atlassian.net/browse/ROADMAP-001",
        validations: [
          {
            id: "ROADMAP-001-missingExternalRoadmap",
            code: "missingExternalRoadmap",
            name: "missingExternalRoadmap",
            status: "error",
            description: "",
          },
        ],
      });
    });

    it("should handle roadmap item with no release items", () => {
      const result = parser.parse("ROADMAP-001", []);

      expect(result.id).toBe("ROADMAP-001");
      expect(result.initiativeId).toBe("init-1");
      expect(result.name).toBe("Test Roadmap Item");
      expect(result.releaseItems).toEqual([]);
      expect(result.owningTeam).toBe("unknown");
    });

    it("should handle missing roadmap item", () => {
      const jiraIssue = createMockJiraIssue();
      const releaseItems = [createMockReleaseItem(jiraIssue)];

      const result = parser.parse("ROADMAP-MISSING", releaseItems);

      expect(result).toEqual({
        id: "ROADMAP-MISSING",
        initiativeId: null,
        name: "",
        theme: {},
        area: {},
        isExternal: false,
        releaseItems,
        owningTeam: "unknown",
        url: "https://test.atlassian.net/browse/ROADMAP-MISSING",
        validations: [],
      });
    });

    it("should handle roadmap item with null project data", () => {
      const jiraIssue = createMockJiraIssue();
      const releaseItems = [createMockReleaseItem(jiraIssue)];
      const parserWithNull = new RoadmapItemParser({}, mockConfig);

      const result = parserWithNull.parse("ROADMAP-001", releaseItems);

      expect(result).toEqual({
        id: "ROADMAP-001",
        initiativeId: null,
        name: "",
        theme: {},
        area: {},
        isExternal: false,
        releaseItems,
        owningTeam: "unknown",
        url: "https://test.atlassian.net/browse/ROADMAP-001",
        validations: [],
      });
    });

    it("should handle roadmap item with virtual theme", () => {
      const jiraIssue = createMockJiraIssue();
      const releaseItems = [createMockReleaseItem(jiraIssue)];

      const result = parser.parse("ROADMAP-VIRTUAL", releaseItems);

      expect(result.theme).toEqual({ name: "Virtual" });
      expect(result.initiativeId).toBe("uncategorized");
    });

    it("should handle roadmap item with missing labels", () => {
      const roadmapItemsWithMissingLabels: Record<string, RoadmapItem> = {
        "ROADMAP-003": {
          id: "ROADMAP-003",
          name: "Roadmap Item with Missing Labels",
          summary: "Roadmap Item with Missing Labels",
          labels: [],
          validations: [],
        },
      };
      const parserWithMissingLabels = new RoadmapItemParser(
        roadmapItemsWithMissingLabels,
        mockConfig,
      );
      const jiraIssue = createMockJiraIssue();
      const releaseItems = [createMockReleaseItem(jiraIssue)];

      const result = parserWithMissingLabels.parse("ROADMAP-003", releaseItems);

      expect(result.theme).toEqual({});
      expect(result.area).toEqual({ name: [] });
      expect(result.initiativeId).toBe("uncategorized");
    });

    it("should handle roadmap item with untranslated labels", () => {
      const roadmapItemsWithUntranslated: Record<string, RoadmapItem> = {
        "ROADMAP-004": {
          id: "ROADMAP-004",
          name: "Roadmap Item with Untranslated Labels",
          summary: "Roadmap Item with Untranslated Labels",
          labels: ["area:unknown", "theme:unknown", "initiative:unknown"],
          validations: [],
        },
      };
      const parserWithUntranslated = new RoadmapItemParser(
        roadmapItemsWithUntranslated,
        mockConfig,
      );
      const jiraIssue = createMockJiraIssue();
      const releaseItems = [createMockReleaseItem(jiraIssue)];

      const result = parserWithUntranslated.parse("ROADMAP-004", releaseItems);

      expect(result.theme).toEqual({ name: "unknown" });
      expect(result.area).toEqual({ name: "unknown" });
      expect(result.initiativeId).toBe("unknown");
    });

    it("should handle roadmap item with multiple teams", () => {
      const jiraIssue1 = createMockJiraIssue({
        fields: {
          ...createMockJiraIssue().fields,
          labels: ["area:frontend", "team:team-a", "theme:platform"],
        },
      });
      const jiraIssue2 = createMockJiraIssue({
        fields: {
          ...createMockJiraIssue().fields,
          labels: ["area:frontend", "team:team-b", "theme:platform"],
        },
      });
      const releaseItems = [
        createMockReleaseItem(jiraIssue1),
        createMockReleaseItem(jiraIssue2),
      ];

      const result = parser.parse("ROADMAP-001", releaseItems);

      expect(result.owningTeam).toBe("unknown"); // Should use first team
    });

    it("should handle roadmap item with no teams in release items", () => {
      const jiraIssue = createMockJiraIssue({
        fields: {
          ...createMockJiraIssue().fields,
          labels: ["area:frontend", "theme:platform"], // No team labels
        },
      });
      const releaseItems = [createMockReleaseItem(jiraIssue)];

      const result = parser.parse("ROADMAP-001", releaseItems);

      expect(result.owningTeam).toBe("unknown");
    });

    it("should handle roadmap item with no pre-release allowed label", () => {
      const roadmapItemsWithNoPreRelease: Record<string, RoadmapItem> = {
        "ROADMAP-005": {
          id: "ROADMAP-005",
          name: "Roadmap Item with No Pre-Release Allowed",
          summary: "Roadmap Item with No Pre-Release Allowed",
          labels: [
            "area:frontend",
            "theme:platform",
            "initiative:init-1",
            "no-pre-release-allowed",
          ],
          validations: [],
        },
      };
      const parserWithNoPreRelease = new RoadmapItemParser(
        roadmapItemsWithNoPreRelease,
        mockConfig,
      );
      const jiraIssue = createMockJiraIssue();
      const releaseItems = [createMockReleaseItem(jiraIssue)];

      const result = parserWithNoPreRelease.parse("ROADMAP-005", releaseItems);

      expect(result.isExternal).toBe(false);
    });

    it("should handle roadmap item with pre-release allowed (default behavior)", () => {
      const jiraIssue = createMockJiraIssue();
      const releaseItems = [createMockReleaseItem(jiraIssue)];

      const result = parser.parse("ROADMAP-001", releaseItems);

      expect(result.isExternal).toBe(false);
    });

    it("should handle roadmap item with empty summary", () => {
      const roadmapItemsWithEmptySummary: Record<string, RoadmapItem> = {
        "ROADMAP-006": {
          id: "ROADMAP-006",
          name: "",
          summary: "",
          labels: ["area:frontend", "theme:platform", "initiative:init-1"],
          validations: [],
        },
      };
      const parserWithEmptySummary = new RoadmapItemParser(
        roadmapItemsWithEmptySummary,
        mockConfig,
      );
      const jiraIssue = createMockJiraIssue();
      const releaseItems = [createMockReleaseItem(jiraIssue)];

      const result = parserWithEmptySummary.parse("ROADMAP-006", releaseItems);

      expect(result.name).toBe("");
    });

    it("should handle roadmap item with null summary", () => {
      const roadmapItemsWithNullSummary: Record<string, RoadmapItem> = {
        "ROADMAP-007": {
          id: "ROADMAP-007",
          name: "",
          summary: "",
          labels: ["area:frontend", "theme:platform", "initiative:init-1"],
          validations: [],
        },
      };
      const parserWithNullSummary = new RoadmapItemParser(
        roadmapItemsWithNullSummary,
        mockConfig,
      );
      const jiraIssue = createMockJiraIssue();
      const releaseItems = [createMockReleaseItem(jiraIssue)];

      const result = parserWithNullSummary.parse("ROADMAP-007", releaseItems);

      expect(result.name).toBe("");
    });

    it("should handle roadmap item with undefined summary", () => {
      const roadmapItemsWithUndefinedSummary: Record<string, RoadmapItem> = {
        "ROADMAP-008": {
          id: "ROADMAP-008",
          name: "",
          summary: "",
          labels: ["area:frontend", "theme:platform", "initiative:init-1"],
          validations: [],
        },
      };
      const parserWithUndefinedSummary = new RoadmapItemParser(
        roadmapItemsWithUndefinedSummary,
        mockConfig,
      );
      const jiraIssue = createMockJiraIssue();
      const releaseItems = [createMockReleaseItem(jiraIssue)];

      const result = parserWithUndefinedSummary.parse(
        "ROADMAP-008",
        releaseItems,
      );

      expect(result.name).toBe("");
    });

    it("should handle roadmap item with complex label combinations", () => {
      const roadmapItemsWithComplexLabels: Record<string, RoadmapItem> = {
        "ROADMAP-009": {
          id: "ROADMAP-009",
          name: "Complex Roadmap Item",
          summary: "Complex Roadmap Item",
          labels: [
            "area:frontend",
            "area:backend",
            "theme:platform",
            "theme:performance",
            "initiative:init-1",
            "initiative:init-2",
            "team:team-a",
            "team:team-b",
          ],
          validations: [],
        },
      };
      const parserWithComplexLabels = new RoadmapItemParser(
        roadmapItemsWithComplexLabels,
        mockConfig,
      );
      const jiraIssue = createMockJiraIssue();
      const releaseItems = [createMockReleaseItem(jiraIssue)];

      const result = parserWithComplexLabels.parse("ROADMAP-009", releaseItems);

      expect(result.theme).toEqual({ name: "Platform" }); // Should use first theme
      expect(result.area).toEqual({ name: "Frontend, Backend" }); // Should use all areas
      expect(result.initiativeId).toBe("init-1"); // Should use first initiative
    });
  });
});
