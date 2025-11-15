/**
 * Tests for cycle-progress-calculator.ts
 *
 * Tests the cycle progress calculation logic that aggregates progress from objectives.
 */

import { describe, it, expect } from "vitest";
import { calculateCycleProgress } from "../../src/lib/cycle-progress-calculator";
import {
  createMockCycle,
  createMockNestedCycleData,
  createMockRoadmapItemWithProgress,
  createMockCycleItem,
} from "../fixtures/cycle-data-fixtures";
import type { ObjectiveWithProgress } from "../../src/types/ui-types";

describe("cycle-progress-calculator", () => {
  describe("calculateCycleProgress", () => {
    it("should calculate cycle progress with objectives", () => {
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

      const cycle = createMockCycle({
        id: "cycle-1",
        name: "Q1 2024",
        start: "2024-01-01",
        end: "2024-03-31",
      });

      const objectives: ObjectiveWithProgress[] = [
        {
          id: "obj-1",
          name: "Platform Objective",
          roadmapItems: [createMockRoadmapItemWithProgress()],
          weeks: 4.0,
          weeksDone: 2.0,
          weeksInProgress: 2.0,
          weeksTodo: 0,
          weeksNotToDo: 0,
          weeksCancelled: 0,
          weeksPostponed: 0,
          cycleItemsCount: 2,
          cycleItemsDoneCount: 1,
          progress: 50,
          progressWithInProgress: 100,
          progressByCycleItems: 50,
          percentageNotToDo: 0,
          startMonth: "Jan",
          endMonth: "Mar",
          daysFromStartOfCycle: 15,
          daysInCycle: 90,
          currentDayPercentage: 17,
        },
      ];

      const result = calculateCycleProgress(cycle, objectives);

      expect(result).toEqual({
        id: "cycle-1",
        name: "Q1 2024",
        state: "active",
        start: "2024-01-01",
        delivery: "2024-02-15",
        end: "2024-03-31",
        weeks: 4.0,
        weeksDone: 2.0,
        weeksInProgress: 2.0,
        weeksTodo: 0,
        weeksNotToDo: 0,
        weeksCancelled: 0,
        weeksPostponed: 0,
        cycleItemsCount: 2,
        cycleItemsDoneCount: 1,
        progress: 50,
        progressWithInProgress: 100,
        progressByCycleItems: 50,
        percentageNotToDo: 0,
        startMonth: "Jan",
        endMonth: "Mar",
        daysFromStartOfCycle: 45,
        daysInCycle: 90,
        currentDayPercentage: 50,
      });

      // Restore original Date
      global.Date = originalDate;
    });

    it("should calculate cycle progress with multiple objectives", () => {
      const cycle = createMockCycle({
        id: "cycle-1",
        name: "Q1 2024",
        delivery: "2024-01-01",
        end: "2024-03-31",
      });

      const objectives: ObjectiveWithProgress[] = [
        {
          id: "obj-1",
          name: "Platform Objective",
          roadmapItems: [createMockRoadmapItemWithProgress()],
          weeks: 4.0,
          weeksDone: 2.0,
          weeksInProgress: 2.0,
          weeksTodo: 0,
          weeksNotToDo: 0,
          weeksCancelled: 0,
          weeksPostponed: 0,
          cycleItemsCount: 2,
          cycleItemsDoneCount: 1,
          progress: 50,
          progressWithInProgress: 100,
          progressByCycleItems: 50,
          percentageNotToDo: 0,
          startMonth: "Jan",
          endMonth: "Mar",
          daysFromStartOfCycle: 15,
          daysInCycle: 90,
          currentDayPercentage: 17,
        },
        {
          id: "obj-2",
          name: "User Experience Objective",
          roadmapItems: [
            {
              ...createMockRoadmapItemWithProgress(),
              id: "ROADMAP-002",
              weeks: 6.0,
              weeksDone: 3.0,
              weeksInProgress: 2.0,
              weeksTodo: 1.0,
              cycleItemsCount: 3,
              cycleItemsDoneCount: 2,
              cycleItems: [
                createMockCycleItem({
                  id: "CYCLE-003",
                  effort: 3.0,
                  status: "done",
                }),
                createMockCycleItem({
                  id: "CYCLE-004",
                  effort: 3.0,
                  status: "inprogress",
                }),
              ],
            },
          ],
          weeks: 6.0,
          weeksDone: 3.0,
          weeksInProgress: 2.0,
          weeksTodo: 1.0,
          weeksNotToDo: 0,
          weeksCancelled: 0,
          weeksPostponed: 0,
          cycleItemsCount: 3,
          cycleItemsDoneCount: 2,
          progress: 50,
          progressWithInProgress: 83,
          progressByCycleItems: 67,
          percentageNotToDo: 0,
          startMonth: "Jan",
          endMonth: "Mar",
          daysFromStartOfCycle: 15,
          daysInCycle: 90,
          currentDayPercentage: 17,
        },
      ];

      const result = calculateCycleProgress(cycle, objectives);

      expect(result.weeks).toBe(10.0); // 4.0 + 6.0
      expect(result.weeksDone).toBe(5.0); // 2.0 + 3.0
      expect(result.weeksInProgress).toBe(5.0); // 2.0 + 3.0
      expect(result.weeksTodo).toBe(0); // 0 + 0
      expect(result.cycleItemsCount).toBe(4); // 2 + 2
      expect(result.cycleItemsDoneCount).toBe(2); // 1 + 1
      expect(result.progress).toBe(50); // 5/10 * 100
      expect(result.progressWithInProgress).toBe(100); // (5+5)/10 * 100
      expect(result.progressByCycleItems).toBe(50); // 2/4 * 100
    });

    it("should calculate cycle progress with empty objectives", () => {
      const cycle = createMockCycle({
        id: "cycle-1",
        name: "Q1 2024",
        delivery: "2024-01-01",
        end: "2024-03-31",
      });

      const objectives: ObjectiveWithProgress[] = [];

      const result = calculateCycleProgress(cycle, objectives);

      expect(result.weeks).toBe(0);
      expect(result.weeksDone).toBe(0);
      expect(result.weeksInProgress).toBe(0);
      expect(result.weeksTodo).toBe(0);
      expect(result.weeksNotToDo).toBe(0);
      expect(result.weeksCancelled).toBe(0);
      expect(result.weeksPostponed).toBe(0);
      expect(result.cycleItemsCount).toBe(0);
      expect(result.cycleItemsDoneCount).toBe(0);
      expect(result.progress).toBe(0);
      expect(result.progressWithInProgress).toBe(0);
      expect(result.progressByCycleItems).toBe(0);
      expect(result.percentageNotToDo).toBe(0);
    });

    it("should calculate cycle progress with objectives having no roadmap items", () => {
      const cycle = createMockCycle({
        id: "cycle-1",
        name: "Q1 2024",
        delivery: "2024-01-01",
        end: "2024-03-31",
      });

      const objectives: ObjectiveWithProgress[] = [
        {
          id: "obj-1",
          name: "Empty Objective",
          roadmapItems: [],
          weeks: 0,
          weeksDone: 0,
          weeksInProgress: 0,
          weeksTodo: 0,
          weeksNotToDo: 0,
          weeksCancelled: 0,
          weeksPostponed: 0,
          cycleItemsCount: 0,
          cycleItemsDoneCount: 0,
          progress: 0,
          progressWithInProgress: 0,
          progressByCycleItems: 0,
          percentageNotToDo: 0,
          startMonth: "",
          endMonth: "",
          daysFromStartOfCycle: 0,
          daysInCycle: 0,
          currentDayPercentage: 0,
        },
      ];

      const result = calculateCycleProgress(cycle, objectives);

      expect(result.weeks).toBe(0);
      expect(result.weeksDone).toBe(0);
      expect(result.weeksInProgress).toBe(0);
      expect(result.weeksTodo).toBe(0);
      expect(result.weeksNotToDo).toBe(0);
      expect(result.weeksCancelled).toBe(0);
      expect(result.weeksPostponed).toBe(0);
      expect(result.cycleItemsCount).toBe(0);
      expect(result.cycleItemsDoneCount).toBe(0);
      expect(result.progress).toBe(0);
      expect(result.progressWithInProgress).toBe(0);
      expect(result.progressByCycleItems).toBe(0);
      expect(result.percentageNotToDo).toBe(0);
    });

    it("should calculate cycle progress with objectives having null roadmap items", () => {
      const cycle = createMockCycle({
        id: "cycle-1",
        name: "Q1 2024",
        delivery: "2024-01-01",
        end: "2024-03-31",
      });

      const objectives: ObjectiveWithProgress[] = [
        {
          id: "obj-1",
          name: "Objective with Null Roadmap Items",
          roadmapItems: null as any,
          weeks: 0,
          weeksDone: 0,
          weeksInProgress: 0,
          weeksTodo: 0,
          weeksNotToDo: 0,
          weeksCancelled: 0,
          weeksPostponed: 0,
          cycleItemsCount: 0,
          cycleItemsDoneCount: 0,
          progress: 0,
          progressWithInProgress: 0,
          progressByCycleItems: 0,
          percentageNotToDo: 0,
          startMonth: "",
          endMonth: "",
          daysFromStartOfCycle: 0,
          daysInCycle: 0,
          currentDayPercentage: 0,
        },
      ];

      const result = calculateCycleProgress(cycle, objectives);

      expect(result.weeks).toBe(0);
      expect(result.weeksDone).toBe(0);
      expect(result.weeksInProgress).toBe(0);
      expect(result.weeksTodo).toBe(0);
      expect(result.weeksNotToDo).toBe(0);
      expect(result.weeksCancelled).toBe(0);
      expect(result.weeksPostponed).toBe(0);
      expect(result.cycleItemsCount).toBe(0);
      expect(result.cycleItemsDoneCount).toBe(0);
      expect(result.progress).toBe(0);
      expect(result.progressWithInProgress).toBe(0);
      expect(result.progressByCycleItems).toBe(0);
      expect(result.percentageNotToDo).toBe(0);
    });

    it("should calculate cycle progress with objectives having undefined roadmap items", () => {
      const cycle = createMockCycle({
        id: "cycle-1",
        name: "Q1 2024",
        delivery: "2024-01-01",
        end: "2024-03-31",
      });

      const objectives: ObjectiveWithProgress[] = [
        {
          id: "obj-1",
          name: "Objective with Undefined Roadmap Items",
          roadmapItems: undefined as any,
          weeks: 0,
          weeksDone: 0,
          weeksInProgress: 0,
          weeksTodo: 0,
          weeksNotToDo: 0,
          weeksCancelled: 0,
          weeksPostponed: 0,
          cycleItemsCount: 0,
          cycleItemsDoneCount: 0,
          progress: 0,
          progressWithInProgress: 0,
          progressByCycleItems: 0,
          percentageNotToDo: 0,
          startMonth: "",
          endMonth: "",
          daysFromStartOfCycle: 0,
          daysInCycle: 0,
          currentDayPercentage: 0,
        },
      ];

      const result = calculateCycleProgress(cycle, objectives);

      expect(result.weeks).toBe(0);
      expect(result.weeksDone).toBe(0);
      expect(result.weeksInProgress).toBe(0);
      expect(result.weeksTodo).toBe(0);
      expect(result.weeksNotToDo).toBe(0);
      expect(result.weeksCancelled).toBe(0);
      expect(result.weeksPostponed).toBe(0);
      expect(result.cycleItemsCount).toBe(0);
      expect(result.cycleItemsDoneCount).toBe(0);
      expect(result.progress).toBe(0);
      expect(result.progressWithInProgress).toBe(0);
      expect(result.progressByCycleItems).toBe(0);
      expect(result.percentageNotToDo).toBe(0);
    });

    it("should calculate cycle progress with objectives having roadmap items with null cycle items", () => {
      const cycle = createMockCycle({
        id: "cycle-1",
        name: "Q1 2024",
        delivery: "2024-01-01",
        end: "2024-03-31",
      });

      const objectives: ObjectiveWithProgress[] = [
        {
          id: "obj-1",
          name: "Objective with Null Cycle Items",
          roadmapItems: [
            {
              ...createMockRoadmapItemWithProgress(),
              cycleItems: null as any,
            },
          ],
          weeks: 0,
          weeksDone: 0,
          weeksInProgress: 0,
          weeksTodo: 0,
          weeksNotToDo: 0,
          weeksCancelled: 0,
          weeksPostponed: 0,
          cycleItemsCount: 0,
          cycleItemsDoneCount: 0,
          progress: 0,
          progressWithInProgress: 0,
          progressByCycleItems: 0,
          percentageNotToDo: 0,
          startMonth: "",
          endMonth: "",
          daysFromStartOfCycle: 0,
          daysInCycle: 0,
          currentDayPercentage: 0,
        },
      ];

      const result = calculateCycleProgress(cycle, objectives);

      expect(result.weeks).toBe(0);
      expect(result.weeksDone).toBe(0);
      expect(result.weeksInProgress).toBe(0);
      expect(result.weeksTodo).toBe(0);
      expect(result.weeksNotToDo).toBe(0);
      expect(result.weeksCancelled).toBe(0);
      expect(result.weeksPostponed).toBe(0);
      expect(result.cycleItemsCount).toBe(0);
      expect(result.cycleItemsDoneCount).toBe(0);
      expect(result.progress).toBe(0);
      expect(result.progressWithInProgress).toBe(0);
      expect(result.progressByCycleItems).toBe(0);
      expect(result.percentageNotToDo).toBe(0);
    });

    it("should preserve cycle metadata in result", () => {
      const cycle = createMockCycle({
        id: "cycle-1",
        name: "Q1 2024",
        state: "active",
        start: "2024-01-01",
        delivery: "2024-02-15",
        end: "2024-03-31",
      });

      const objectives: ObjectiveWithProgress[] = [];

      const result = calculateCycleProgress(cycle, objectives);

      expect(result.id).toBe("cycle-1");
      expect(result.name).toBe("Q1 2024");
      expect(result.state).toBe("active");
      expect(result.start).toBe("2024-01-01");
      expect(result.delivery).toBe("2024-02-15");
      expect(result.end).toBe("2024-03-31");
    });

    it("should handle cycle with missing dates", () => {
      const cycle = createMockCycle({
        id: "cycle-1",
        name: "Q1 2024",
        delivery: null,
        end: null,
      });

      const objectives: ObjectiveWithProgress[] = [
        {
          id: "obj-1",
          name: "Platform Objective",
          roadmapItems: [createMockRoadmapItemWithProgress()],
          weeks: 4.0,
          weeksDone: 2.0,
          weeksInProgress: 2.0,
          weeksTodo: 0,
          weeksNotToDo: 0,
          weeksCancelled: 0,
          weeksPostponed: 0,
          cycleItemsCount: 2,
          cycleItemsDoneCount: 1,
          progress: 50,
          progressWithInProgress: 100,
          progressByCycleItems: 50,
          percentageNotToDo: 0,
          startMonth: "",
          endMonth: "",
          daysFromStartOfCycle: 0,
          daysInCycle: 0,
          currentDayPercentage: 0,
        },
      ];

      const result = calculateCycleProgress(cycle, objectives);

      expect(result.startMonth).toBe("");
      expect(result.endMonth).toBe("");
      expect(result.daysFromStartOfCycle).toBe(0);
      expect(result.daysInCycle).toBe(0);
      expect(result.currentDayPercentage).toBe(0);
    });
  });
});
