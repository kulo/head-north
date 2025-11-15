/**
 * Tests for data-transformer.ts
 *
 * Tests the DataTransformer class that handles data transformation and filtering.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { dataTransformer } from "../../../src/lib/transformers/data-transformer";
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
import { CycleData } from "@headnorth/types";
import type { default as HeadNorthConfig } from "@headnorth/config";

// Mock the filter module
vi.mock("../../../src/lib/utils/filter", () => ({
  filter: {
    apply: vi.fn((data, criteria) => ({
      data,
      appliedFilters: criteria,
      totalObjectives: data.objectives?.length || 0,
      totalRoadmapItems: 0,
      totalCycleItems: 0,
    })),
  },
}));

// Mock config
const mockConfig: HeadNorthConfig = {
  getValidationDictionary: vi.fn(() => ({
    cycleItem: {
      missingAssignee: { label: "Missing assignee", reference: "ref1" },
      missingAreaLabel: { label: "Missing area label", reference: "ref2" },
    },
    roadmapItem: {
      missingThemeLabel: { label: "Missing theme label", reference: "ref3" },
    },
  })),
} as unknown as HeadNorthConfig;

// Mock the cycle selector
vi.mock("../../../src/lib/selectors/cycle-selector", () => ({
  selectDefaultCycle: vi.fn((cycles) => cycles?.[0] || null),
}));

// Mock the cycle progress calculator
vi.mock("../../../src/lib/cycle-progress-calculator", () => ({
  calculateCycleProgress: vi.fn((cycle, objectives) => ({
    ...cycle,
    weeks: 10,
    weeksDone: 5,
    weeksInProgress: 3,
    weeksTodo: 2,
    weeksNotToDo: 0,
    weeksCancelled: 0,
    weeksPostponed: 0,
    cycleItemsCount: 5,
    cycleItemsDoneCount: 3,
    progress: 50,
    progressWithInProgress: 80,
    progressByCycleItems: 60,
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

      const result = dataTransformer.transformToNestedStructure(
        mockConfig,
        rawData,
      );

      expect(result.objectives).toHaveLength(2);
      expect(result.objectives[0].id).toBe("obj-1");
      expect(result.objectives[0].name).toBe("Platform Objective");
      expect(result.objectives[0].roadmapItems).toHaveLength(1);
      expect(result.objectives[0].roadmapItems[0].id).toBe("ROADMAP-001");
    });

    it("should handle empty cycle data", () => {
      const rawData = createEmptyCycleData();

      const result = dataTransformer.transformToNestedStructure(
        mockConfig,
        rawData,
      );

      expect(result.objectives).toHaveLength(0);
    });

    it("should handle cycle data with missing objectives", () => {
      const rawData = {
        ...createMockCycleData(),
        objectives: null,
      };

      const result = dataTransformer.transformToNestedStructure(
        mockConfig,
        rawData,
      );

      expect(result.objectives).toHaveLength(2);
      expect(result.objectives[0].name).toBe("Unassigned Objective");
    });

    it("should handle cycle data with non-array objectives", () => {
      const rawData = {
        ...createMockCycleData(),
        objectives: "not-an-array" as any,
      };

      const result = dataTransformer.transformToNestedStructure(
        mockConfig,
        rawData,
      );

      expect(result.objectives).toHaveLength(2);
      expect(result.objectives[0].name).toBe("Unassigned Objective");
    });

    it("should group roadmap items by objective", () => {
      const rawData = createMockCycleData();

      const result = dataTransformer.transformToNestedStructure(
        mockConfig,
        rawData,
      );

      expect(result.objectives).toHaveLength(2);
      expect(result.objectives[0].roadmapItems).toHaveLength(1);
      expect(result.objectives[1].roadmapItems).toHaveLength(1);
    });

    it("should handle roadmap items with missing objectiveId", () => {
      const rawData = {
        ...createMockCycleData(),
        roadmapItems: [
          {
            ...createMockCycleData().roadmapItems[0],
            objectiveId: null,
          },
        ],
      };

      const result = dataTransformer.transformToNestedStructure(
        mockConfig,
        rawData,
      );

      expect(result.objectives).toHaveLength(1);
      expect(result.objectives[0].id).toBe("unassigned");
      expect(result.objectives[0].name).toBe("Unassigned Objective");
    });

    it("should handle roadmap items with undefined objectiveId", () => {
      const rawData = {
        ...createMockCycleData(),
        roadmapItems: [
          {
            ...createMockCycleData().roadmapItems[0],
            objectiveId: undefined,
          },
        ],
      };

      const result = dataTransformer.transformToNestedStructure(
        mockConfig,
        rawData,
      );

      expect(result.objectives).toHaveLength(1);
      expect(result.objectives[0].id).toBe("unassigned");
      expect(result.objectives[0].name).toBe("Unassigned Objective");
    });

    it("should calculate progress metrics for roadmap items", () => {
      const rawData = createMockCycleDataWithMixedStatuses();

      const result = dataTransformer.transformToNestedStructure(
        mockConfig,
        rawData,
      );

      expect(
        (result.objectives[0].roadmapItems[0] as RoadmapItemWithProgress).weeks,
      ).toBeGreaterThan(0);
      expect(
        (result.objectives[0].roadmapItems[0] as RoadmapItemWithProgress)
          .progress,
      ).toBeGreaterThanOrEqual(0);
      expect(
        (result.objectives[0].roadmapItems[0] as RoadmapItemWithProgress)
          .progress,
      ).toBeLessThanOrEqual(100);
    });

    it("should aggregate progress metrics to objective level", () => {
      const rawData = createMockCycleDataWithMixedStatuses();

      const result = dataTransformer.transformToNestedStructure(
        mockConfig,
        rawData,
      );

      expect(result.objectives[0].weeks).toBeGreaterThan(0);
      expect(result.objectives[0].progress).toBeGreaterThanOrEqual(0);
      expect(result.objectives[0].progress).toBeLessThanOrEqual(100);
    });

    it("should sort objectives by weeks (largest first)", () => {
      const rawData = createMockCycleDataWithMixedStatuses();

      const result = dataTransformer.transformToNestedStructure(
        mockConfig,
        rawData,
      );

      if (result.objectives.length > 1) {
        expect(result.objectives[0].weeks).toBeGreaterThanOrEqual(
          result.objectives[1].weeks,
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

      const result = dataTransformer.transformToNestedStructure(
        mockConfig,
        rawData,
      );

      expect(result.objectives[0].roadmapItems[0].area).toBe("frontend");
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

      const result = dataTransformer.transformToNestedStructure(
        mockConfig,
        rawData,
      );

      expect(result.objectives[0].roadmapItems[0].area).toBe("Frontend");
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

      const result = dataTransformer.transformToNestedStructure(
        mockConfig,
        rawData,
      );

      expect(result.objectives[0].roadmapItems[0].area).toBe("");
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

      const result = dataTransformer.transformToNestedStructure(
        mockConfig,
        rawData,
      );

      expect(result.objectives[0].roadmapItems[0].theme).toBe("platform");
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

      const result = dataTransformer.transformToNestedStructure(
        mockConfig,
        rawData,
      );

      expect(result.objectives[0].roadmapItems[0].theme).toBe("");
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
                code: "testValidation",
                name: "Test validation",
                status: "warning",
                description: "Test validation description",
              },
            ],
          },
        ],
      };

      const result = dataTransformer.transformToNestedStructure(
        mockConfig,
        rawData,
      );

      expect(result.objectives[0].roadmapItems[0].validations).toEqual([
        {
          id: "val-1",
          code: "testValidation",
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

      const result = dataTransformer.transformToNestedStructure(
        mockConfig,
        rawData,
      );

      expect(result.objectives[0].roadmapItems[0].validations).toEqual([]);
    });
  });

  describe("applyObjectiveFilter", () => {
    it("should return original data when no objectives specified", () => {
      const data = createMockNestedCycleData();

      const result = dataTransformer.applyObjectiveFilter(data, []);

      expect(result).toEqual(data);
    });

    it("should return original data when objectives is null/undefined", () => {
      const data = createMockNestedCycleData();

      const result1 = dataTransformer.applyObjectiveFilter(data, null as any);
      const result2 = dataTransformer.applyObjectiveFilter(
        data,
        undefined as any,
      );

      expect(result1).toEqual(data);
      expect(result2).toEqual(data);
    });

    it("should filter by specific objectives", () => {
      const data = createMockNestedCycleData();

      const result = dataTransformer.applyObjectiveFilter(data, ["obj-1"]);

      expect(result.objectives).toHaveLength(1);
      expect(result.objectives[0].id).toBe("obj-1");
    });

    it("should filter by multiple objectives", () => {
      const data = createMockNestedCycleData();

      const result = dataTransformer.applyObjectiveFilter(data, [
        "obj-1",
        "obj-2",
      ]);

      expect(result.objectives).toHaveLength(1);
      expect(result.objectives[0].id).toBe("obj-1");
    });

    it("should return empty objectives when none match", () => {
      const data = createMockNestedCycleData();

      const result = dataTransformer.applyObjectiveFilter(data, [
        "nonexistent",
      ]);

      expect(result.objectives).toHaveLength(0);
    });
  });

  describe("processCycleData", () => {
    it("should process cycle data with no filters", () => {
      const rawData = createMockCycleData();

      const result = dataTransformer.processCycleData(mockConfig, rawData);

      expect(result.objectives).toHaveLength(2);
    });

    it("should process cycle data with objective filter", () => {
      const rawData = createMockCycleData();
      const filters: FilterCriteria = { objectives: ["obj-1"] };

      const result = dataTransformer.processCycleData(
        mockConfig,
        rawData,
        filters,
      );

      expect(result.objectives).toHaveLength(1);
      expect(result.objectives[0].id).toBe("obj-1");
    });

    it("should process cycle data with multiple filters", () => {
      const rawData = createMockCycleData();
      const filters: FilterCriteria = {
        objectives: ["obj-1"],
        area: "frontend",
        stages: ["s2"],
      };

      const result = dataTransformer.processCycleData(
        mockConfig,
        rawData,
        filters,
      );

      expect(result.objectives).toHaveLength(1);
      expect(result.objectives[0].id).toBe("obj-1");
    });

    it("should handle empty raw data", () => {
      const rawData = createEmptyCycleData();

      const result = dataTransformer.processCycleData(mockConfig, rawData);

      expect(result.objectives).toHaveLength(0);
    });
  });

  describe("generateRoadmapData", () => {
    it("should generate roadmap data from processed data", () => {
      const rawData = createMockCycleData();
      const processedData = createMockNestedCycleData();

      const result = dataTransformer.generateRoadmapData(
        rawData,
        processedData,
      );

      expect(result.orderedCycles).toEqual(rawData.cycles);
      expect(result.roadmapItems).toEqual([]);
      expect(result.activeCycle).toEqual(rawData.cycles[0]);
      expect(result.objectives).toEqual(processedData.objectives);
    });

    it("should handle null processed data", () => {
      const rawData = createMockCycleData();

      const result = dataTransformer.generateRoadmapData(rawData, null);

      expect(result.orderedCycles).toEqual([]);
      expect(result.roadmapItems).toEqual([]);
      expect(result.activeCycle).toBeNull();
      expect(result.objectives).toEqual([]);
    });

    it("should handle null raw data", () => {
      const processedData = createMockNestedCycleData();

      const result = dataTransformer.generateRoadmapData(null, processedData);

      expect(result.orderedCycles).toEqual([]);
      expect(result.roadmapItems).toEqual([]);
      expect(result.activeCycle).toBeNull();
      expect(result.objectives).toEqual(processedData.objectives);
    });

    it("should handle both null data", () => {
      const result = dataTransformer.generateRoadmapData(null, null);

      expect(result.orderedCycles).toEqual([]);
      expect(result.roadmapItems).toEqual([]);
      expect(result.activeCycle).toBeNull();
      expect(result.objectives).toEqual([]);
    });
  });

  describe("generateCycleOverviewData", () => {
    it("should generate cycle overview data", () => {
      const rawData = createMockCycleData();
      const processedData = createMockNestedCycleData();

      const result = dataTransformer.generateCycleOverviewData(
        rawData,
        processedData,
      );

      expect(result).not.toBeNull();
      expect(result!.cycle).toEqual(rawData.cycles[0]);
      expect(result!.objectives).toEqual(processedData.objectives);
    });

    it("should return null for null processed data", () => {
      const rawData = createMockCycleData();

      const result = dataTransformer.generateCycleOverviewData(rawData, null);

      expect(result).toBeNull();
    });

    it("should return null for null raw data", () => {
      const processedData = createMockNestedCycleData();

      const result = dataTransformer.generateCycleOverviewData(
        null,
        processedData,
      );

      expect(result).toBeNull();
    });

    it("should return null for empty cycles", () => {
      const rawData = { ...createMockCycleData(), cycles: [] };
      const processedData = createMockNestedCycleData();

      const result = dataTransformer.generateCycleOverviewData(
        rawData,
        processedData,
      );

      expect(result).toBeNull();
    });

    it("should return null for null cycles", () => {
      const rawData = { ...createMockCycleData(), cycles: null as any };
      const processedData = createMockNestedCycleData();

      const result = dataTransformer.generateCycleOverviewData(
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

      const result = dataTransformer.generateFilteredRoadmapData(
        rawData,
        processedData,
        filters,
      );

      expect(result.orderedCycles).toEqual(rawData.cycles);
      expect(result.roadmapItems).toEqual([]);
      expect(result.activeCycle).toEqual(rawData.cycles[0]);
      expect(result.objectives).toEqual(processedData.objectives);
    });

    it("should handle null processed data", () => {
      const rawData = createMockCycleData();
      const filters: FilterCriteria = { area: "frontend" };

      const result = dataTransformer.generateFilteredRoadmapData(
        rawData,
        null,
        filters,
      );

      expect(result.orderedCycles).toEqual([]);
      expect(result.roadmapItems).toEqual([]);
      expect(result.activeCycle).toBeNull();
      expect(result.objectives).toEqual([]);
    });
  });

  describe("generateFilteredCycleOverviewData", () => {
    it("should generate filtered cycle overview data", () => {
      const rawData = createMockCycleData();
      const processedData = createMockNestedCycleData();
      const filters: FilterCriteria = { area: "frontend" };

      const result = dataTransformer.generateFilteredCycleOverviewData(
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
      expect(result!.objectives).toEqual(processedData.objectives);
    });

    it("should return null for null processed data", () => {
      const rawData = createMockCycleData();
      const filters: FilterCriteria = { area: "frontend" };

      const result = dataTransformer.generateFilteredCycleOverviewData(
        rawData,
        null,
        filters,
      );

      expect(result).toBeNull();
    });

    it("should return null for null raw data", () => {
      const processedData = createMockNestedCycleData();
      const filters: FilterCriteria = { area: "frontend" };

      const result = dataTransformer.generateFilteredCycleOverviewData(
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

      const result = dataTransformer.generateFilteredCycleOverviewData(
        rawData,
        processedData,
        filters,
      );

      expect(result).toBeNull();
    });
  });
});
