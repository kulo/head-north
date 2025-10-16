/**
 * Tests for cycle-progress-calculator.ts
 *
 * Tests the cycle progress calculation logic that aggregates progress from initiatives.
 */

import { describe, it, expect } from "vitest";
import { calculateCycleProgress } from "../../src/lib/cycle-progress-calculator";
import {
  createMockCycle,
  createMockNestedCycleData,
  createMockRoadmapItemWithProgress,
  createMockReleaseItem,
} from "../fixtures/cycle-data-fixtures";
import type { InitiativeWithProgress } from "../../src/types/ui-types";

describe("cycle-progress-calculator", () => {
  describe("calculateCycleProgress", () => {
    it("should calculate cycle progress with initiatives", () => {
      // Mock current date to be in the middle of the cycle
      const originalDate = Date;
      const mockDate = new Date("2024-02-15T12:00:00.000Z");
      global.Date = class extends Date {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(mockDate);
          } else {
            super(
              args[0],
              args[1],
              args[2],
              args[3],
              args[4],
              args[5],
              args[6],
            );
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

      const initiatives: InitiativeWithProgress[] = [
        {
          id: "init-1",
          name: "Platform Initiative",
          roadmapItems: [createMockRoadmapItemWithProgress()],
          weeks: 4.0,
          weeksDone: 2.0,
          weeksInProgress: 2.0,
          weeksTodo: 0,
          weeksNotToDo: 0,
          weeksCancelled: 0,
          weeksPostponed: 0,
          releaseItemsCount: 2,
          releaseItemsDoneCount: 1,
          progress: 50,
          progressWithInProgress: 100,
          progressByReleaseItems: 50,
          percentageNotToDo: 0,
          startMonth: "Jan",
          endMonth: "Mar",
          daysFromStartOfCycle: 15,
          daysInCycle: 90,
          currentDayPercentage: 17,
        },
      ];

      const result = calculateCycleProgress(cycle, initiatives);

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
        releaseItemsCount: 2,
        releaseItemsDoneCount: 1,
        progress: 50,
        progressWithInProgress: 100,
        progressByReleaseItems: 50,
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

    it("should calculate cycle progress with multiple initiatives", () => {
      const cycle = createMockCycle({
        id: "cycle-1",
        name: "Q1 2024",
        delivery: "2024-01-01",
        end: "2024-03-31",
      });

      const initiatives: InitiativeWithProgress[] = [
        {
          id: "init-1",
          name: "Platform Initiative",
          roadmapItems: [createMockRoadmapItemWithProgress()],
          weeks: 4.0,
          weeksDone: 2.0,
          weeksInProgress: 2.0,
          weeksTodo: 0,
          weeksNotToDo: 0,
          weeksCancelled: 0,
          weeksPostponed: 0,
          releaseItemsCount: 2,
          releaseItemsDoneCount: 1,
          progress: 50,
          progressWithInProgress: 100,
          progressByReleaseItems: 50,
          percentageNotToDo: 0,
          startMonth: "Jan",
          endMonth: "Mar",
          daysFromStartOfCycle: 15,
          daysInCycle: 90,
          currentDayPercentage: 17,
        },
        {
          id: "init-2",
          name: "User Experience Initiative",
          roadmapItems: [
            {
              ...createMockRoadmapItemWithProgress(),
              id: "ROADMAP-002",
              weeks: 6.0,
              weeksDone: 3.0,
              weeksInProgress: 2.0,
              weeksTodo: 1.0,
              releaseItemsCount: 3,
              releaseItemsDoneCount: 2,
              releaseItems: [
                createMockReleaseItem({
                  id: "RELEASE-003",
                  effort: 3.0,
                  status: "done",
                }),
                createMockReleaseItem({
                  id: "RELEASE-004",
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
          releaseItemsCount: 3,
          releaseItemsDoneCount: 2,
          progress: 50,
          progressWithInProgress: 83,
          progressByReleaseItems: 67,
          percentageNotToDo: 0,
          startMonth: "Jan",
          endMonth: "Mar",
          daysFromStartOfCycle: 15,
          daysInCycle: 90,
          currentDayPercentage: 17,
        },
      ];

      const result = calculateCycleProgress(cycle, initiatives);

      expect(result.weeks).toBe(10.0); // 4.0 + 6.0
      expect(result.weeksDone).toBe(5.0); // 2.0 + 3.0
      expect(result.weeksInProgress).toBe(5.0); // 2.0 + 3.0
      expect(result.weeksTodo).toBe(0); // 0 + 0
      expect(result.releaseItemsCount).toBe(4); // 2 + 2
      expect(result.releaseItemsDoneCount).toBe(2); // 1 + 1
      expect(result.progress).toBe(50); // 5/10 * 100
      expect(result.progressWithInProgress).toBe(100); // (5+5)/10 * 100
      expect(result.progressByReleaseItems).toBe(50); // 2/4 * 100
    });

    it("should calculate cycle progress with empty initiatives", () => {
      const cycle = createMockCycle({
        id: "cycle-1",
        name: "Q1 2024",
        delivery: "2024-01-01",
        end: "2024-03-31",
      });

      const initiatives: InitiativeWithProgress[] = [];

      const result = calculateCycleProgress(cycle, initiatives);

      expect(result.weeks).toBe(0);
      expect(result.weeksDone).toBe(0);
      expect(result.weeksInProgress).toBe(0);
      expect(result.weeksTodo).toBe(0);
      expect(result.weeksNotToDo).toBe(0);
      expect(result.weeksCancelled).toBe(0);
      expect(result.weeksPostponed).toBe(0);
      expect(result.releaseItemsCount).toBe(0);
      expect(result.releaseItemsDoneCount).toBe(0);
      expect(result.progress).toBe(0);
      expect(result.progressWithInProgress).toBe(0);
      expect(result.progressByReleaseItems).toBe(0);
      expect(result.percentageNotToDo).toBe(0);
    });

    it("should calculate cycle progress with initiatives having no roadmap items", () => {
      const cycle = createMockCycle({
        id: "cycle-1",
        name: "Q1 2024",
        delivery: "2024-01-01",
        end: "2024-03-31",
      });

      const initiatives: InitiativeWithProgress[] = [
        {
          id: "init-1",
          name: "Empty Initiative",
          roadmapItems: [],
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
          startMonth: "",
          endMonth: "",
          daysFromStartOfCycle: 0,
          daysInCycle: 0,
          currentDayPercentage: 0,
        },
      ];

      const result = calculateCycleProgress(cycle, initiatives);

      expect(result.weeks).toBe(0);
      expect(result.weeksDone).toBe(0);
      expect(result.weeksInProgress).toBe(0);
      expect(result.weeksTodo).toBe(0);
      expect(result.weeksNotToDo).toBe(0);
      expect(result.weeksCancelled).toBe(0);
      expect(result.weeksPostponed).toBe(0);
      expect(result.releaseItemsCount).toBe(0);
      expect(result.releaseItemsDoneCount).toBe(0);
      expect(result.progress).toBe(0);
      expect(result.progressWithInProgress).toBe(0);
      expect(result.progressByReleaseItems).toBe(0);
      expect(result.percentageNotToDo).toBe(0);
    });

    it("should calculate cycle progress with initiatives having null roadmap items", () => {
      const cycle = createMockCycle({
        id: "cycle-1",
        name: "Q1 2024",
        delivery: "2024-01-01",
        end: "2024-03-31",
      });

      const initiatives: InitiativeWithProgress[] = [
        {
          id: "init-1",
          name: "Initiative with Null Roadmap Items",
          roadmapItems: null as any,
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
          startMonth: "",
          endMonth: "",
          daysFromStartOfCycle: 0,
          daysInCycle: 0,
          currentDayPercentage: 0,
        },
      ];

      const result = calculateCycleProgress(cycle, initiatives);

      expect(result.weeks).toBe(0);
      expect(result.weeksDone).toBe(0);
      expect(result.weeksInProgress).toBe(0);
      expect(result.weeksTodo).toBe(0);
      expect(result.weeksNotToDo).toBe(0);
      expect(result.weeksCancelled).toBe(0);
      expect(result.weeksPostponed).toBe(0);
      expect(result.releaseItemsCount).toBe(0);
      expect(result.releaseItemsDoneCount).toBe(0);
      expect(result.progress).toBe(0);
      expect(result.progressWithInProgress).toBe(0);
      expect(result.progressByReleaseItems).toBe(0);
      expect(result.percentageNotToDo).toBe(0);
    });

    it("should calculate cycle progress with initiatives having undefined roadmap items", () => {
      const cycle = createMockCycle({
        id: "cycle-1",
        name: "Q1 2024",
        delivery: "2024-01-01",
        end: "2024-03-31",
      });

      const initiatives: InitiativeWithProgress[] = [
        {
          id: "init-1",
          name: "Initiative with Undefined Roadmap Items",
          roadmapItems: undefined as any,
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
          startMonth: "",
          endMonth: "",
          daysFromStartOfCycle: 0,
          daysInCycle: 0,
          currentDayPercentage: 0,
        },
      ];

      const result = calculateCycleProgress(cycle, initiatives);

      expect(result.weeks).toBe(0);
      expect(result.weeksDone).toBe(0);
      expect(result.weeksInProgress).toBe(0);
      expect(result.weeksTodo).toBe(0);
      expect(result.weeksNotToDo).toBe(0);
      expect(result.weeksCancelled).toBe(0);
      expect(result.weeksPostponed).toBe(0);
      expect(result.releaseItemsCount).toBe(0);
      expect(result.releaseItemsDoneCount).toBe(0);
      expect(result.progress).toBe(0);
      expect(result.progressWithInProgress).toBe(0);
      expect(result.progressByReleaseItems).toBe(0);
      expect(result.percentageNotToDo).toBe(0);
    });

    it("should calculate cycle progress with initiatives having roadmap items with null release items", () => {
      const cycle = createMockCycle({
        id: "cycle-1",
        name: "Q1 2024",
        delivery: "2024-01-01",
        end: "2024-03-31",
      });

      const initiatives: InitiativeWithProgress[] = [
        {
          id: "init-1",
          name: "Initiative with Null Release Items",
          roadmapItems: [
            {
              ...createMockRoadmapItemWithProgress(),
              releaseItems: null as any,
            },
          ],
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
          startMonth: "",
          endMonth: "",
          daysFromStartOfCycle: 0,
          daysInCycle: 0,
          currentDayPercentage: 0,
        },
      ];

      const result = calculateCycleProgress(cycle, initiatives);

      expect(result.weeks).toBe(0);
      expect(result.weeksDone).toBe(0);
      expect(result.weeksInProgress).toBe(0);
      expect(result.weeksTodo).toBe(0);
      expect(result.weeksNotToDo).toBe(0);
      expect(result.weeksCancelled).toBe(0);
      expect(result.weeksPostponed).toBe(0);
      expect(result.releaseItemsCount).toBe(0);
      expect(result.releaseItemsDoneCount).toBe(0);
      expect(result.progress).toBe(0);
      expect(result.progressWithInProgress).toBe(0);
      expect(result.progressByReleaseItems).toBe(0);
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

      const initiatives: InitiativeWithProgress[] = [];

      const result = calculateCycleProgress(cycle, initiatives);

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

      const initiatives: InitiativeWithProgress[] = [
        {
          id: "init-1",
          name: "Platform Initiative",
          roadmapItems: [createMockRoadmapItemWithProgress()],
          weeks: 4.0,
          weeksDone: 2.0,
          weeksInProgress: 2.0,
          weeksTodo: 0,
          weeksNotToDo: 0,
          weeksCancelled: 0,
          weeksPostponed: 0,
          releaseItemsCount: 2,
          releaseItemsDoneCount: 1,
          progress: 50,
          progressWithInProgress: 100,
          progressByReleaseItems: 50,
          percentageNotToDo: 0,
          startMonth: "",
          endMonth: "",
          daysFromStartOfCycle: 0,
          daysInCycle: 0,
          currentDayPercentage: 0,
        },
      ];

      const result = calculateCycleProgress(cycle, initiatives);

      expect(result.startMonth).toBe("");
      expect(result.endMonth).toBe("");
      expect(result.daysFromStartOfCycle).toBe(0);
      expect(result.daysInCycle).toBe(0);
      expect(result.currentDayPercentage).toBe(0);
    });
  });
});
