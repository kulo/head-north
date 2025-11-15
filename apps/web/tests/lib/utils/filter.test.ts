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
  createTestCycleItemCollection,
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

      expect(result1.data.objectives).toEqual([]);
      expect(result1.totalObjectives).toBe(0);
      expect(result1.totalRoadmapItems).toBe(0);
      expect(result1.totalCycleItems).toBe(0);
      expect(result2).toEqual(result1);
    });

    it("should return original data when no filters applied", () => {
      const result = filter.apply(mockData, {});

      expect(result.data).toEqual(mockData);
      expect(result.appliedFilters).toEqual({});
      expect(result.totalObjectives).toBe(1);
      expect(result.totalRoadmapItems).toBe(1);
      expect(result.totalCycleItems).toBe(2);
    });

    it("should filter by product area", () => {
      const criteria: FilterCriteria = { area: "frontend" };

      const result = filter.apply(mockData, criteria);

      expect(result.data.objectives).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems[0].cycleItems).toHaveLength(
        2,
      );
    });

    it("should filter by product area 'all' (no filtering)", () => {
      const criteria: FilterCriteria = { area: "all" };

      const result = filter.apply(mockData, criteria);

      expect(result.data).toEqual(mockData);
    });

    it("should filter by release stages", () => {
      const criteria: FilterCriteria = { stages: ["s2"] };

      const result = filter.apply(mockData, criteria);

      expect(result.data.objectives).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems[0].cycleItems).toHaveLength(
        2,
      );
    });

    it("should filter by multiple stages", () => {
      const criteria: FilterCriteria = { stages: ["s2", "s3"] };

      const result = filter.apply(mockData, criteria);

      expect(result.data.objectives).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems[0].cycleItems).toHaveLength(
        2,
      );
    });

    it("should filter by assignees", () => {
      const criteria: FilterCriteria = { assignees: ["user-1"] };

      const result = filter.apply(mockData, criteria);

      expect(result.data.objectives).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems[0].cycleItems).toHaveLength(
        2,
      );
    });

    it("should filter by multiple assignees", () => {
      const criteria: FilterCriteria = { assignees: ["user-1", "user-2"] };

      const result = filter.apply(mockData, criteria);

      expect(result.data.objectives).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems[0].cycleItems).toHaveLength(
        2,
      );
    });

    it("should filter by cycle", () => {
      const criteria: FilterCriteria = { cycle: "cycle-1" };

      const result = filter.apply(mockData, criteria);

      expect(result.data.objectives).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems[0].cycleItems).toHaveLength(
        2,
      );
    });

    it("should filter by cycle 'all' (no filtering)", () => {
      const criteria: FilterCriteria = { cycle: "all" };

      const result = filter.apply(mockData, criteria);

      expect(result.data).toEqual(mockData);
    });

    it("should filter by objectives", () => {
      const criteria: FilterCriteria = { objectives: ["obj-1"] };

      const result = filter.apply(mockData, criteria);

      expect(result.data.objectives).toHaveLength(1);
      expect(result.data.objectives[0].id).toBe("obj-1");
    });

    it("should filter by multiple objectives", () => {
      const criteria: FilterCriteria = { objectives: ["obj-1", "obj-2"] };

      const result = filter.apply(mockData, criteria);

      expect(result.data.objectives).toHaveLength(1);
      expect(result.data.objectives[0].id).toBe("obj-1");
    });

    it("should return all objectives when objectives filter is empty array (no filter)", () => {
      // Empty array should mean "no filter" - same as undefined
      const criteria: FilterCriteria = { objectives: [] };

      const result = filter.apply(mockData, criteria);

      // Should return all objectives, not filter them out
      expect(result.data.objectives).toHaveLength(mockData.objectives.length);
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
        objectives: ["obj-1"],
      };

      const result = filter.apply(mockData, criteria);

      expect(result.data.objectives).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems[0].cycleItems).toHaveLength(
        2,
      );
    });

    it("should return empty results when no items match filters", () => {
      const criteria: FilterCriteria = { area: "nonexistent" };

      const result = filter.apply(mockData, criteria);

      expect(result.data.objectives).toHaveLength(0);
      expect(result.totalObjectives).toBe(0);
      expect(result.totalRoadmapItems).toBe(0);
      expect(result.totalCycleItems).toBe(0);
    });

    it("should cascade filters from cycle items up to objectives", () => {
      const criteria: FilterCriteria = { stages: ["nonexistent"] };

      const result = filter.apply(mockData, criteria);

      expect(result.data.objectives).toHaveLength(0);
    });

    it("should include roadmap items that match product area filter even without matching cycle items", () => {
      const dataWithAreaMatch: NestedCycleData = {
        objectives: [
          {
            ...mockData.objectives[0],
            roadmapItems: [
              {
                ...mockData.objectives[0].roadmapItems[0],
                area: "frontend",
                cycleItems: [
                  {
                    ...mockData.objectives[0].roadmapItems[0].cycleItems[0],
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

      expect(result.data.objectives).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems[0].cycleItems).toHaveLength(
        0,
      );
    });
  });

  describe("applyObjectiveFilter", () => {
    it("should return original data when no objectives specified", () => {
      const result = filter.applyObjectiveFilter(mockData, []);

      expect(result).toEqual(mockData);
    });

    it("should return original data when objectives is null/undefined", () => {
      const result1 = filter.applyObjectiveFilter(mockData, null as any);
      const result2 = filter.applyObjectiveFilter(mockData, undefined as any);

      expect(result1).toEqual(mockData);
      expect(result2).toEqual(mockData);
    });

    it("should filter by specific objectives", () => {
      const result = filter.applyObjectiveFilter(mockData, ["obj-1"]);

      expect(result.objectives).toHaveLength(1);
      expect(result.objectives[0].id).toBe("obj-1");
    });

    it("should filter by multiple objectives", () => {
      const result = filter.applyObjectiveFilter(mockData, ["obj-1", "obj-2"]);

      expect(result.objectives).toHaveLength(1);
      expect(result.objectives[0].id).toBe("obj-1");
    });

    it("should return empty objectives when none match", () => {
      const result = filter.applyObjectiveFilter(mockData, ["nonexistent"]);

      expect(result.objectives).toHaveLength(0);
    });
  });

  describe("private methods (tested through public interface)", () => {
    it("should handle product area filtering with string area", () => {
      const dataWithStringArea: NestedCycleData = {
        objectives: [
          {
            ...mockData.objectives[0],
            roadmapItems: [
              {
                ...mockData.objectives[0].roadmapItems[0],
                area: "frontend",
                cycleItems: [
                  {
                    ...mockData.objectives[0].roadmapItems[0].cycleItems[0],
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

      expect(result.data.objectives).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems).toHaveLength(1);
    });

    it("should handle product area filtering with area object", () => {
      const dataWithAreaObject: NestedCycleData = {
        objectives: [
          {
            ...mockData.objectives[0],
            roadmapItems: [
              {
                ...mockData.objectives[0].roadmapItems[0],
                area: { id: "frontend", name: "Frontend", teams: [] },
                cycleItems: [
                  {
                    ...mockData.objectives[0].roadmapItems[0].cycleItems[0],
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

      expect(result.data.objectives).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems).toHaveLength(1);
    });

    it("should handle product area filtering with areaIds array", () => {
      const dataWithAreaIds: NestedCycleData = {
        objectives: [
          {
            ...mockData.objectives[0],
            roadmapItems: [
              {
                ...mockData.objectives[0].roadmapItems[0],
                cycleItems: [
                  {
                    ...mockData.objectives[0].roadmapItems[0].cycleItems[0],
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

      expect(result.data.objectives).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems).toHaveLength(1);
    });

    it("should handle assignee filtering with id field", () => {
      const dataWithAssigneeId: NestedCycleData = {
        objectives: [
          {
            ...mockData.objectives[0],
            roadmapItems: [
              {
                ...mockData.objectives[0].roadmapItems[0],
                cycleItems: [
                  {
                    ...mockData.objectives[0].roadmapItems[0].cycleItems[0],
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

      expect(result.data.objectives).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems).toHaveLength(1);
    });

    it("should handle assignee filtering with accountId field", () => {
      const dataWithAssigneeAccountId: NestedCycleData = {
        objectives: [
          {
            ...mockData.objectives[0],
            roadmapItems: [
              {
                ...mockData.objectives[0].roadmapItems[0],
                cycleItems: [
                  {
                    ...mockData.objectives[0].roadmapItems[0].cycleItems[0],
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

      expect(result.data.objectives).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems).toHaveLength(1);
    });

    it("should handle assignee filtering with no assignee", () => {
      const dataWithNoAssignee: NestedCycleData = {
        objectives: [
          {
            ...mockData.objectives[0],
            roadmapItems: [
              {
                ...mockData.objectives[0].roadmapItems[0],
                cycleItems: [
                  {
                    ...mockData.objectives[0].roadmapItems[0].cycleItems[0],
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

      expect(result.data.objectives).toHaveLength(0);
    });

    it("should handle cycle filtering", () => {
      const dataWithCycle: NestedCycleData = {
        objectives: [
          {
            ...mockData.objectives[0],
            roadmapItems: [
              {
                ...mockData.objectives[0].roadmapItems[0],
                cycleItems: [
                  {
                    ...mockData.objectives[0].roadmapItems[0].cycleItems[0],
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

      expect(result.data.objectives).toHaveLength(1);
      expect(result.data.objectives[0].roadmapItems).toHaveLength(1);
    });

    it("should handle cycle filtering with no cycleId", () => {
      const dataWithNoCycle: NestedCycleData = {
        objectives: [
          {
            ...mockData.objectives[0],
            roadmapItems: [
              {
                ...mockData.objectives[0].roadmapItems[0],
                cycleItems: [
                  {
                    ...mockData.objectives[0].roadmapItems[0].cycleItems[0],
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

      expect(result.data.objectives).toHaveLength(0);
    });
  });
});
