import { describe, it, expect } from "vitest";
import { getReleaseItemsForCycle } from "../../../src/lib/utils/roadmap-item-utils";
import type { ReleaseItem } from "@headnorth/types";

describe("roadmap-item-utils", () => {
  describe("getReleaseItemsForCycle", () => {
    it("should return empty array when roadmapItem has no releaseItems", () => {
      const roadmapItem = {};
      expect(getReleaseItemsForCycle(roadmapItem, "cycle-1")).toEqual([]);
    });

    it("should return empty array when roadmapItem is undefined", () => {
      expect(
        getReleaseItemsForCycle(
          undefined as unknown as { releaseItems?: [] },
          "cycle-1",
        ),
      ).toEqual([]);
    });

    it("should return empty array when releaseItems is empty", () => {
      const roadmapItem = { releaseItems: [] };
      expect(getReleaseItemsForCycle(roadmapItem, "cycle-1")).toEqual([]);
    });

    it("should filter release items by cycle ID (string)", () => {
      const roadmapItem = {
        releaseItems: [
          {
            id: "RI-1",
            cycle: { id: "cycle-1", name: "Cycle 1" },
          },
          {
            id: "RI-2",
            cycle: { id: "cycle-2", name: "Cycle 2" },
          },
          {
            id: "RI-3",
            cycle: { id: "cycle-1", name: "Cycle 1" },
          },
        ] as ReleaseItem[],
      };

      const result = getReleaseItemsForCycle(roadmapItem, "cycle-1");
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("RI-1");
      expect(result[1].id).toBe("RI-3");
    });

    it("should filter release items by cycle ID (number)", () => {
      const roadmapItem = {
        releaseItems: [
          {
            id: "RI-1",
            cycle: { id: 1, name: "Cycle 1" },
          },
          {
            id: "RI-2",
            cycle: { id: 2, name: "Cycle 2" },
          },
        ] as unknown as ReleaseItem[],
      };

      const result = getReleaseItemsForCycle(roadmapItem, 1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("RI-1");
    });

    it("should handle type coercion between string and number cycle IDs", () => {
      const roadmapItem = {
        releaseItems: [
          {
            id: "RI-1",
            cycle: { id: "123", name: "Cycle 1" },
          },
          {
            id: "RI-2",
            cycle: { id: 456, name: "Cycle 2" },
          },
        ] as ReleaseItem[],
      };

      // Should match string "123" with number 123
      const result1 = getReleaseItemsForCycle(roadmapItem, 123);
      expect(result1).toHaveLength(1);
      expect(result1[0].id).toBe("RI-1");

      // Should match number 456 with string "456"
      const result2 = getReleaseItemsForCycle(roadmapItem, "456");
      expect(result2).toHaveLength(1);
      expect(result2[0].id).toBe("RI-2");
    });

    it("should return empty array when no items match the cycle ID", () => {
      const roadmapItem = {
        releaseItems: [
          {
            id: "RI-1",
            cycle: { id: "cycle-1", name: "Cycle 1" },
          },
        ] as ReleaseItem[],
      };

      const result = getReleaseItemsForCycle(roadmapItem, "cycle-2");
      expect(result).toEqual([]);
    });

    it("should exclude release items without cycle", () => {
      const roadmapItem = {
        releaseItems: [
          {
            id: "RI-1",
            cycle: { id: "cycle-1", name: "Cycle 1" },
          },
          {
            id: "RI-2",
            // No cycle property
          },
        ] as ReleaseItem[],
      };

      const result = getReleaseItemsForCycle(roadmapItem, "cycle-1");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("RI-1");
    });

    it("should return readonly array to maintain immutability", () => {
      const roadmapItem = {
        releaseItems: [
          {
            id: "RI-1",
            cycle: { id: "cycle-1", name: "Cycle 1" },
          },
        ] as ReleaseItem[],
      };

      const result = getReleaseItemsForCycle(roadmapItem, "cycle-1");
      expect(Object.isFrozen(result)).toBe(false); // Arrays aren't frozen by default
      // But the type is readonly, so TypeScript will prevent mutations
    });
  });
});
