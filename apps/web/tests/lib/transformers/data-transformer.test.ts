/**
 * Tests for data-transformer.ts
 *
 * Tests the DataTransformer class that handles data transformation and filtering.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { DataTransformer } from "../../../src/lib/transformers/data-transformer";
import {
  createMockCycleData,
  createEmptyCycleData,
  createMockCycleDataWithMixedStatuses,
  createMockNestedCycleData,
} from "../../fixtures/cycle-data-fixtures";
import type {
  FilterCriteria,
  RoadmapItemWithProgress,
} from "../../../src/types/ui-types";
import { CycleData } from "@omega/types";

// Mock the filter module
vi.mock("../../../src/lib/utils/filter", () => ({
  filter: {
    apply: vi.fn((data, criteria) => ({
      data,
      appliedFilters: criteria,
      totalInitiatives: data.initiatives?.length || 0,
      totalRoadmapItems: 0,
      totalReleaseItems: 0,
    })),
  },
}));

// Mock the cycle selector
vi.mock("../../../src/lib/selectors/cycle-selector", () => ({
  selectDefaultCycle: vi.fn((cycles) => cycles?.[0] || null),
}));

// Mock the cycle progress calculator
vi.mock("../../../src/lib/cycle-progress-calculator", () => ({
  calculateCycleProgress: vi.fn((cycle, initiatives) => ({
    ...cycle,
    weeks: 10,
    weeksDone: 5,
    weeksInProgress: 3,
    weeksTodo: 2,
    weeksNotToDo: 0,
    weeksCancelled: 0,
    weeksPostponed: 0,
    releaseItemsCount: 5,
    releaseItemsDoneCount: 3,
    progress: 50,
    progressWithInProgress: 80,
    progressByReleaseItems: 60,
    percentageNotToDo: 0,
    startMonth: "Jan",
    endMonth: "Mar",
    daysFromStartOfCycle: 15,
    daysInCycle: 90,
    currentDayPercentage: 17,
  })),
}));

describe("DataTransformer", () => {
  describe("transformToNestedStructure", () => {
    it("should transform raw cycle data to nested structure", () => {
      const rawData = createMockCycleData();

      const result = DataTransformer.transformToNestedStructure(rawData);

      expect(result.initiatives).toHaveLength(2);
      expect(result.initiatives[0].id).toBe("init-1");
      expect(result.initiatives[0].name).toBe("Platform Initiative");
      expect(result.initiatives[0].roadmapItems).toHaveLength(1);
      expect(result.initiatives[0].roadmapItems[0].id).toBe("ROADMAP-001");
    });

    it("should handle empty cycle data", () => {
      const rawData = createEmptyCycleData();

      const result = DataTransformer.transformToNestedStructure(rawData);

      expect(result.initiatives).toHaveLength(0);
    });

    it("should handle cycle data with missing initiatives", () => {
      const rawData = {
        ...createMockCycleData(),
        initiatives: null,
      };

      const result = DataTransformer.transformToNestedStructure(rawData);

      expect(result.initiatives).toHaveLength(2);
      expect(result.initiatives[0].name).toBe("Unassigned Initiative");
    });

    it("should handle cycle data with non-array initiatives", () => {
      const rawData = {
        ...createMockCycleData(),
        initiatives: "not-an-array" as any,
      };

      const result = DataTransformer.transformToNestedStructure(rawData);

      expect(result.initiatives).toHaveLength(2);
      expect(result.initiatives[0].name).toBe("Unassigned Initiative");
    });

    it("should group roadmap items by initiative", () => {
      const rawData = createMockCycleData();

      const result = DataTransformer.transformToNestedStructure(rawData);

      expect(result.initiatives).toHaveLength(2);
      expect(result.initiatives[0].roadmapItems).toHaveLength(1);
      expect(result.initiatives[1].roadmapItems).toHaveLength(1);
    });

    it("should handle roadmap items with missing initiativeId", () => {
      const rawData = {
        ...createMockCycleData(),
        roadmapItems: [
          {
            ...createMockCycleData().roadmapItems[0],
            initiativeId: null,
          },
        ],
      };

      const result = DataTransformer.transformToNestedStructure(rawData);

      expect(result.initiatives).toHaveLength(1);
      expect(result.initiatives[0].id).toBe("unassigned");
      expect(result.initiatives[0].name).toBe("Unassigned Initiative");
    });

    it("should handle roadmap items with undefined initiativeId", () => {
      const rawData = {
        ...createMockCycleData(),
        roadmapItems: [
          {
            ...createMockCycleData().roadmapItems[0],
            initiativeId: undefined,
          },
        ],
      };

      const result = DataTransformer.transformToNestedStructure(rawData);

      expect(result.initiatives).toHaveLength(1);
      expect(result.initiatives[0].id).toBe("unassigned");
      expect(result.initiatives[0].name).toBe("Unassigned Initiative");
    });

    it("should calculate progress metrics for roadmap items", () => {
      const rawData = createMockCycleDataWithMixedStatuses();

      const result = DataTransformer.transformToNestedStructure(rawData);

      expect(
        (result.initiatives[0].roadmapItems[0] as RoadmapItemWithProgress)
          .weeks,
      ).toBeGreaterThan(0);
      expect(
        (result.initiatives[0].roadmapItems[0] as RoadmapItemWithProgress)
          .progress,
      ).toBeGreaterThanOrEqual(0);
      expect(
        (result.initiatives[0].roadmapItems[0] as RoadmapItemWithProgress)
          .progress,
      ).toBeLessThanOrEqual(100);
    });

    it("should aggregate progress metrics to initiative level", () => {
      const rawData = createMockCycleDataWithMixedStatuses();

      const result = DataTransformer.transformToNestedStructure(rawData);

      expect(result.initiatives[0].weeks).toBeGreaterThan(0);
      expect(result.initiatives[0].progress).toBeGreaterThanOrEqual(0);
      expect(result.initiatives[0].progress).toBeLessThanOrEqual(100);
    });

    it("should sort initiatives by weeks (largest first)", () => {
      const rawData = createMockCycleDataWithMixedStatuses();

      const result = DataTransformer.transformToNestedStructure(rawData);

      if (result.initiatives.length > 1) {
        expect(result.initiatives[0].weeks).toBeGreaterThanOrEqual(
          result.initiatives[1].weeks,
        );
      }
    });

    it("should handle roadmap items with string area", () => {
      const rawData = {
        ...createMockCycleData(),
        roadmapItems: [
          {
            ...createMockCycleData().roadmapItems[0],
            area: "frontend",
          },
        ],
      };

      const result = DataTransformer.transformToNestedStructure(rawData);

      expect(result.initiatives[0].roadmapItems[0].area).toBe("frontend");
    });

    it("should handle roadmap items with area object", () => {
      const rawData = {
        ...createMockCycleData(),
        roadmapItems: [
          {
            ...createMockCycleData().roadmapItems[0],
            area: { id: "frontend", name: "Frontend", teams: [] },
          },
        ],
      };

      const result = DataTransformer.transformToNestedStructure(rawData);

      expect(result.initiatives[0].roadmapItems[0].area).toBe("Frontend");
    });

    it("should handle roadmap items with missing area", () => {
      const rawData = {
        ...createMockCycleData(),
        roadmapItems: [
          {
            ...createMockCycleData().roadmapItems[0],
            area: null,
          },
        ],
      };

      const result = DataTransformer.transformToNestedStructure(rawData);

      expect(result.initiatives[0].roadmapItems[0].area).toBe("");
    });

    it("should handle roadmap items with string theme", () => {
      const rawData = {
        ...createMockCycleData(),
        roadmapItems: [
          {
            ...createMockCycleData().roadmapItems[0],
            theme: "platform",
          },
        ],
      };

      const result = DataTransformer.transformToNestedStructure(rawData);

      expect(result.initiatives[0].roadmapItems[0].theme).toBe("platform");
    });

    it("should handle roadmap items with missing theme", () => {
      const rawData = {
        ...createMockCycleData(),
        roadmapItems: [
          {
            ...createMockCycleData().roadmapItems[0],
            theme: null,
          },
        ],
      };

      const result = DataTransformer.transformToNestedStructure(rawData);

      expect(result.initiatives[0].roadmapItems[0].theme).toBe("");
    });

    it("should handle roadmap items with array validations", () => {
      const rawData: CycleData = {
        ...createMockCycleData(),
        roadmapItems: [
          {
            ...createMockCycleData().roadmapItems[0],
            validations: [
              {
                id: "val-1",
                name: "Test validation",
                status: "warning",
                description: "Test validation description",
              },
            ],
          },
        ],
      };

      const result = DataTransformer.transformToNestedStructure(rawData);

      expect(result.initiatives[0].roadmapItems[0].validations).toEqual([
        {
          id: "val-1",
          name: "Test validation",
          status: "warning",
          description: "Test validation description",
        },
      ]);
    });

    it("should handle roadmap items with non-array validations", () => {
      const rawData = {
        ...createMockCycleData(),
        roadmapItems: [
          {
            ...createMockCycleData().roadmapItems[0],
            validations: "not-an-array" as any,
          },
        ],
      };

      const result = DataTransformer.transformToNestedStructure(rawData);

      expect(result.initiatives[0].roadmapItems[0].validations).toEqual([]);
    });
  });

  describe("applyInitiativeFilter", () => {
    it("should return original data when no initiatives specified", () => {
      const data = createMockNestedCycleData();

      const result = DataTransformer.applyInitiativeFilter(data, []);

      expect(result).toEqual(data);
    });

    it("should return original data when initiatives is null/undefined", () => {
      const data = createMockNestedCycleData();

      const result1 = DataTransformer.applyInitiativeFilter(data, null as any);
      const result2 = DataTransformer.applyInitiativeFilter(
        data,
        undefined as any,
      );

      expect(result1).toEqual(data);
      expect(result2).toEqual(data);
    });

    it("should filter by specific initiatives", () => {
      const data = createMockNestedCycleData();

      const result = DataTransformer.applyInitiativeFilter(data, ["init-1"]);

      expect(result.initiatives).toHaveLength(1);
      expect(result.initiatives[0].id).toBe("init-1");
    });

    it("should filter by multiple initiatives", () => {
      const data = createMockNestedCycleData();

      const result = DataTransformer.applyInitiativeFilter(data, [
        "init-1",
        "init-2",
      ]);

      expect(result.initiatives).toHaveLength(1);
      expect(result.initiatives[0].id).toBe("init-1");
    });

    it("should return empty initiatives when none match", () => {
      const data = createMockNestedCycleData();

      const result = DataTransformer.applyInitiativeFilter(data, [
        "nonexistent",
      ]);

      expect(result.initiatives).toHaveLength(0);
    });
  });

  describe("processCycleData", () => {
    it("should process cycle data with no filters", () => {
      const rawData = createMockCycleData();

      const result = DataTransformer.processCycleData(rawData);

      expect(result.initiatives).toHaveLength(2);
    });

    it("should process cycle data with initiative filter", () => {
      const rawData = createMockCycleData();
      const filters: FilterCriteria = { initiatives: ["init-1"] };

      const result = DataTransformer.processCycleData(rawData, filters);

      expect(result.initiatives).toHaveLength(1);
      expect(result.initiatives[0].id).toBe("init-1");
    });

    it("should process cycle data with multiple filters", () => {
      const rawData = createMockCycleData();
      const filters: FilterCriteria = {
        initiatives: ["init-1"],
        area: "frontend",
        stages: ["s2"],
      };

      const result = DataTransformer.processCycleData(rawData, filters);

      expect(result.initiatives).toHaveLength(1);
      expect(result.initiatives[0].id).toBe("init-1");
    });

    it("should handle empty raw data", () => {
      const rawData = createEmptyCycleData();

      const result = DataTransformer.processCycleData(rawData);

      expect(result.initiatives).toHaveLength(0);
    });
  });

  describe("generateRoadmapData", () => {
    it("should generate roadmap data from processed data", () => {
      const rawData = createMockCycleData();
      const processedData = createMockNestedCycleData();

      const result = DataTransformer.generateRoadmapData(
        rawData,
        processedData,
      );

      expect(result.orderedCycles).toEqual(rawData.cycles);
      expect(result.roadmapItems).toEqual([]);
      expect(result.activeCycle).toEqual(rawData.cycles[0]);
      expect(result.initiatives).toEqual(processedData.initiatives);
    });

    it("should handle null processed data", () => {
      const rawData = createMockCycleData();

      const result = DataTransformer.generateRoadmapData(rawData, null);

      expect(result.orderedCycles).toEqual([]);
      expect(result.roadmapItems).toEqual([]);
      expect(result.activeCycle).toBeNull();
      expect(result.initiatives).toEqual([]);
    });

    it("should handle null raw data", () => {
      const processedData = createMockNestedCycleData();

      const result = DataTransformer.generateRoadmapData(null, processedData);

      expect(result.orderedCycles).toEqual([]);
      expect(result.roadmapItems).toEqual([]);
      expect(result.activeCycle).toBeNull();
      expect(result.initiatives).toEqual(processedData.initiatives);
    });

    it("should handle both null data", () => {
      const result = DataTransformer.generateRoadmapData(null, null);

      expect(result.orderedCycles).toEqual([]);
      expect(result.roadmapItems).toEqual([]);
      expect(result.activeCycle).toBeNull();
      expect(result.initiatives).toEqual([]);
    });
  });

  describe("generateCycleOverviewData", () => {
    it("should generate cycle overview data", () => {
      const rawData = createMockCycleData();
      const processedData = createMockNestedCycleData();

      const result = DataTransformer.generateCycleOverviewData(
        rawData,
        processedData,
      );

      expect(result).not.toBeNull();
      expect(result!.cycle).toEqual(rawData.cycles[0]);
      expect(result!.initiatives).toEqual(processedData.initiatives);
    });

    it("should return null for null processed data", () => {
      const rawData = createMockCycleData();

      const result = DataTransformer.generateCycleOverviewData(rawData, null);

      expect(result).toBeNull();
    });

    it("should return null for null raw data", () => {
      const processedData = createMockNestedCycleData();

      const result = DataTransformer.generateCycleOverviewData(
        null,
        processedData,
      );

      expect(result).toBeNull();
    });

    it("should return null for empty cycles", () => {
      const rawData = { ...createMockCycleData(), cycles: [] };
      const processedData = createMockNestedCycleData();

      const result = DataTransformer.generateCycleOverviewData(
        rawData,
        processedData,
      );

      expect(result).toBeNull();
    });

    it("should return null for null cycles", () => {
      const rawData = { ...createMockCycleData(), cycles: null as any };
      const processedData = createMockNestedCycleData();

      const result = DataTransformer.generateCycleOverviewData(
        rawData,
        processedData,
      );

      expect(result).toBeNull();
    });
  });

  describe("generateFilteredRoadmapData", () => {
    it("should generate filtered roadmap data", () => {
      const rawData = createMockCycleData();
      const processedData = createMockNestedCycleData();
      const filters: FilterCriteria = { area: "frontend" };

      const result = DataTransformer.generateFilteredRoadmapData(
        rawData,
        processedData,
        filters,
      );

      expect(result.orderedCycles).toEqual(rawData.cycles);
      expect(result.roadmapItems).toEqual([]);
      expect(result.activeCycle).toEqual(rawData.cycles[0]);
      expect(result.initiatives).toEqual(processedData.initiatives);
    });

    it("should handle null processed data", () => {
      const rawData = createMockCycleData();
      const filters: FilterCriteria = { area: "frontend" };

      const result = DataTransformer.generateFilteredRoadmapData(
        rawData,
        null,
        filters,
      );

      expect(result.orderedCycles).toEqual([]);
      expect(result.roadmapItems).toEqual([]);
      expect(result.activeCycle).toBeNull();
      expect(result.initiatives).toEqual([]);
    });
  });

  describe("generateFilteredCycleOverviewData", () => {
    it("should generate filtered cycle overview data", () => {
      const rawData = createMockCycleData();
      const processedData = createMockNestedCycleData();
      const filters: FilterCriteria = { area: "frontend" };

      const result = DataTransformer.generateFilteredCycleOverviewData(
        rawData,
        processedData,
        filters,
      );

      expect(result).not.toBeNull();
      // The cycle should have calculated metadata, not just raw data
      expect(result!.cycle.id).toBe(rawData.cycles[0].id);
      expect(result!.cycle.name).toBe(rawData.cycles[0].name);
      expect(result!.cycle.start).toBe(rawData.cycles[0].start);
      expect(result!.cycle.end).toBe(rawData.cycles[0].end);
      expect(result!.cycle.delivery).toBe(rawData.cycles[0].delivery);
      expect(result!.cycle.state).toBe(rawData.cycles[0].state);
      // Should have calculated fields
      expect(result!.cycle).toHaveProperty("currentDayPercentage");
      expect(result!.cycle).toHaveProperty("daysFromStartOfCycle");
      expect(result!.cycle).toHaveProperty("daysInCycle");
      expect(result!.cycle).toHaveProperty("startMonth");
      expect(result!.cycle).toHaveProperty("endMonth");
      expect(result!.initiatives).toEqual(processedData.initiatives);
    });

    it("should return null for null processed data", () => {
      const rawData = createMockCycleData();
      const filters: FilterCriteria = { area: "frontend" };

      const result = DataTransformer.generateFilteredCycleOverviewData(
        rawData,
        null,
        filters,
      );

      expect(result).toBeNull();
    });

    it("should return null for null raw data", () => {
      const processedData = createMockNestedCycleData();
      const filters: FilterCriteria = { area: "frontend" };

      const result = DataTransformer.generateFilteredCycleOverviewData(
        null,
        processedData,
        filters,
      );

      expect(result).toBeNull();
    });

    it("should return null for empty cycles", () => {
      const rawData = { ...createMockCycleData(), cycles: [] };
      const processedData = createMockNestedCycleData();
      const filters: FilterCriteria = { area: "frontend" };

      const result = DataTransformer.generateFilteredCycleOverviewData(
        rawData,
        processedData,
        filters,
      );

      expect(result).toBeNull();
    });
  });
});
