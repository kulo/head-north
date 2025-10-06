/**
 * Unit tests for cycle filter
 */

import { describe, it, expect } from "vitest";
import { filterByCycle } from "../../src/filters/cycle-filter";

// Mock data structure that matches the transformed initiative data
const mockInitiatives = [
  {
    name: "Initiative 1",
    id: "init-1",
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

describe("filterByCycle", () => {
  it("should return empty array when no cycle is provided", () => {
    const result = filterByCycle(mockInitiatives, null as any);
    expect(result).toHaveLength(0);
  });

  it("should return empty array when undefined cycle is provided", () => {
    const result = filterByCycle(mockInitiatives, undefined as any);
    expect(result).toHaveLength(0);
  });

  it("should return empty array when empty string cycle is provided", () => {
    const result = filterByCycle(mockInitiatives, "");
    expect(result).toHaveLength(0);
  });

  it('should return empty array when "all" cycle is provided', () => {
    const result = filterByCycle(mockInitiatives, "all");
    expect(result).toHaveLength(0);
  });

  it("should return empty array when invalid items are provided", () => {
    const result = filterByCycle(null as any, "cycle-1");
    expect(result).toHaveLength(0);
  });

  it("should return empty array when non-array items are provided", () => {
    const result = filterByCycle({} as any, "cycle-1");
    expect(result).toHaveLength(0);
  });

  it("should filter by cycle ID (string format)", () => {
    const result = filterByCycle(mockInitiatives, "cycle-1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("init-1");
  });

  it("should filter by cycle name (string format)", () => {
    const result = filterByCycle(mockInitiatives, "Sep-Oct 2025");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("init-1");
  });

  it("should filter by cycle ID (object format)", () => {
    const result = filterByCycle(mockInitiatives, {
      id: "cycle-1",
      name: "Sep-Oct 2025",
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("init-1");
  });

  it("should filter by cycle name (object format)", () => {
    const result = filterByCycle(mockInitiatives, {
      id: "cycle-2",
      name: "Nov-Dec 2025",
    });
    expect(result).toHaveLength(1);
    expect(result[0].initiativeId).toBe("init-2");
  });

  it("should return empty array when no cycles match", () => {
    const result = filterByCycle(mockInitiatives, "Non-existent");
    expect(result).toHaveLength(0);
  });

  it("should handle initiatives with no roadmap items", () => {
    const initiativesWithNoRoadmap = [
      {
        name: "Initiative 3",
        id: "init-3",
        roadmapItems: [],
      },
    ];
    const result = filterByCycle(initiativesWithNoRoadmap, "cycle-1");
    expect(result).toHaveLength(0);
  });

  it("should handle roadmap items with no release items", () => {
    const initiativesWithNoRelease = [
      {
        name: "Initiative 3",
        id: "init-3",
        roadmapItems: [
          {
            id: "roadmap-3",
            name: "Roadmap Item 3",
            area: "Engineering",
            releaseItems: [],
          },
        ],
      },
    ];
    const result = filterByCycle(initiativesWithNoRelease, "cycle-1");
    expect(result).toHaveLength(0);
  });

  it("should handle release items with no cycle information", () => {
    const initiativesWithNoCycle = [
      {
        name: "Initiative 3",
        id: "init-3",
        roadmapItems: [
          {
            id: "roadmap-3",
            name: "Roadmap Item 3",
            area: "Engineering",
            releaseItems: [
              {
                id: "release-3",
                name: "Release Item 3",
                stage: "Development",
                assignee: { id: "user-3", name: "Bob Smith" },
                // No cycle property
              },
            ],
          },
        ],
      },
    ];
    const result = filterByCycle(initiativesWithNoCycle, "cycle-1");
    expect(result).toHaveLength(0);
  });

  it("should handle release items with cycleId but no cycle object", () => {
    const initiativesWithCycleId = [
      {
        name: "Initiative 3",
        id: "init-3",
        roadmapItems: [
          {
            id: "roadmap-3",
            name: "Roadmap Item 3",
            area: "Engineering",
            releaseItems: [
              {
                id: "release-3",
                name: "Release Item 3",
                stage: "Development",
                assignee: { id: "user-3", name: "Bob Smith" },
                cycleId: "cycle-1",
                // No cycle object
              },
            ],
          },
        ],
      },
    ];
    const result = filterByCycle(initiativesWithCycleId, "cycle-1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("init-3");
  });
});
