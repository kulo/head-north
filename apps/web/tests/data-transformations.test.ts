/**
 * Tests for data transformation utilities
 */

import {
  calculateProgress,
  calculateTotalWeeks,
  getPrimaryOwner,
  getCycleName,
  groupRoadmapItemsByInitiative,
  transformRoadmapItem,
  transformForCycleOverview,
  transformForRoadmap,
  calculateCycleProgress,
} from "../data-transformations";

describe("Data Transformations", () => {
  describe("calculateProgress", () => {
    test("should return 0 for empty array", () => {
      expect(calculateProgress([])).toBe(0);
    });

    test("should return 0 for non-array input", () => {
      expect(calculateProgress(null)).toBe(0);
      expect(calculateProgress(undefined)).toBe(0);
    });

    test("should calculate progress correctly", () => {
      const releaseItems = [
        { status: "done" },
        { status: "done" },
        { status: "in-progress" },
        { status: "todo" },
      ];
      expect(calculateProgress(releaseItems)).toBe(50);
    });

    test("should return 0 when no items are done", () => {
      const releaseItems = [{ status: "in-progress" }, { status: "todo" }];
      expect(calculateProgress(releaseItems)).toBe(0);
    });

    test("should return 100 when all items are done", () => {
      const releaseItems = [{ status: "done" }, { status: "done" }];
      expect(calculateProgress(releaseItems)).toBe(100);
    });
  });

  describe("calculateTotalWeeks", () => {
    test("should return 0 for empty array", () => {
      expect(calculateTotalWeeks([])).toBe(0);
    });

    test("should return 0 for non-array input", () => {
      expect(calculateTotalWeeks(null)).toBe(0);
    });

    test("should calculate total weeks correctly", () => {
      const releaseItems = [{ effort: 2 }, { effort: 3 }, { effort: 1 }];
      expect(calculateTotalWeeks(releaseItems)).toBe(6);
    });

    test("should handle missing effort values", () => {
      const releaseItems = [
        { effort: 2 },
        { effort: undefined },
        { effort: 1 },
      ];
      expect(calculateTotalWeeks(releaseItems)).toBe(3);
    });
  });

  describe("getPrimaryOwner", () => {
    test('should return "Unassigned" for empty array', () => {
      expect(getPrimaryOwner([])).toBe("Unassigned");
    });

    test('should return "Unassigned" for non-array input', () => {
      expect(getPrimaryOwner(null)).toBe("Unassigned");
    });

    test("should return assignee from last item", () => {
      const releaseItems = [
        { assignee: "John Doe" },
        { assignee: "Jane Smith" },
      ];
      expect(getPrimaryOwner(releaseItems)).toBe("Jane Smith");
    });

    test('should return "Unassigned" when last item has no assignee', () => {
      const releaseItems = [{ assignee: "John Doe" }, { assignee: null }];
      expect(getPrimaryOwner(releaseItems)).toBe("Unassigned");
    });
  });

  describe("getCycleName", () => {
    const cycles = [
      { id: 1, name: "Sprint 1" },
      { id: 2, name: "Sprint 2" },
    ];

    test("should return cycle name when found", () => {
      expect(getCycleName(cycles, 1)).toBe("Sprint 1");
    });

    test("should return default name when not found", () => {
      expect(getCycleName(cycles, 999)).toBe("Cycle 999");
    });

    test("should handle non-array cycles", () => {
      expect(getCycleName(null, 1)).toBe("Cycle 1");
    });
  });

  describe("groupRoadmapItemsByInitiative", () => {
    test("should group items by initiativeId", () => {
      const roadmapItems = [
        { id: 1, initiativeId: "init1", name: "Item 1" },
        { id: 2, initiativeId: "init1", name: "Item 2" },
        { id: 3, initiativeId: "init2", name: "Item 3" },
      ];

      const result = groupRoadmapItemsByInitiative(roadmapItems);
      expect(result).toEqual({
        init1: [
          { id: 1, initiativeId: "init1", name: "Item 1" },
          { id: 2, initiativeId: "init1", name: "Item 2" },
        ],
        init2: [{ id: 3, initiativeId: "init2", name: "Item 3" }],
      });
    });

    test("should return empty object for non-array input", () => {
      expect(groupRoadmapItemsByInitiative(null)).toEqual({});
    });
  });

  describe("transformRoadmapItem", () => {
    const cycles = [
      { id: 1, name: "Sprint 1" },
      { id: 2, name: "Sprint 2" },
    ];

    test("should transform roadmap item correctly", () => {
      const item = {
        id: "ROAD-1",
        summary: "Test Roadmap Item",
        area: "test-area",
        theme: "test-theme",
        url: "https://example.com/ROAD-1",
        sprints: [
          {
            sprintId: 1,
            releaseItems: [
              { id: "REL-1", status: "done", effort: 2, assignee: "John Doe" },
              {
                id: "REL-2",
                status: "in-progress",
                effort: 1,
                assignee: "Jane Smith",
              },
            ],
          },
        ],
      };

      const result = transformRoadmapItem(item, cycles);

      expect(result).toEqual({
        id: "ROAD-1",
        name: "Test Roadmap Item",
        area: "test-area",
        theme: "test-theme",
        owner: "Jane Smith",
        progress: 50,
        weeks: 3,
        url: "https://example.com/ROAD-1",
        validations: [],
        releaseItems: [
          {
            id: "REL-1",
            status: "done",
            effort: 2,
            assignee: "John Doe",
            cycle: { id: 1, name: "Sprint 1" },
          },
          {
            id: "REL-2",
            status: "in-progress",
            effort: 1,
            assignee: "Jane Smith",
            cycle: { id: 1, name: "Sprint 1" },
          },
        ],
      });
    });

    test("should handle null input", () => {
      expect(transformRoadmapItem(null, cycles)).toBeNull();
    });
  });

  describe("transformForCycleOverview", () => {
    test("should transform raw data for cycle overview", () => {
      const rawData = {
        cycles: [
          { id: 1, name: "Sprint 1" },
          { id: 2, name: "Sprint 2" },
        ],
        roadmapItems: [
          {
            id: "ROAD-1",
            initiativeId: "init1",
            initiative: "Initiative 1",
            summary: "Item 1",
            sprints: [],
          },
        ],
        issues: [],
        issuesByRoadmapItems: {},
      };

      const result = transformForCycleOverview(rawData);

      expect(result).toEqual({
        cycles: [
          { id: 1, name: "Sprint 1" },
          { id: 2, name: "Sprint 2" },
        ],
        initiatives: [
          {
            initiativeId: "init1",
            initiative: "Initiative 1",
            roadmapItems: [
              {
                id: "ROAD-1",
                name: "Item 1",
                area: undefined,
                theme: undefined,
                owner: "Unassigned",
                progress: 0,
                weeks: 0,
                url: "https://example.com/browse/ROAD-1",
                validations: [],
                releaseItems: [],
              },
            ],
          },
        ],
      });
    });

    test("should handle invalid input", () => {
      expect(transformForCycleOverview(null)).toEqual({
        cycles: [],
        initiatives: [],
      });
    });
  });

  describe("transformForRoadmap", () => {
    test("should transform raw data for roadmap", () => {
      const rawData = {
        cycles: [{ id: 1, name: "Sprint 1" }],
        roadmapItems: [
          {
            id: "ROAD-1",
            initiativeId: "init1",
            initiative: "Initiative 1",
            summary: "Item 1",
            sprints: [],
          },
        ],
      };

      const result = transformForRoadmap(rawData);

      expect(result).toEqual({
        initiatives: [
          {
            initiativeId: "init1",
            initiative: "Initiative 1",
            roadmapItems: [
              {
                id: "ROAD-1",
                name: "Item 1",
                area: undefined,
                theme: undefined,
                owner: "Unassigned",
                progress: 0,
                weeks: 0,
                url: "https://example.com/browse/ROAD-1",
                validations: [],
                releaseItems: [],
              },
            ],
          },
        ],
      });
    });

    test("should handle invalid input", () => {
      expect(transformForRoadmap(null)).toEqual({ initiatives: [] });
    });
  });

  describe("calculateCycleProgress", () => {
    test("should calculate cycle progress correctly", () => {
      const cycles = [
        { id: 1, name: "Sprint 1" },
        { id: 2, name: "Sprint 2" },
      ];

      const issues = [
        { fields: { sprint: { id: 1 }, status: { name: "Done" } } },
        { fields: { sprint: { id: 1 }, status: { name: "In Progress" } } },
        { fields: { sprint: { id: 2 }, status: { name: "Done" } } },
      ];

      const result = calculateCycleProgress(cycles, issues);

      expect(result).toEqual([
        { id: 1, name: "Sprint 1", progress: 50 },
        { id: 2, name: "Sprint 2", progress: 100 },
      ]);
    });

    test("should handle cycles with no issues", () => {
      const cycles = [{ id: 1, name: "Sprint 1" }];
      const issues = [];

      const result = calculateCycleProgress(cycles, issues);

      expect(result).toEqual([{ id: 1, name: "Sprint 1", progress: 0 }]);
    });
  });
});
