/**
 * Tests for filter.ts
 *
 * Tests the core filtering system for NestedCycleData with cascading filters.
 */

import { describe, it, expect } from "vitest";
import { Filter } from "../../../src/lib/utils/filter";
import {
  createMockNestedCycleData,
  createMockRoadmapItemWithProgress,
  createTestReleaseItemCollection,
} from "../../fixtures/cycle-data-fixtures";
import type {
  FilterCriteria,
  NestedCycleData,
} from "../../../src/types/ui-types";

describe("Filter", () => {
  let filter: Filter;
  let mockData: NestedCycleData;

  beforeEach(() => {
    filter = new Filter();
    mockData = createMockNestedCycleData();
  });

  describe("apply", () => {
    it("should return empty data for null/undefined input", () => {
      const result1 = filter.apply(null as any, {});
      const result2 = filter.apply(undefined as any, {});

      expect(result1.data.initiatives).toEqual([]);
      expect(result1.totalInitiatives).toBe(0);
      expect(result1.totalRoadmapItems).toBe(0);
      expect(result1.totalReleaseItems).toBe(0);
      expect(result2).toEqual(result1);
    });

    it("should return original data when no filters applied", () => {
      const result = filter.apply(mockData, {});

      expect(result.data).toEqual(mockData);
      expect(result.appliedFilters).toEqual({});
      expect(result.totalInitiatives).toBe(1);
      expect(result.totalRoadmapItems).toBe(1);
      expect(result.totalReleaseItems).toBe(2);
    });

    it("should filter by area", () => {
      const criteria: FilterCriteria = { area: "frontend" };

      const result = filter.apply(mockData, criteria);

      expect(result.data.initiatives).toHaveLength(1);
      expect(result.data.initiatives[0].roadmapItems).toHaveLength(1);
      expect(
        result.data.initiatives[0].roadmapItems[0].releaseItems,
      ).toHaveLength(2);
    });

    it("should filter by area 'all' (no filtering)", () => {
      const criteria: FilterCriteria = { area: "all" };

      const result = filter.apply(mockData, criteria);

      expect(result.data).toEqual(mockData);
    });

    it("should filter by stages", () => {
      const criteria: FilterCriteria = { stages: ["s2"] };

      const result = filter.apply(mockData, criteria);

      expect(result.data.initiatives).toHaveLength(1);
      expect(result.data.initiatives[0].roadmapItems).toHaveLength(1);
      expect(
        result.data.initiatives[0].roadmapItems[0].releaseItems,
      ).toHaveLength(2);
    });

    it("should filter by multiple stages", () => {
      const criteria: FilterCriteria = { stages: ["s2", "s3"] };

      const result = filter.apply(mockData, criteria);

      expect(result.data.initiatives).toHaveLength(1);
      expect(result.data.initiatives[0].roadmapItems).toHaveLength(1);
      expect(
        result.data.initiatives[0].roadmapItems[0].releaseItems,
      ).toHaveLength(2);
    });

    it("should filter by assignees", () => {
      const criteria: FilterCriteria = { assignees: ["user-1"] };

      const result = filter.apply(mockData, criteria);

      expect(result.data.initiatives).toHaveLength(1);
      expect(result.data.initiatives[0].roadmapItems).toHaveLength(1);
      expect(
        result.data.initiatives[0].roadmapItems[0].releaseItems,
      ).toHaveLength(2);
    });

    it("should filter by multiple assignees", () => {
      const criteria: FilterCriteria = { assignees: ["user-1", "user-2"] };

      const result = filter.apply(mockData, criteria);

      expect(result.data.initiatives).toHaveLength(1);
      expect(result.data.initiatives[0].roadmapItems).toHaveLength(1);
      expect(
        result.data.initiatives[0].roadmapItems[0].releaseItems,
      ).toHaveLength(2);
    });

    it("should filter by cycle", () => {
      const criteria: FilterCriteria = { cycle: "cycle-1" };

      const result = filter.apply(mockData, criteria);

      expect(result.data.initiatives).toHaveLength(1);
      expect(result.data.initiatives[0].roadmapItems).toHaveLength(1);
      expect(
        result.data.initiatives[0].roadmapItems[0].releaseItems,
      ).toHaveLength(2);
    });

    it("should filter by cycle 'all' (no filtering)", () => {
      const criteria: FilterCriteria = { cycle: "all" };

      const result = filter.apply(mockData, criteria);

      expect(result.data).toEqual(mockData);
    });

    it("should filter by initiatives", () => {
      const criteria: FilterCriteria = { initiatives: ["init-1"] };

      const result = filter.apply(mockData, criteria);

      expect(result.data.initiatives).toHaveLength(1);
      expect(result.data.initiatives[0].id).toBe("init-1");
    });

    it("should filter by multiple initiatives", () => {
      const criteria: FilterCriteria = { initiatives: ["init-1", "init-2"] };

      const result = filter.apply(mockData, criteria);

      expect(result.data.initiatives).toHaveLength(1);
      expect(result.data.initiatives[0].id).toBe("init-1");
    });

    it("should return all initiatives when initiatives filter is empty array (no filter)", () => {
      // Empty array should mean "no filter" - same as undefined
      const criteria: FilterCriteria = { initiatives: [] };

      const result = filter.apply(mockData, criteria);

      // Should return all initiatives, not filter them out
      expect(result.data.initiatives).toHaveLength(mockData.initiatives.length);
      expect(result.data).toEqual(mockData);
    });

    it("should handle empty arrays for stages and assignees (no filter)", () => {
      // Empty arrays should mean "no filter"
      const criteria: FilterCriteria = {
        stages: [],
        assignees: [],
      };

      const result = filter.apply(mockData, criteria);

      // Should return all data, not filter anything out
      expect(result.data).toEqual(mockData);
    });

    it("should apply multiple filters simultaneously", () => {
      const criteria: FilterCriteria = {
        area: "frontend",
        stages: ["s2"],
        assignees: ["user-1"],
        cycle: "cycle-1",
        initiatives: ["init-1"],
      };

      const result = filter.apply(mockData, criteria);

      expect(result.data.initiatives).toHaveLength(1);
      expect(result.data.initiatives[0].roadmapItems).toHaveLength(1);
      expect(
        result.data.initiatives[0].roadmapItems[0].releaseItems,
      ).toHaveLength(2);
    });

    it("should return empty results when no items match filters", () => {
      const criteria: FilterCriteria = { area: "nonexistent" };

      const result = filter.apply(mockData, criteria);

      expect(result.data.initiatives).toHaveLength(0);
      expect(result.totalInitiatives).toBe(0);
      expect(result.totalRoadmapItems).toBe(0);
      expect(result.totalReleaseItems).toBe(0);
    });

    it("should cascade filters from release items up to initiatives", () => {
      const criteria: FilterCriteria = { stages: ["nonexistent"] };

      const result = filter.apply(mockData, criteria);

      expect(result.data.initiatives).toHaveLength(0);
    });

    it("should include roadmap items that match area filter even without matching release items", () => {
      const dataWithAreaMatch: NestedCycleData = {
        initiatives: [
          {
            ...mockData.initiatives[0],
            roadmapItems: [
              {
                ...mockData.initiatives[0].roadmapItems[0],
                area: "frontend",
                releaseItems: [
                  {
                    ...mockData.initiatives[0].roadmapItems[0].releaseItems[0],
                    stage: "s1", // Different stage
                  },
                ],
              },
            ],
          },
        ],
      };

      const criteria: FilterCriteria = { area: "frontend", stages: ["s2"] };

      const result = filter.apply(dataWithAreaMatch, criteria);

      expect(result.data.initiatives).toHaveLength(1);
      expect(result.data.initiatives[0].roadmapItems).toHaveLength(1);
      expect(
        result.data.initiatives[0].roadmapItems[0].releaseItems,
      ).toHaveLength(0);
    });
  });

  describe("applyInitiativeFilter", () => {
    it("should return original data when no initiatives specified", () => {
      const result = filter.applyInitiativeFilter(mockData, []);

      expect(result).toEqual(mockData);
    });

    it("should return original data when initiatives is null/undefined", () => {
      const result1 = filter.applyInitiativeFilter(mockData, null as any);
      const result2 = filter.applyInitiativeFilter(mockData, undefined as any);

      expect(result1).toEqual(mockData);
      expect(result2).toEqual(mockData);
    });

    it("should filter by specific initiatives", () => {
      const result = filter.applyInitiativeFilter(mockData, ["init-1"]);

      expect(result.initiatives).toHaveLength(1);
      expect(result.initiatives[0].id).toBe("init-1");
    });

    it("should filter by multiple initiatives", () => {
      const result = filter.applyInitiativeFilter(mockData, [
        "init-1",
        "init-2",
      ]);

      expect(result.initiatives).toHaveLength(1);
      expect(result.initiatives[0].id).toBe("init-1");
    });

    it("should return empty initiatives when none match", () => {
      const result = filter.applyInitiativeFilter(mockData, ["nonexistent"]);

      expect(result.initiatives).toHaveLength(0);
    });
  });

  describe("private methods (tested through public interface)", () => {
    it("should handle area filtering with string area", () => {
      const dataWithStringArea: NestedCycleData = {
        initiatives: [
          {
            ...mockData.initiatives[0],
            roadmapItems: [
              {
                ...mockData.initiatives[0].roadmapItems[0],
                area: "frontend",
                releaseItems: [
                  {
                    ...mockData.initiatives[0].roadmapItems[0].releaseItems[0],
                    area: "frontend",
                  },
                ],
              },
            ],
          },
        ],
      };

      const criteria: FilterCriteria = { area: "frontend" };

      const result = filter.apply(dataWithStringArea, criteria);

      expect(result.data.initiatives).toHaveLength(1);
      expect(result.data.initiatives[0].roadmapItems).toHaveLength(1);
    });

    it("should handle area filtering with area object", () => {
      const dataWithAreaObject: NestedCycleData = {
        initiatives: [
          {
            ...mockData.initiatives[0],
            roadmapItems: [
              {
                ...mockData.initiatives[0].roadmapItems[0],
                area: { id: "frontend", name: "Frontend", teams: [] },
                releaseItems: [
                  {
                    ...mockData.initiatives[0].roadmapItems[0].releaseItems[0],
                    area: { id: "frontend", name: "Frontend", teams: [] },
                  },
                ],
              },
            ],
          },
        ],
      };

      const criteria: FilterCriteria = { area: "frontend" };

      const result = filter.apply(dataWithAreaObject, criteria);

      expect(result.data.initiatives).toHaveLength(1);
      expect(result.data.initiatives[0].roadmapItems).toHaveLength(1);
    });

    it("should handle area filtering with areaIds array", () => {
      const dataWithAreaIds: NestedCycleData = {
        initiatives: [
          {
            ...mockData.initiatives[0],
            roadmapItems: [
              {
                ...mockData.initiatives[0].roadmapItems[0],
                releaseItems: [
                  {
                    ...mockData.initiatives[0].roadmapItems[0].releaseItems[0],
                    areaIds: ["frontend", "backend"],
                  },
                ],
              },
            ],
          },
        ],
      };

      const criteria: FilterCriteria = { area: "frontend" };

      const result = filter.apply(dataWithAreaIds, criteria);

      expect(result.data.initiatives).toHaveLength(1);
      expect(result.data.initiatives[0].roadmapItems).toHaveLength(1);
    });

    it("should handle assignee filtering with id field", () => {
      const dataWithAssigneeId: NestedCycleData = {
        initiatives: [
          {
            ...mockData.initiatives[0],
            roadmapItems: [
              {
                ...mockData.initiatives[0].roadmapItems[0],
                releaseItems: [
                  {
                    ...mockData.initiatives[0].roadmapItems[0].releaseItems[0],
                    assignee: { id: "user-1", name: "John Doe" },
                  },
                ],
              },
            ],
          },
        ],
      };

      const criteria: FilterCriteria = { assignees: ["user-1"] };

      const result = filter.apply(dataWithAssigneeId, criteria);

      expect(result.data.initiatives).toHaveLength(1);
      expect(result.data.initiatives[0].roadmapItems).toHaveLength(1);
    });

    it("should handle assignee filtering with accountId field", () => {
      const dataWithAssigneeAccountId: NestedCycleData = {
        initiatives: [
          {
            ...mockData.initiatives[0],
            roadmapItems: [
              {
                ...mockData.initiatives[0].roadmapItems[0],
                releaseItems: [
                  {
                    ...mockData.initiatives[0].roadmapItems[0].releaseItems[0],
                    assignee: { accountId: "user-1", displayName: "John Doe" },
                  },
                ],
              },
            ],
          },
        ],
      };

      const criteria: FilterCriteria = { assignees: ["user-1"] };

      const result = filter.apply(dataWithAssigneeAccountId, criteria);

      expect(result.data.initiatives).toHaveLength(1);
      expect(result.data.initiatives[0].roadmapItems).toHaveLength(1);
    });

    it("should handle assignee filtering with no assignee", () => {
      const dataWithNoAssignee: NestedCycleData = {
        initiatives: [
          {
            ...mockData.initiatives[0],
            roadmapItems: [
              {
                ...mockData.initiatives[0].roadmapItems[0],
                releaseItems: [
                  {
                    ...mockData.initiatives[0].roadmapItems[0].releaseItems[0],
                    assignee: null,
                  },
                ],
              },
            ],
          },
        ],
      };

      const criteria: FilterCriteria = { assignees: ["user-1"] };

      const result = filter.apply(dataWithNoAssignee, criteria);

      expect(result.data.initiatives).toHaveLength(0);
    });

    it("should handle cycle filtering", () => {
      const dataWithCycle: NestedCycleData = {
        initiatives: [
          {
            ...mockData.initiatives[0],
            roadmapItems: [
              {
                ...mockData.initiatives[0].roadmapItems[0],
                releaseItems: [
                  {
                    ...mockData.initiatives[0].roadmapItems[0].releaseItems[0],
                    cycleId: "cycle-1",
                  },
                ],
              },
            ],
          },
        ],
      };

      const criteria: FilterCriteria = { cycle: "cycle-1" };

      const result = filter.apply(dataWithCycle, criteria);

      expect(result.data.initiatives).toHaveLength(1);
      expect(result.data.initiatives[0].roadmapItems).toHaveLength(1);
    });

    it("should handle cycle filtering with no cycleId", () => {
      const dataWithNoCycle: NestedCycleData = {
        initiatives: [
          {
            ...mockData.initiatives[0],
            roadmapItems: [
              {
                ...mockData.initiatives[0].roadmapItems[0],
                releaseItems: [
                  {
                    ...mockData.initiatives[0].roadmapItems[0].releaseItems[0],
                    cycleId: null,
                  },
                ],
              },
            ],
          },
        ],
      };

      const criteria: FilterCriteria = { cycle: "cycle-1" };

      const result = filter.apply(dataWithNoCycle, criteria);

      expect(result.data.initiatives).toHaveLength(0);
    });
  });
});
