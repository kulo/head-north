/**
 * Unit tests for assignees filter
 */

import { describe, it, expect } from "vitest";
import { filterByAssignees } from "../assignee-filter";

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

describe("filterByAssignees", () => {
  it("should return all items when no assignees are selected", () => {
    const result = filterByAssignees(mockInitiatives, []);
    expect(result).toHaveLength(2);
  });

  it("should return all items when null/undefined assignees are passed", () => {
    expect(filterByAssignees(mockInitiatives, null as any)).toHaveLength(2);
    expect(filterByAssignees(mockInitiatives, undefined as any)).toHaveLength(
      2,
    );
  });

  it('should return all items when "all" is selected (string format)', () => {
    const result = filterByAssignees(mockInitiatives, ["all"]);
    expect(result).toHaveLength(2);
  });

  it('should return all items when "all" is selected (object format)', () => {
    const result = filterByAssignees(mockInitiatives, [
      { id: "all", name: "All Assignees" },
    ]);
    expect(result).toHaveLength(2);
  });

  it('should return all items when "All Assignees" is selected', () => {
    const result = filterByAssignees(mockInitiatives, [
      { id: "all", name: "All Assignees" },
    ]);
    expect(result).toHaveLength(2);
  });

  it("should return all items when undefined assignee is selected", () => {
    const result = filterByAssignees(mockInitiatives, [undefined]);
    expect(result).toHaveLength(2);
  });

  it("should filter by specific assignee ID (string format)", () => {
    const result = filterByAssignees(mockInitiatives, ["user-1"]);
    expect(result).toHaveLength(1);
    expect(result[0].initiativeId).toBe("init-1");
  });

  it("should filter by specific assignee ID (object format)", () => {
    const result = filterByAssignees(mockInitiatives, [
      { id: "user-1", name: "John Doe" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].initiativeId).toBe("init-1");
  });

  it("should filter by multiple assignee IDs", () => {
    const result = filterByAssignees(mockInitiatives, ["user-1", "user-2"]);
    expect(result).toHaveLength(2);
  });

  it("should return empty array when no assignees match", () => {
    const result = filterByAssignees(mockInitiatives, ["non-existent"]);
    expect(result).toHaveLength(0);
  });

  it("should handle mixed string and object formats", () => {
    const result = filterByAssignees(mockInitiatives, [
      "user-1",
      { id: "user-2", name: "Jane Smith" },
    ]);
    expect(result).toHaveLength(2);
  });

  it('should return all items when "all" is mixed with specific selections', () => {
    const result = filterByAssignees(mockInitiatives, ["user-1", "all"]);
    expect(result).toHaveLength(2);
  });

  it("should handle empty string IDs", () => {
    const result = filterByAssignees(mockInitiatives, ["", "user-1"]);
    expect(result).toHaveLength(1);
    expect(result[0].initiativeId).toBe("init-1");
  });

  it("should handle null/undefined items in selection", () => {
    const result = filterByAssignees(mockInitiatives, [
      null,
      "user-1",
      undefined,
    ]);
    expect(result).toHaveLength(2); // null/undefined are treated as "all"
    expect(result[0].initiativeId).toBe("init-1");
  });

  it("should handle initiatives with no roadmap items", () => {
    const initiativesWithNoRoadmap = [
      {
        name: "Initiative 3",
        initiativeId: "init-3",
        roadmapItems: [],
      },
    ];
    const result = filterByAssignees(initiativesWithNoRoadmap, ["user-1"]);
    expect(result).toHaveLength(0);
  });

  it("should handle roadmap items with no release items", () => {
    const initiativesWithNoRelease = [
      {
        name: "Initiative 3",
        initiativeId: "init-3",
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
    const result = filterByAssignees(initiativesWithNoRelease, ["user-1"]);
    expect(result).toHaveLength(0);
  });

  it("should handle release items with string assignee", () => {
    const initiativesWithStringAssignee = [
      {
        name: "Initiative 3",
        initiativeId: "init-3",
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
                assignee: "user-3",
              },
            ],
          },
        ],
      },
    ];
    const result = filterByAssignees(initiativesWithStringAssignee, ["user-3"]);
    expect(result).toHaveLength(1);
    expect(result[0].initiativeId).toBe("init-3");
  });
});
