/**
 * Filter System Integration Tests
 * Tests the complete filtering system to ensure all filters work correctly
 */

import { filterByInitiatives } from "../initiatives-filter";
import { filterByStages } from "../stages-filter";
import { filterByAssignees } from "../assignee-filter";
import { filterByArea } from "../area-filter";
import { filterByCycle } from "../cycle-filter";

// Mock data structure that matches the transformed initiative data
const mockInitiatives = [
  {
    name: "Initiative 1",
    initiativeId: "init-1",
    roadmapItems: [
      {
        id: "roadmap-1",
        name: "Roadmap Item 1",
        area: "Engineering",
        releaseItems: [
          {
            id: "release-1",
            name: "Release Item 1",
            stage: "Development",
            assignee: { id: "user-1", name: "John Doe" },
            cycle: { id: "cycle-1", name: "Sep-Oct 2025" },
          },
        ],
      },
    ],
  },
  {
    name: "Initiative 2",
    initiativeId: "init-2",
    roadmapItems: [
      {
        id: "roadmap-2",
        name: "Roadmap Item 2",
        area: "Product",
        releaseItems: [
          {
            id: "release-2",
            name: "Release Item 2",
            stage: "Testing",
            assignee: { id: "user-2", name: "Jane Smith" },
            cycle: { id: "cycle-2", name: "Nov-Dec 2025" },
          },
        ],
      },
    ],
  },
];

describe("Filter System Integration Tests", () => {
  describe("Initiatives Filter", () => {
    test('should return all items when "all" is selected (string format)', () => {
      const result = filterByInitiatives(mockInitiatives, ["all"]);
      expect(result).toHaveLength(2);
    });

    test('should return all items when "all" is selected (object format)', () => {
      const result = filterByInitiatives(mockInitiatives, [
        { id: "all", name: "All Initiatives" },
      ]);
      expect(result).toHaveLength(2);
    });

    test("should filter by specific initiative IDs", () => {
      const result = filterByInitiatives(mockInitiatives, ["init-1"]);
      expect(result).toHaveLength(1);
      expect(result[0].initiativeId).toBe("init-1");
    });

    test("should return empty array when no initiatives match", () => {
      const result = filterByInitiatives(mockInitiatives, ["non-existent"]);
      expect(result).toHaveLength(0);
    });
  });

  describe("Stages Filter", () => {
    test('should return all items when "all" is selected (string format)', () => {
      const result = filterByStages(mockInitiatives, ["all"]);
      expect(result).toHaveLength(2);
    });

    test("should filter by specific stage", () => {
      const result = filterByStages(mockInitiatives, ["Development"]);
      expect(result).toHaveLength(1);
      expect(result[0].initiativeId).toBe("init-1");
    });
  });

  describe("Assignees Filter", () => {
    test('should return all items when "all" is selected (string format)', () => {
      const result = filterByAssignees(mockInitiatives, ["all"]);
      expect(result).toHaveLength(2);
    });

    test("should filter by specific assignee", () => {
      const result = filterByAssignees(mockInitiatives, ["user-1"]);
      expect(result).toHaveLength(1);
      expect(result[0].initiativeId).toBe("init-1");
    });
  });

  describe("Area Filter", () => {
    test('should return all items when "all" is selected', () => {
      const result = filterByArea(mockInitiatives, "all");
      expect(result).toHaveLength(2);
    });

    test("should filter by specific area", () => {
      const result = filterByArea(mockInitiatives, "Engineering");
      expect(result).toHaveLength(1);
      expect(result[0].initiativeId).toBe("init-1");
    });
  });

  describe("Cycle Filter", () => {
    test("should filter by cycle name", () => {
      const result = filterByCycle(mockInitiatives, "Sep-Oct 2025");
      expect(result).toHaveLength(1);
      expect(result[0].initiativeId).toBe("init-1");
    });
  });
});
