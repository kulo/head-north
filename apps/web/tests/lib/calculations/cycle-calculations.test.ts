/**
 * Tests for cycle-calculations.ts
 *
 * Tests the core calculation utilities for progress metrics and cycle metadata.
 */

import { describe, it, expect } from "vitest";
import {
  calculateReleaseItemProgress,
  calculateCycleMetadata,
  aggregateProgressMetrics,
  normalize,
  roundToTwoDigit,
} from "../../../src/lib/calculations/cycle-calculations";
import {
  createMockReleaseItem,
  createMockReleaseItemWithStatus,
  createMockReleaseItemWithEffort,
  createTestReleaseItemCollection,
  createMockCycle,
} from "../../fixtures/cycle-data-fixtures";

describe("cycle-calculations", () => {
  describe("normalize", () => {
    it("should normalize number to one decimal place", () => {
      expect(normalize(1.234)).toBe(1.2);
      expect(normalize(1.256)).toBe(1.3);
      expect(normalize(1.25)).toBe(1.3);
      expect(normalize(1.24)).toBe(1.2);
    });

    it("should handle whole numbers", () => {
      expect(normalize(5)).toBe(5);
      expect(normalize(0)).toBe(0);
    });

    it("should handle negative numbers", () => {
      expect(normalize(-1.234)).toBe(-1.2);
      expect(normalize(-1.256)).toBe(-1.3);
    });
  });

  describe("roundToTwoDigit", () => {
    it("should round number to two decimal places", () => {
      expect(roundToTwoDigit(1.234)).toBe(1.23);
      expect(roundToTwoDigit(1.236)).toBe(1.24);
      expect(roundToTwoDigit(1.235)).toBe(1.24);
    });

    it("should handle whole numbers", () => {
      expect(roundToTwoDigit(5)).toBe(5);
      expect(roundToTwoDigit(0)).toBe(0);
    });

    it("should handle negative numbers", () => {
      expect(roundToTwoDigit(-1.234)).toBe(-1.23);
      expect(roundToTwoDigit(-1.236)).toBe(-1.24);
    });
  });

  describe("calculateReleaseItemProgress", () => {
    it("should return zero metrics for empty array", () => {
      const result = calculateReleaseItemProgress([]);

      expect(result).toEqual({
        weeks: 0,
        weeksDone: 0,
        weeksInProgress: 0,
        weeksTodo: 0,
        weeksNotToDo: 0,
        weeksCancelled: 0,
        weeksPostponed: 0,
        releaseItemsCount: 0,
        releaseItemsDoneCount: 0,
        progress: 0,
        progressWithInProgress: 0,
        progressByReleaseItems: 0,
        percentageNotToDo: 0,
      });
    });

    it("should return zero metrics for null/undefined input", () => {
      const result1 = calculateReleaseItemProgress(null as any);
      const result2 = calculateReleaseItemProgress(undefined as any);

      expect(result1).toEqual({
        weeks: 0,
        weeksDone: 0,
        weeksInProgress: 0,
        weeksTodo: 0,
        weeksNotToDo: 0,
        weeksCancelled: 0,
        weeksPostponed: 0,
        releaseItemsCount: 0,
        releaseItemsDoneCount: 0,
        progress: 0,
        progressWithInProgress: 0,
        progressByReleaseItems: 0,
        percentageNotToDo: 0,
      });
      expect(result2).toEqual(result1);
    });

    it("should calculate metrics for single release item", () => {
      const releaseItems = [createMockReleaseItemWithStatus("done")];

      const result = calculateReleaseItemProgress(releaseItems);

      expect(result.weeks).toBe(2);
      expect(result.weeksDone).toBe(2);
      expect(result.weeksInProgress).toBe(0);
      expect(result.weeksTodo).toBe(0);
      expect(result.weeksNotToDo).toBe(0);
      expect(result.weeksCancelled).toBe(0);
      expect(result.weeksPostponed).toBe(0);
      expect(result.releaseItemsCount).toBe(1);
      expect(result.releaseItemsDoneCount).toBe(1);
      expect(result.progress).toBe(100);
      expect(result.progressWithInProgress).toBe(100);
      expect(result.progressByReleaseItems).toBe(100);
      expect(result.percentageNotToDo).toBe(0);
    });

    it("should calculate metrics for mixed status release items", () => {
      const releaseItems = [
        createMockReleaseItemWithStatus("todo"),
        createMockReleaseItemWithStatus("inprogress"),
        createMockReleaseItemWithStatus("done"),
        createMockReleaseItemWithStatus("cancelled"),
        createMockReleaseItemWithStatus("postponed"),
      ];

      const result = calculateReleaseItemProgress(releaseItems);

      expect(result.weeks).toBe(10); // 5 items * 2 weeks each
      expect(result.weeksDone).toBe(2);
      expect(result.weeksInProgress).toBe(2);
      expect(result.weeksTodo).toBe(2);
      expect(result.weeksNotToDo).toBe(4); // cancelled + postponed
      expect(result.weeksCancelled).toBe(2);
      expect(result.weeksPostponed).toBe(2);
      expect(result.releaseItemsCount).toBe(5);
      expect(result.releaseItemsDoneCount).toBe(1);
      expect(result.progress).toBe(20); // 2/10 * 100
      expect(result.progressWithInProgress).toBe(40); // (2+2)/10 * 100
      expect(result.progressByReleaseItems).toBe(20); // 1/5 * 100
      expect(result.percentageNotToDo).toBe(40); // 4/10 * 100
    });

    it("should handle different effort values", () => {
      const releaseItems = [
        createMockReleaseItemWithEffort(0.5),
        createMockReleaseItemWithEffort(1.0),
        createMockReleaseItemWithEffort(2.5),
        createMockReleaseItemWithEffort(5.0),
      ].map((item) => ({ ...item, status: "done" })); // Set all to done status

      const result = calculateReleaseItemProgress(releaseItems);

      expect(result.weeks).toBe(9); // 0.5 + 1.0 + 2.5 + 5.0
      expect(result.weeksDone).toBe(9); // All are done by default
      expect(result.releaseItemsCount).toBe(4);
      expect(result.releaseItemsDoneCount).toBe(4);
    });

    it("should handle string effort values", () => {
      const releaseItems = [
        createMockReleaseItem({ effort: "1.5" as any, status: "done" }),
        createMockReleaseItem({ effort: "2.0" as any, status: "done" }),
      ];

      const result = calculateReleaseItemProgress(releaseItems);

      expect(result.weeks).toBe(3.5);
      expect(result.weeksDone).toBe(3.5);
    });

    it("should handle invalid effort values", () => {
      const releaseItems = [
        createMockReleaseItem({ effort: "invalid" as any }),
        createMockReleaseItem({ effort: null as any }),
        createMockReleaseItem({ effort: undefined as any }),
      ];

      const result = calculateReleaseItemProgress(releaseItems);

      expect(result.weeks).toBe(0);
      expect(result.weeksDone).toBe(0);
    });

    it("should exclude replanned items from weeks calculation", () => {
      const releaseItems = [
        createMockReleaseItemWithStatus("replanned"),
        createMockReleaseItemWithStatus("done"),
      ];

      const result = calculateReleaseItemProgress(releaseItems);

      expect(result.weeks).toBe(2); // Only the done item
      expect(result.weeksDone).toBe(2);
      expect(result.releaseItemsCount).toBe(1); // Only the done item
      expect(result.releaseItemsDoneCount).toBe(1);
    });

    it("should handle case insensitive status values", () => {
      const releaseItems = [
        createMockReleaseItem({ status: "DONE" }),
        createMockReleaseItem({ status: "InProgress" }),
        createMockReleaseItem({ status: "TODO" }),
      ];

      const result = calculateReleaseItemProgress(releaseItems);

      expect(result.weeksDone).toBe(2);
      expect(result.weeksInProgress).toBe(2);
      expect(result.weeksTodo).toBe(2);
    });
  });

  describe("calculateCycleMetadata", () => {
    it("should calculate metadata for valid cycle", () => {
      const cycle = createMockCycle({
        start: "2024-01-01",
        end: "2024-03-31",
      });

      // Mock current date to be in the middle of the cycle
      const originalDate = Date;
      const mockDate = new Date("2024-02-15T12:00:00.000Z");
      global.Date = class extends Date {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(mockDate);
          } else {
            // Properly delegate to the original Date constructor
            super(...(args as [number, number, number]));
          }
        }
        static now() {
          return mockDate.getTime();
        }
      } as any;

      const result = calculateCycleMetadata(cycle);

      expect(result.startMonth).toBe("Jan");
      expect(result.endMonth).toBe("Mar");
      expect(result.daysFromStartOfCycle).toBe(45); // Days from Jan 1 to Feb 15
      expect(result.daysInCycle).toBe(90); // Days from Jan 1 to Mar 31
      expect(result.currentDayPercentage).toBe(50); // 45/90 * 100

      // Restore original Date
      global.Date = originalDate;
    });

    it("should return zero metadata for cycle without dates", () => {
      const cycle = createMockCycle({
        delivery: null,
        end: null,
      });

      const result = calculateCycleMetadata(cycle);

      expect(result).toEqual({
        startMonth: "",
        endMonth: "",
        daysFromStartOfCycle: 0,
        daysInCycle: 0,
        currentDayPercentage: 0,
      });
    });

    it("should return zero metadata for null cycle", () => {
      const result = calculateCycleMetadata(null as any);

      expect(result).toEqual({
        startMonth: "",
        endMonth: "",
        daysFromStartOfCycle: 0,
        daysInCycle: 0,
        currentDayPercentage: 0,
      });
    });

    it("should cap currentDayPercentage at 100", () => {
      const cycle = createMockCycle({
        start: "2024-01-01",
        end: "2024-01-31",
      });

      // Mock current date to be after the cycle end
      const originalDate = Date;
      const mockDate = new Date("2024-02-15T12:00:00.000Z");
      global.Date = class extends Date {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(mockDate);
          } else {
            // Properly delegate to the original Date constructor
            super(...(args as [number, number, number]));
          }
        }
        static now() {
          return mockDate.getTime();
        }
      } as any;

      const result = calculateCycleMetadata(cycle);

      expect(result.currentDayPercentage).toBe(100);

      // Restore original Date
      global.Date = originalDate;
    });

    it("should handle zero day cycles", () => {
      const cycle = createMockCycle({
        delivery: "2024-01-01",
        end: "2024-01-01",
      });

      const result = calculateCycleMetadata(cycle);

      expect(result.daysInCycle).toBe(0);
      expect(result.currentDayPercentage).toBe(0);
    });
  });

  describe("aggregateProgressMetrics", () => {
    it("should return zero metrics for empty array", () => {
      const result = aggregateProgressMetrics([]);

      expect(result).toEqual({
        weeks: 0,
        weeksDone: 0,
        weeksInProgress: 0,
        weeksTodo: 0,
        weeksNotToDo: 0,
        weeksCancelled: 0,
        weeksPostponed: 0,
        releaseItemsCount: 0,
        releaseItemsDoneCount: 0,
        progress: 0,
        progressWithInProgress: 0,
        progressByReleaseItems: 0,
        percentageNotToDo: 0,
      });
    });

    it("should return zero metrics for null/undefined input", () => {
      const result1 = aggregateProgressMetrics(null as any);
      const result2 = aggregateProgressMetrics(undefined as any);

      expect(result1).toEqual({
        weeks: 0,
        weeksDone: 0,
        weeksInProgress: 0,
        weeksTodo: 0,
        weeksNotToDo: 0,
        weeksCancelled: 0,
        weeksPostponed: 0,
        releaseItemsCount: 0,
        releaseItemsDoneCount: 0,
        progress: 0,
        progressWithInProgress: 0,
        progressByReleaseItems: 0,
        percentageNotToDo: 0,
      });
      expect(result2).toEqual(result1);
    });

    it("should aggregate multiple metrics correctly", () => {
      const metricsArray = [
        {
          weeks: 4,
          weeksDone: 2,
          weeksInProgress: 1,
          weeksTodo: 1,
          weeksNotToDo: 0,
          weeksCancelled: 0,
          weeksPostponed: 0,
          releaseItemsCount: 2,
          releaseItemsDoneCount: 1,
          progress: 50,
          progressWithInProgress: 75,
          progressByReleaseItems: 50,
          percentageNotToDo: 0,
        },
        {
          weeks: 6,
          weeksDone: 3,
          weeksInProgress: 2,
          weeksTodo: 1,
          weeksNotToDo: 0,
          weeksCancelled: 0,
          weeksPostponed: 0,
          releaseItemsCount: 3,
          releaseItemsDoneCount: 2,
          progress: 50,
          progressWithInProgress: 83,
          progressByReleaseItems: 67,
          percentageNotToDo: 0,
        },
      ];

      const result = aggregateProgressMetrics(metricsArray);

      expect(result.weeks).toBe(10);
      expect(result.weeksDone).toBe(5);
      expect(result.weeksInProgress).toBe(3);
      expect(result.weeksTodo).toBe(2);
      expect(result.weeksNotToDo).toBe(0);
      expect(result.weeksCancelled).toBe(0);
      expect(result.weeksPostponed).toBe(0);
      expect(result.releaseItemsCount).toBe(5);
      expect(result.releaseItemsDoneCount).toBe(3);
      expect(result.progress).toBe(50); // 5/10 * 100
      expect(result.progressWithInProgress).toBe(80); // (5+3)/10 * 100
      expect(result.progressByReleaseItems).toBe(60); // 3/5 * 100
      expect(result.percentageNotToDo).toBe(0);
    });

    it("should handle metrics with undefined values", () => {
      const metricsArray = [
        {
          weeks: 4,
          weeksDone: 2,
          weeksInProgress: undefined,
          weeksTodo: 1,
          weeksNotToDo: 0,
          weeksCancelled: 0,
          weeksPostponed: 0,
          releaseItemsCount: 2,
          releaseItemsDoneCount: 1,
          progress: 50,
          progressWithInProgress: 75,
          progressByReleaseItems: 50,
          percentageNotToDo: 0,
        },
      ];

      const result = aggregateProgressMetrics(metricsArray);

      expect(result.weeksInProgress).toBe(0); // undefined should be treated as 0
    });

    it("should handle zero weeks in percentage calculations", () => {
      const metricsArray = [
        {
          weeks: 0,
          weeksDone: 0,
          weeksInProgress: 0,
          weeksTodo: 0,
          weeksNotToDo: 0,
          weeksCancelled: 0,
          weeksPostponed: 0,
          releaseItemsCount: 0,
          releaseItemsDoneCount: 0,
          progress: 0,
          progressWithInProgress: 0,
          progressByReleaseItems: 0,
          percentageNotToDo: 0,
        },
      ];

      const result = aggregateProgressMetrics(metricsArray);

      expect(result.progress).toBe(0);
      expect(result.progressWithInProgress).toBe(0);
      expect(result.progressByReleaseItems).toBe(0);
      expect(result.percentageNotToDo).toBe(0);
    });

    it("should handle zero release items in percentage calculations", () => {
      const metricsArray = [
        {
          weeks: 4,
          weeksDone: 2,
          weeksInProgress: 1,
          weeksTodo: 1,
          weeksNotToDo: 0,
          weeksCancelled: 0,
          weeksPostponed: 0,
          releaseItemsCount: 0,
          releaseItemsDoneCount: 0,
          progress: 50,
          progressWithInProgress: 75,
          progressByReleaseItems: 0,
          percentageNotToDo: 0,
        },
      ];

      const result = aggregateProgressMetrics(metricsArray);

      expect(result.progressByReleaseItems).toBe(0);
    });
  });
});
