/**
 * Unit tests for initiatives filter
 */

import { describe, it, expect } from "vitest";
import { filterByInitiatives } from "../../src/filters/initiatives-filter";

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
    id: "init-2",
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

describe("filterByInitiatives", () => {
  it("should return all items when no initiatives are selected", () => {
    const result = filterByInitiatives(mockInitiatives, []);
    expect(result).toHaveLength(2);
  });

  it("should return all items when null/undefined initiatives are passed", () => {
    expect(filterByInitiatives(mockInitiatives, null as any)).toHaveLength(2);
    expect(filterByInitiatives(mockInitiatives, undefined as any)).toHaveLength(
      2,
    );
  });

  it('should return all items when "all" is selected (string format)', () => {
    const result = filterByInitiatives(mockInitiatives, ["all"]);
    expect(result).toHaveLength(2);
  });

  it('should return all items when "all" is selected (object format)', () => {
    const result = filterByInitiatives(mockInitiatives, [
      { id: "all", name: "All Initiatives" },
    ]);
    expect(result).toHaveLength(2);
  });

  it('should return all items when "All Initiatives" is selected', () => {
    const result = filterByInitiatives(mockInitiatives, [
      { id: "all", name: "All Initiatives" },
    ]);
    expect(result).toHaveLength(2);
  });

  it("should filter by specific initiative ID (string format)", () => {
    const result = filterByInitiatives(mockInitiatives, ["init-1"]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("init-1");
  });

  it("should filter by specific initiative ID (object format)", () => {
    const result = filterByInitiatives(mockInitiatives, [
      { id: "init-1", name: "Initiative 1" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("init-1");
  });

  it("should filter by multiple initiative IDs", () => {
    const result = filterByInitiatives(mockInitiatives, ["init-1", "init-2"]);
    expect(result).toHaveLength(2);
  });

  it("should return empty array when no initiatives match", () => {
    const result = filterByInitiatives(mockInitiatives, ["non-existent"]);
    expect(result).toHaveLength(0);
  });

  it("should handle mixed string and object formats", () => {
    const result = filterByInitiatives(mockInitiatives, [
      "init-1",
      { id: "init-2", name: "Initiative 2" },
    ]);
    expect(result).toHaveLength(2);
  });

  it('should return all items when "all" is mixed with specific selections', () => {
    const result = filterByInitiatives(mockInitiatives, ["init-1", "all"]);
    expect(result).toHaveLength(2);
  });

  it("should handle empty string IDs", () => {
    const result = filterByInitiatives(mockInitiatives, ["", "init-1"]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("init-1");
  });

  it("should handle null/undefined items in selection", () => {
    const result = filterByInitiatives(mockInitiatives, [
      null,
      "init-1",
      undefined,
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("init-1");
  });
});
