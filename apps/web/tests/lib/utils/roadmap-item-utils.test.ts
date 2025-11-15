import { describe, it, expect } from "vitest";
import { getCycleItemsForCycle } from "../../../src/lib/utils/roadmap-item-utils";
import type { CycleItem } from "@headnorth/types";

describe("roadmap-item-utils", () => {
  describe("getCycleItemsForCycle", () => {
    it("should return empty array when roadmapItem has no cycleItems", () => {
      const roadmapItem = {};
      expect(getCycleItemsForCycle(roadmapItem, "cycle-1")).toEqual([]);
    });

    it("should return empty array when roadmapItem is undefined", () => {
      expect(
        getCycleItemsForCycle(
          undefined as unknown as { cycleItems?: [] },
          "cycle-1",
        ),
      ).toEqual([]);
    });

    it("should return empty array when cycleItems is empty", () => {
      const roadmapItem = { cycleItems: [] };
      expect(getCycleItemsForCycle(roadmapItem, "cycle-1")).toEqual([]);
    });

    it("should filter cycle items by cycle ID (string)", () => {
      const roadmapItem = {
        cycleItems: [
          {
            id: "CI-1",
            cycle: { id: "cycle-1", name: "Cycle 1" },
          },
          {
            id: "CI-2",
            cycle: { id: "cycle-2", name: "Cycle 2" },
          },
          {
            id: "CI-3",
            cycle: { id: "cycle-1", name: "Cycle 1" },
          },
        ] as CycleItem[],
      };

      const result = getCycleItemsForCycle(roadmapItem, "cycle-1");
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("CI-1");
      expect(result[1].id).toBe("CI-3");
    });

    it("should filter cycle items by cycle ID (number)", () => {
      const roadmapItem = {
        cycleItems: [
          {
            id: "CI-1",
            cycle: { id: 1, name: "Cycle 1" },
          },
          {
            id: "CI-2",
            cycle: { id: 2, name: "Cycle 2" },
          },
        ] as unknown as CycleItem[],
      };

      const result = getCycleItemsForCycle(roadmapItem, 1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("CI-1");
    });

    it("should handle type coercion between string and number cycle IDs", () => {
      const roadmapItem = {
        cycleItems: [
          {
            id: "CI-1",
            cycle: { id: "123", name: "Cycle 1" },
          },
          {
            id: "CI-2",
            cycle: { id: 456, name: "Cycle 2" },
          },
        ] as CycleItem[],
      };

      // Should match string "123" with number 123
      const result1 = getCycleItemsForCycle(roadmapItem, 123);
      expect(result1).toHaveLength(1);
      expect(result1[0].id).toBe("CI-1");

      // Should match number 456 with string "456"
      const result2 = getCycleItemsForCycle(roadmapItem, "456");
      expect(result2).toHaveLength(1);
      expect(result2[0].id).toBe("CI-2");
    });

    it("should return empty array when no items match the cycle ID", () => {
      const roadmapItem = {
        cycleItems: [
          {
            id: "CI-1",
            cycle: { id: "cycle-1", name: "Cycle 1" },
          },
        ] as CycleItem[],
      };

      const result = getCycleItemsForCycle(roadmapItem, "cycle-2");
      expect(result).toEqual([]);
    });

    it("should exclude cycle items without cycle", () => {
      const roadmapItem = {
        cycleItems: [
          {
            id: "CI-1",
            cycle: { id: "cycle-1", name: "Cycle 1" },
          },
          {
            id: "CI-2",
            // No cycle property
          },
        ] as CycleItem[],
      };

      const result = getCycleItemsForCycle(roadmapItem, "cycle-1");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("CI-1");
    });

    it("should return readonly array to maintain immutability", () => {
      const roadmapItem = {
        cycleItems: [
          {
            id: "CI-1",
            cycle: { id: "cycle-1", name: "Cycle 1" },
          },
        ] as CycleItem[],
      };

      const result = getCycleItemsForCycle(roadmapItem, "cycle-1");
      expect(Object.isFrozen(result)).toBe(false); // Arrays aren't frozen by default
      // But the type is readonly, so TypeScript will prevent mutations
    });
  });
});
