/**
 * Unit tests for stages filter
 */

import { describe, it, expect } from "vitest";
import { filterByStages } from "../../src/filters/stages-filter";

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
          },
        ],
      },
    ],
  },
];

describe("filterByStages", () => {
  it("should return all items when no stages are selected", () => {
    const result = filterByStages(mockInitiatives, []);
    expect(result).toHaveLength(2);
  });

  it("should return all items when null/undefined stages are passed", () => {
    expect(filterByStages(mockInitiatives, null as any)).toHaveLength(2);
    expect(filterByStages(mockInitiatives, undefined as any)).toHaveLength(2);
  });

  it('should return all items when "all" is selected (string format)', () => {
    const result = filterByStages(mockInitiatives, ["all"]);
    expect(result).toHaveLength(2);
  });

  it('should return all items when "all" is selected (object format)', () => {
    const result = filterByStages(mockInitiatives, [
      { id: "all", name: "All Stages" },
    ]);
    expect(result).toHaveLength(2);
  });

  it('should return all items when "All Stages" is selected', () => {
    const result = filterByStages(mockInitiatives, [
      { id: "all", name: "All Stages" },
    ]);
    expect(result).toHaveLength(2);
  });

  it("should filter by specific stage (string format)", () => {
    const result = filterByStages(mockInitiatives, ["Development"]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("init-1");
  });

  it("should filter by specific stage (object format)", () => {
    const result = filterByStages(mockInitiatives, [
      { id: "Development", name: "Development" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("init-1");
  });

  it("should filter by multiple stages", () => {
    const result = filterByStages(mockInitiatives, ["Development", "Testing"]);
    expect(result).toHaveLength(2);
  });

  it("should return empty array when no stages match", () => {
    const result = filterByStages(mockInitiatives, ["Non-existent"]);
    expect(result).toHaveLength(0);
  });

  it("should handle mixed string and object formats", () => {
    const result = filterByStages(mockInitiatives, [
      "Development",
      { id: "Testing", name: "Testing" },
    ]);
    expect(result).toHaveLength(2);
  });

  it('should return all items when "all" is mixed with specific selections', () => {
    const result = filterByStages(mockInitiatives, ["Development", "all"]);
    expect(result).toHaveLength(2);
  });

  it("should handle empty string IDs", () => {
    const result = filterByStages(mockInitiatives, ["", "Development"]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("init-1");
  });

  it("should handle null/undefined items in selection", () => {
    const result = filterByStages(mockInitiatives, [
      null,
      "Development",
      undefined,
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("init-1");
  });

  it("should handle initiatives with no roadmap items", () => {
    const initiativesWithNoRoadmap = [
      {
        name: "Initiative 3",
        id: "init-3",
        roadmapItems: [],
      },
    ];
    const result = filterByStages(initiativesWithNoRoadmap, ["Development"]);
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
    const result = filterByStages(initiativesWithNoRelease, ["Development"]);
    expect(result).toHaveLength(0);
  });
});
