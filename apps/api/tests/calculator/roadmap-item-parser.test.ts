/**
 * Tests for roadmap-item-parser.ts
 *
 * Tests the RoadmapItemParser class that converts roadmap items with label resolution.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { RoadmapItemParser } from "../../src/calculator/roadmap-item-parser";
import { createMockOmegaConfig } from "../../../../tests/fixtures/config-fixtures";
import { createMockJiraIssue } from "../fixtures/jira-fixtures";

describe("RoadmapItemParser", () => {
  let mockConfig: any;
  let mockRoadmapItems: any;
  let parser: RoadmapItemParser;

  beforeEach(() => {
    mockConfig = createMockOmegaConfig();
    mockRoadmapItems = {
      "ROADMAP-001": {
        summary: "Test Roadmap Item",
        labels: ["area:frontend", "theme:platform", "initiative:init-1"],
      },
      "ROADMAP-002": {
        summary: "Another Roadmap Item",
        labels: ["area:backend", "theme:performance", "initiative:init-2"],
      },
      "ROADMAP-VIRTUAL": {
        summary: "Virtual Roadmap Item",
        labels: ["theme:virtual"],
      },
    };
    parser = new RoadmapItemParser(mockRoadmapItems, mockConfig);
  });

  describe("parse", () => {
    it("should parse a valid roadmap item correctly", () => {
      const releaseItems = [createMockJiraIssue()];

      const result = parser.parse("ROADMAP-001", releaseItems);

      expect(result).toEqual({
        id: "ROADMAP-001",
        initiativeId: "init-1",
        initiative: { id: "init-1", name: "Initiative One" },
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
        validations: [],
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
      const releaseItems = [createMockJiraIssue()];

      const result = parser.parse("ROADMAP-MISSING", releaseItems);

      expect(result).toEqual({
        id: "ROADMAP-MISSING",
        initiativeId: null,
        initiative: null,
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
      const releaseItems = [createMockJiraIssue()];
      const parserWithNull = new RoadmapItemParser({}, mockConfig);

      const result = parserWithNull.parse("ROADMAP-001", releaseItems);

      expect(result).toEqual({
        id: "ROADMAP-001",
        initiativeId: null,
        initiative: null,
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
      const releaseItems = [createMockJiraIssue()];

      const result = parser.parse("ROADMAP-VIRTUAL", releaseItems);

      expect(result.theme).toEqual({ name: "Virtual" });
      expect(result.initiativeId).toBe("uncategorized");
    });

    it("should handle roadmap item with missing labels", () => {
      const roadmapItemsWithMissingLabels = {
        "ROADMAP-003": {
          summary: "Roadmap Item with Missing Labels",
          labels: [],
        },
      };
      const parserWithMissingLabels = new RoadmapItemParser(
        roadmapItemsWithMissingLabels,
        mockConfig,
      );
      const releaseItems = [createMockJiraIssue()];

      const result = parserWithMissingLabels.parse("ROADMAP-003", releaseItems);

      expect(result.theme).toEqual({});
      expect(result.area).toEqual({ name: [] });
      expect(result.initiativeId).toBe("uncategorized");
    });

    it("should handle roadmap item with untranslated labels", () => {
      const roadmapItemsWithUntranslated = {
        "ROADMAP-004": {
          summary: "Roadmap Item with Untranslated Labels",
          labels: ["area:unknown", "theme:unknown", "initiative:unknown"],
        },
      };
      const parserWithUntranslated = new RoadmapItemParser(
        roadmapItemsWithUntranslated,
        mockConfig,
      );
      const releaseItems = [createMockJiraIssue()];

      const result = parserWithUntranslated.parse("ROADMAP-004", releaseItems);

      expect(result.theme).toEqual({ name: "unknown" });
      expect(result.area).toEqual({ name: "unknown" });
      expect(result.initiativeId).toBe("unknown");
    });

    it("should handle roadmap item with multiple teams", () => {
      const releaseItems = [
        createMockJiraIssue({
          fields: {
            ...createMockJiraIssue().fields,
            labels: ["area:frontend", "team:team-a", "theme:platform"],
          },
        }),
        createMockJiraIssue({
          fields: {
            ...createMockJiraIssue().fields,
            labels: ["area:frontend", "team:team-b", "theme:platform"],
          },
        }),
      ];

      const result = parser.parse("ROADMAP-001", releaseItems);

      expect(result.owningTeam).toBe("unknown"); // Should use first team
    });

    it("should handle roadmap item with no teams in release items", () => {
      const releaseItems = [
        createMockJiraIssue({
          fields: {
            ...createMockJiraIssue().fields,
            labels: ["area:frontend", "theme:platform"], // No team labels
          },
        }),
      ];

      const result = parser.parse("ROADMAP-001", releaseItems);

      expect(result.owningTeam).toBe("unknown");
    });

    it("should handle roadmap item with no pre-release allowed label", () => {
      const roadmapItemsWithNoPreRelease = {
        "ROADMAP-005": {
          summary: "Roadmap Item with No Pre-Release Allowed",
          labels: [
            "area:frontend",
            "theme:platform",
            "initiative:init-1",
            "no-pre-release-allowed",
          ],
        },
      };
      const parserWithNoPreRelease = new RoadmapItemParser(
        roadmapItemsWithNoPreRelease,
        mockConfig,
      );
      const releaseItems = [createMockJiraIssue()];

      const result = parserWithNoPreRelease.parse("ROADMAP-005", releaseItems);

      expect(result.isExternal).toBe(false);
    });

    it("should handle roadmap item with pre-release allowed (default behavior)", () => {
      const releaseItems = [createMockJiraIssue()];

      const result = parser.parse("ROADMAP-001", releaseItems);

      expect(result.isExternal).toBe(false);
    });

    it("should handle roadmap item with empty summary", () => {
      const roadmapItemsWithEmptySummary = {
        "ROADMAP-006": {
          summary: "",
          labels: ["area:frontend", "theme:platform", "initiative:init-1"],
        },
      };
      const parserWithEmptySummary = new RoadmapItemParser(
        roadmapItemsWithEmptySummary,
        mockConfig,
      );
      const releaseItems = [createMockJiraIssue()];

      const result = parserWithEmptySummary.parse("ROADMAP-006", releaseItems);

      expect(result.name).toBe("");
    });

    it("should handle roadmap item with null summary", () => {
      const roadmapItemsWithNullSummary = {
        "ROADMAP-007": {
          summary: null,
          labels: ["area:frontend", "theme:platform", "initiative:init-1"],
        },
      };
      const parserWithNullSummary = new RoadmapItemParser(
        roadmapItemsWithNullSummary,
        mockConfig,
      );
      const releaseItems = [createMockJiraIssue()];

      const result = parserWithNullSummary.parse("ROADMAP-007", releaseItems);

      expect(result.name).toBe("");
    });

    it("should handle roadmap item with undefined summary", () => {
      const roadmapItemsWithUndefinedSummary = {
        "ROADMAP-008": {
          labels: ["area:frontend", "theme:platform", "initiative:init-1"],
        },
      };
      const parserWithUndefinedSummary = new RoadmapItemParser(
        roadmapItemsWithUndefinedSummary,
        mockConfig,
      );
      const releaseItems = [createMockJiraIssue()];

      const result = parserWithUndefinedSummary.parse(
        "ROADMAP-008",
        releaseItems,
      );

      expect(result.name).toBe("");
    });

    it("should handle roadmap item with complex label combinations", () => {
      const roadmapItemsWithComplexLabels = {
        "ROADMAP-009": {
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
        },
      };
      const parserWithComplexLabels = new RoadmapItemParser(
        roadmapItemsWithComplexLabels,
        mockConfig,
      );
      const releaseItems = [createMockJiraIssue()];

      const result = parserWithComplexLabels.parse("ROADMAP-009", releaseItems);

      expect(result.theme).toEqual({ name: "Platform" }); // Should use first theme
      expect(result.area).toEqual({ name: "Frontend, Backend" }); // Should use all areas
      expect(result.initiativeId).toBe("init-1"); // Should use first initiative
    });
  });
});
