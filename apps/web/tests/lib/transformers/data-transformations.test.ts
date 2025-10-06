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
} from "../../../src/lib/transformers/data-transformations";

// Helper function to create mock ReleaseItem objects
const createMockReleaseItem = (overrides: Partial<any> = {}) => ({
  id: "REL-1",
  ticketId: "TICKET-1",
  effort: 1,
  projectId: "PROJ-1",
  name: "Item 1",
  areaIds: [],
  teams: [],
  status: "done",
  url: "https://example.com/REL-1",
  isExternal: false,
  stage: "done",
  assignee: { accountId: "user1", displayName: "John Doe" },
  validations: [],
  ...overrides,
});

// Helper function to create mock Cycle objects
const createMockCycle = (overrides: Partial<any> = {}) => ({
  id: "1",
  name: "Sprint 1",
  start: "2024-01-01" as const,
  end: "2024-01-14" as const,
  delivery: "2024-01-14" as const,
  state: "active" as const,
  ...overrides,
});

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
        createMockReleaseItem({
          id: "REL-1",
          status: "done",
          assignee: { accountId: "user1", displayName: "John Doe" },
        }),
        createMockReleaseItem({
          id: "REL-2",
          status: "done",
          assignee: { accountId: "user2", displayName: "Jane Smith" },
        }),
        createMockReleaseItem({
          id: "REL-3",
          status: "in-progress",
          assignee: { accountId: "user3", displayName: "Bob Wilson" },
        }),
        createMockReleaseItem({
          id: "REL-4",
          status: "todo",
          assignee: { accountId: "user4", displayName: "Alice Brown" },
        }),
      ];
      expect(calculateProgress(releaseItems)).toBe(50);
    });

    test("should return 0 when no items are done", () => {
      const releaseItems = [
        createMockReleaseItem({
          id: "REL-1",
          status: "in-progress",
          assignee: { accountId: "user1", displayName: "John Doe" },
        }),
        createMockReleaseItem({
          id: "REL-2",
          status: "todo",
          assignee: { accountId: "user2", displayName: "Jane Smith" },
        }),
      ];
      expect(calculateProgress(releaseItems)).toBe(0);
    });

    test("should return 100 when all items are done", () => {
      const releaseItems = [
        createMockReleaseItem({
          id: "REL-1",
          status: "done",
          assignee: { accountId: "user1", displayName: "John Doe" },
        }),
        createMockReleaseItem({
          id: "REL-2",
          status: "done",
          assignee: { accountId: "user2", displayName: "Jane Smith" },
        }),
      ];
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
      const releaseItems = [
        createMockReleaseItem({
          id: "REL-1",
          effort: 2,
          assignee: { accountId: "user1", displayName: "John Doe" },
        }),
        createMockReleaseItem({
          id: "REL-2",
          effort: 3,
          assignee: { accountId: "user2", displayName: "Jane Smith" },
        }),
        createMockReleaseItem({
          id: "REL-3",
          effort: 1,
          assignee: { accountId: "user3", displayName: "Bob Wilson" },
        }),
      ];
      expect(calculateTotalWeeks(releaseItems)).toBe(6);
    });

    test("should handle missing effort values", () => {
      const releaseItems = [
        createMockReleaseItem({
          id: "REL-1",
          effort: 2,
          assignee: { accountId: "user1", displayName: "John Doe" },
        }),
        createMockReleaseItem({
          id: "REL-2",
          effort: undefined,
          assignee: { accountId: "user2", displayName: "Jane Smith" },
        }),
        createMockReleaseItem({
          id: "REL-3",
          effort: 1,
          assignee: { accountId: "user3", displayName: "Bob Wilson" },
        }),
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
        createMockReleaseItem({
          id: "REL-1",
          assignee: { accountId: "user1", displayName: "John Doe" },
        }),
        createMockReleaseItem({
          id: "REL-2",
          assignee: { accountId: "user2", displayName: "Jane Smith" },
        }),
      ];
      expect(getPrimaryOwner(releaseItems)).toBe("Jane Smith");
    });

    test('should return "Unassigned" when last item has no assignee', () => {
      const releaseItems = [
        createMockReleaseItem({
          id: "REL-1",
          assignee: { accountId: "user1", displayName: "John Doe" },
        }),
        createMockReleaseItem({ id: "REL-2", assignee: null }),
      ];
      expect(getPrimaryOwner(releaseItems)).toBe("Unassigned");
    });
  });

  describe("getCycleName", () => {
    const cycles = [
      createMockCycle({ id: "1", name: "Sprint 1" }),
      createMockCycle({ id: "2", name: "Sprint 2" }),
    ];

    test("should return cycle name when found", () => {
      expect(getCycleName(cycles, "1")).toBe("Sprint 1");
    });

    test("should return default name when not found", () => {
      expect(getCycleName(cycles, "999")).toBe("Cycle 999");
    });

    test("should handle non-array cycles", () => {
      expect(getCycleName(null, "1")).toBe("Cycle 1");
    });
  });

  describe("groupRoadmapItemsByInitiative", () => {
    test("should group items by initiativeId", () => {
      const roadmapItems = [
        { id: 1, name: "Item 1", initiative: { id: "init1" } },
        { id: 2, name: "Item 2", initiative: { id: "init1" } },
        { id: 3, name: "Item 3", initiative: { id: "init2" } },
      ];

      const result = groupRoadmapItemsByInitiative(roadmapItems);
      expect(result).toEqual({
        init1: [
          { id: 1, name: "Item 1", initiative: { id: "init1" } },
          { id: 2, name: "Item 2", initiative: { id: "init1" } },
        ],
        init2: [{ id: 3, name: "Item 3", initiative: { id: "init2" } }],
      });
    });

    test("should return empty object for non-array input", () => {
      expect(groupRoadmapItemsByInitiative(null)).toEqual({});
    });
  });

  describe("transformRoadmapItem", () => {
    const cycles = [
      createMockCycle({ id: "1", name: "Sprint 1" }),
      createMockCycle({ id: "2", name: "Sprint 2" }),
    ];

    test("should transform roadmap item correctly", () => {
      const item = {
        id: "ROAD-1",
        name: "Test Roadmap Item",
        summary: "Test Roadmap Item",
        area: "test-area",
        theme: "test-theme",
        url: "https://example.com/ROAD-1",
        labels: [],
        releaseItems: [
          createMockReleaseItem({
            id: "REL-1",
            status: "done",
            effort: 2,
            assignee: { accountId: "user1", displayName: "John Doe" },
            cycleId: "1",
          }),
          createMockReleaseItem({
            id: "REL-2",
            status: "in-progress",
            effort: 1,
            assignee: { accountId: "user2", displayName: "Jane Smith" },
            cycleId: "1",
          }),
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
            ticketId: "TICKET-1",
            effort: 2,
            projectId: "PROJ-1",
            name: "Item 1",
            areaIds: [],
            teams: [],
            status: "done",
            url: "https://example.com/REL-1",
            isExternal: false,
            stage: "done",
            assignee: { accountId: "user1", displayName: "John Doe" },
            validations: [],
            cycleId: "1",
            cycle: { id: "1", name: "Sprint 1" },
          },
          {
            id: "REL-2",
            ticketId: "TICKET-1",
            effort: 1,
            projectId: "PROJ-1",
            name: "Item 1",
            areaIds: [],
            teams: [],
            status: "in-progress",
            url: "https://example.com/REL-1",
            isExternal: false,
            stage: "in-progress",
            assignee: { accountId: "user2", displayName: "Jane Smith" },
            validations: [],
            cycleId: "1",
            cycle: { id: "1", name: "Sprint 1" },
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
          createMockCycle({ id: "1", name: "Sprint 1" }),
          createMockCycle({ id: "2", name: "Sprint 2" }),
        ],
        roadmapItems: [
          {
            id: "ROAD-1",
            name: "Item 1",
            summary: "Item 1",
            initiative: { id: "init1", name: "Initiative 1" },
            area: "test-area",
            theme: "test-theme",
            url: "https://example.com/ROAD-1",
            labels: [],
            releaseItems: [],
          },
        ],
        releaseItems: [],
        areas: [],
        initiatives: [],
        assignees: [],
        stages: [],
      };

      const result = transformForCycleOverview(rawData);

      expect(result).toHaveProperty("cycle");
      expect(result).toHaveProperty("initiatives");
      expect(result.cycle).toBeDefined();
      expect(result.initiatives).toHaveLength(1);
      expect(result.initiatives[0]).toMatchObject({
        id: "init1",
        name: "init1",
        roadmapItems: expect.arrayContaining([
          expect.objectContaining({
            id: "ROAD-1",
            name: "Item 1",
          }),
        ]),
      });
    });

    test("should handle invalid input", () => {
      expect(transformForCycleOverview(null)).toEqual({
        cycle: null,
        initiatives: [],
      });
    });
  });

  describe("transformForRoadmap", () => {
    test("should transform raw data for roadmap", () => {
      const rawData = {
        cycles: [createMockCycle({ id: "1", name: "Sprint 1" })],
        roadmapItems: [
          {
            id: "ROAD-1",
            name: "Item 1",
            summary: "Item 1",
            initiative: { name: "init1" },
            area: "test-area",
            theme: "test-theme",
            url: "https://example.com/ROAD-1",
            labels: [],
            releaseItems: [],
          },
        ],
        releaseItems: [],
        areas: [],
        initiatives: [],
        assignees: [],
        stages: [],
      };

      const result = transformForRoadmap(rawData);

      expect(result).toHaveProperty("initiatives");
      expect(result.initiatives).toHaveLength(1);
      expect(result.initiatives[0]).toMatchObject({
        id: "init1",
        name: "init1",
        roadmapItems: expect.arrayContaining([
          expect.objectContaining({
            id: "ROAD-1",
            name: "Item 1",
          }),
        ]),
      });
    });

    test("should handle invalid input", () => {
      expect(transformForRoadmap(null)).toEqual({ initiatives: [] });
    });
  });

  describe("calculateCycleProgress", () => {
    test("should calculate cycle progress correctly", () => {
      const cycles = [
        createMockCycle({ id: "1", name: "Sprint 1" }),
        createMockCycle({ id: "2", name: "Sprint 2" }),
      ];

      const releaseItems = [
        createMockReleaseItem({ id: "REL-1", cycleId: "1", status: "done" }),
        createMockReleaseItem({
          id: "REL-2",
          cycleId: "1",
          status: "in-progress",
        }),
        createMockReleaseItem({ id: "REL-3", cycleId: "2", status: "done" }),
      ];

      const result = calculateCycleProgress(cycles, releaseItems);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: "1", name: "Sprint 1" });
      expect(result[1]).toMatchObject({ id: "2", name: "Sprint 2" });
    });

    test("should handle cycles with no issues", () => {
      const cycles = [createMockCycle({ id: "1", name: "Sprint 1" })];
      const releaseItems = [];

      const result = calculateCycleProgress(cycles, releaseItems);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: "1", name: "Sprint 1" });
    });
  });
});
