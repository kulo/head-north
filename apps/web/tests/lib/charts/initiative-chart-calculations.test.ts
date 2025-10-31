/**
 * Tests for Initiative Chart Calculations
 *
 * Tests for pure functions extracted from InitiativeChart.vue
 */

import { describe, it, expect } from "vitest";
import {
  sortInitiatives,
  summarizeInitiatives,
  calculateInitiativeRelativeValues,
  extractInitiativeTracks,
  extractInitiativeProgresses,
  extractInitiativeInProgress,
  validateChartOptions,
  getInitiativeLengthClass,
} from "../../../src/lib/charts/initiative-chart-calculations";
import type { InitiativeWithProgress } from "../../../src/types/ui-types";

/**
 * Helper to create a test initiative
 */
const createInitiative = (
  id: string,
  name: string,
  weeks: number,
  weeksDone: number,
  weeksInProgress: number = 0,
): InitiativeWithProgress => ({
  id,
  name,
  roadmapItems: [],
  weeks,
  weeksDone,
  weeksInProgress,
  weeksTodo: 0,
  weeksNotToDo: 0,
  weeksCancelled: 0,
  weeksPostponed: 0,
  releaseItemsCount: 0,
  releaseItemsDoneCount: 0,
  progress: weeks > 0 ? Math.round((weeksDone / weeks) * 100) : 0,
  progressWithInProgress:
    weeks > 0 ? Math.round(((weeksDone + weeksInProgress) / weeks) * 100) : 0,
  progressByReleaseItems: 0,
  percentageNotToDo: 0,
  startMonth: "",
  endMonth: "",
  daysFromStartOfCycle: 0,
  daysInCycle: 0,
  currentDayPercentage: 0,
});

describe("sortInitiatives", () => {
  it("should sort initiatives by weeks in descending order", () => {
    const initiatives = [
      createInitiative("1", "Small", 10, 5),
      createInitiative("2", "Large", 50, 25),
      createInitiative("3", "Medium", 30, 15),
    ];

    const sorted = sortInitiatives(initiatives);

    expect(sorted[0].id).toBe("2"); // Largest first
    expect(sorted[1].id).toBe("3");
    expect(sorted[2].id).toBe("1");
  });

  it("should not mutate the original array", () => {
    const initiatives = [
      createInitiative("1", "Small", 10, 5),
      createInitiative("2", "Large", 50, 25),
    ];
    const original = [...initiatives];

    sortInitiatives(initiatives);

    expect(initiatives).toEqual(original);
  });

  it("should handle empty array", () => {
    expect(sortInitiatives([])).toEqual([]);
  });
});

describe("summarizeInitiatives", () => {
  it("should return all initiatives when count is less than max", () => {
    const initiatives = [
      createInitiative("1", "A", 10, 5),
      createInitiative("2", "B", 20, 10),
      createInitiative("3", "C", 15, 7),
    ];

    const result = summarizeInitiatives(initiatives, 8);

    expect(result).toHaveLength(3);
    // Initiatives are sorted by weeks (descending), so order should be: B (20), C (15), A (10)
    // Note: Since count < max, summarizeInitiatives sorts and returns all
    const sortedIds = result.map((i) => i.id);
    expect(sortedIds).toContain("1");
    expect(sortedIds).toContain("2");
    expect(sortedIds).toContain("3");
    // Verify sorting: largest first
    expect(result[0].weeks).toBe(20); // B
    expect(result[1].weeks).toBe(15); // C
    expect(result[2].weeks).toBe(10); // A
  });

  it("should summarize initiatives when count exceeds max", () => {
    const initiatives = Array.from({ length: 10 }, (_, i) =>
      createInitiative(
        `init-${i}`,
        `Initiative ${i}`,
        10 * (i + 1),
        5 * (i + 1),
      ),
    );

    const result = summarizeInitiatives(initiatives, 8);

    expect(result).toHaveLength(8); // 7 head + 1 "Other Projects"
    // Find "Other Projects" - it should be in the result (not necessarily at index 7 due to sorting)
    const otherProject = result.find((i) => i.id === "other");
    expect(otherProject).toBeDefined();
    expect(otherProject?.name).toBe("Other Projects");
  });

  it("should aggregate tail initiatives into 'Other Projects'", () => {
    const initiatives = Array.from({ length: 10 }, (_, i) =>
      createInitiative(`init-${i}`, `Initiative ${i}`, 10, 5),
    );

    const result = summarizeInitiatives(initiatives, 8);

    const otherProject = result.find((i) => i.id === "other");
    expect(otherProject).toBeDefined();
    expect(otherProject?.weeks).toBe(30); // 3 tail initiatives × 10 weeks
    expect(otherProject?.weeksDone).toBe(15); // 3 tail initiatives × 5 weeks done
  });

  it("should calculate progress for summarized initiative", () => {
    const initiatives = Array.from({ length: 10 }, (_, i) =>
      createInitiative(
        `init-${i}`,
        `Initiative ${i}`,
        100, // 50% progress each
        50,
      ),
    );

    const result = summarizeInitiatives(initiatives, 8);

    const otherProject = result.find((i) => i.id === "other");
    expect(otherProject?.progress).toBe(50); // 50/100 = 50%
    expect(otherProject?.progressWithInProgress).toBe(50); // 50/100 = 50%
  });

  it("should handle zero weeks in summarized initiative", () => {
    const initiatives = Array.from({ length: 10 }, (_, i) =>
      createInitiative(`init-${i}`, `Initiative ${i}`, 0, 0),
    );

    const result = summarizeInitiatives(initiatives, 8);

    const otherProject = result.find((i) => i.id === "other");
    expect(otherProject?.progress).toBe(0);
    expect(otherProject?.progressWithInProgress).toBe(0);
  });

  it("should use custom maxCount", () => {
    const initiatives = Array.from({ length: 15 }, (_, i) =>
      createInitiative(`init-${i}`, `Initiative ${i}`, 10, 5),
    );

    const result = summarizeInitiatives(initiatives, 5);

    expect(result).toHaveLength(5); // 4 head + 1 "Other Projects"
  });
});

describe("calculateInitiativeRelativeValues", () => {
  it("should return empty array for empty input", () => {
    expect(calculateInitiativeRelativeValues([])).toEqual([]);
  });

  it("should calculate relative track lengths based on longest initiative", () => {
    const initiatives = [
      createInitiative("1", "Small", 10, 5, 0), // 10 weeks
      createInitiative("2", "Large", 100, 50, 0), // 100 weeks (longest)
      createInitiative("3", "Medium", 50, 25, 0), // 50 weeks
    ];

    // Note: calculateInitiativeRelativeValues expects initiatives sorted by weeks (largest first)
    // The result is based on first initiative being the longest
    const sorted = sortInitiatives(initiatives);
    const result = calculateInitiativeRelativeValues(sorted);

    expect(result).toHaveLength(3);
    // Large should have longest track (first item)
    const large = result[0]; // First item after sorting
    const medium = result[1];
    const small = result[2];

    // Track lengths are relative to longest (first in sorted array)
    // Large (100 weeks) = 100% = max track length
    // Medium (50 weeks) = 50% of large
    // Small (10 weeks) = 10% of large
    expect(large.trackLength).toBeGreaterThan(medium.trackLength);
    expect(medium.trackLength).toBeGreaterThan(small.trackLength);
  });

  it("should calculate progress on track correctly", () => {
    const initiatives = [
      createInitiative("1", "Half Done", 100, 50, 0), // 50% progress
    ];

    const result = calculateInitiativeRelativeValues(initiatives);

    expect(result[0].progress).toBe(50);
    // progressOnTrack should be proportional to trackLength
    expect(result[0].progressOnTrack).toBeGreaterThan(0);
    expect(result[0].progressOnTrack).toBeLessThanOrEqual(
      result[0].trackLength,
    );
  });

  it("should handle zero progress correctly", () => {
    const initiatives = [createInitiative("1", "Not Started", 100, 0, 0)];

    const result = calculateInitiativeRelativeValues(initiatives);

    expect(result[0].progress).toBe(0);
    expect(result[0].progressOnTrack).toBe(0);
  });

  it("should ensure all values are within safe bounds", () => {
    const initiatives = [
      createInitiative("1", "Test", 100, 50, 25),
      createInitiative("2", "Test2", 0, 0, 0), // Edge case: zero weeks
      createInitiative("3", "Test3", -10, -5, 0), // Edge case: negative
    ];

    const result = calculateInitiativeRelativeValues(initiatives);

    result.forEach((item) => {
      expect(item.trackLength).toBeGreaterThanOrEqual(1);
      expect(item.trackLength).toBeLessThanOrEqual(100);
      expect(item.progressOnTrack).toBeGreaterThanOrEqual(0);
      expect(item.progressOnTrack).toBeLessThanOrEqual(item.trackLength);
      expect(item.inprogressOnTrack).toBeGreaterThanOrEqual(0);
      expect(item.inprogressOnTrack).toBeLessThanOrEqual(item.trackLength);
    });
  });
});

describe("extractInitiativeTracks", () => {
  it("should extract track lengths from chart data", () => {
    const chartData = [
      {
        name: "A",
        weeks: 10,
        weeksDone: 5,
        progress: 50,
        trackLength: 50,
        progressOnTrack: 25,
        inprogressOnTrack: 30,
      },
      {
        name: "B",
        weeks: 20,
        weeksDone: 10,
        progress: 50,
        trackLength: 75,
        progressOnTrack: 37,
        inprogressOnTrack: 45,
      },
    ];

    const tracks = extractInitiativeTracks(chartData);

    expect(tracks).toEqual([50, 75]);
  });

  it("should handle invalid track lengths safely", () => {
    const chartData = [
      {
        name: "A",
        weeks: 10,
        weeksDone: 5,
        progress: 50,
        trackLength: -10,
        progressOnTrack: 5,
        inprogressOnTrack: 5,
      },
      {
        name: "B",
        weeks: 20,
        weeksDone: 10,
        progress: 50,
        trackLength: NaN,
        progressOnTrack: 10,
        inprogressOnTrack: 10,
      },
      {
        name: "C",
        weeks: 30,
        weeksDone: 15,
        progress: 50,
        trackLength: Infinity,
        progressOnTrack: 15,
        inprogressOnTrack: 15,
      },
    ];

    const tracks = extractInitiativeTracks(chartData);

    // All should be clamped to valid range [1, 100]
    tracks.forEach((track) => {
      expect(track).toBeGreaterThanOrEqual(1);
      expect(track).toBeLessThanOrEqual(100);
      expect(isFinite(track)).toBe(true);
    });
  });
});

describe("extractInitiativeProgresses", () => {
  it("should extract progress values from chart data", () => {
    const chartData = [
      {
        name: "A",
        weeks: 10,
        weeksDone: 5,
        progress: 50,
        trackLength: 50,
        progressOnTrack: 25,
        inprogressOnTrack: 30,
      },
      {
        name: "B",
        weeks: 20,
        weeksDone: 10,
        progress: 50,
        trackLength: 75,
        progressOnTrack: 37,
        inprogressOnTrack: 45,
      },
    ];

    const progresses = extractInitiativeProgresses(chartData);

    expect(progresses).toEqual([25, 37]);
  });

  it("should handle invalid progress values safely", () => {
    const chartData = [
      {
        name: "A",
        weeks: 10,
        weeksDone: 5,
        progress: 50,
        trackLength: 50,
        progressOnTrack: -5,
        inprogressOnTrack: 5,
      },
      {
        name: "B",
        weeks: 20,
        weeksDone: 10,
        progress: 50,
        trackLength: 75,
        progressOnTrack: NaN,
        inprogressOnTrack: 10,
      },
    ];

    const progresses = extractInitiativeProgresses(chartData);

    progresses.forEach((progress) => {
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
      expect(isFinite(progress)).toBe(true);
    });
  });
});

describe("extractInitiativeInProgress", () => {
  it("should extract in-progress values from chart data", () => {
    const chartData = [
      {
        name: "A",
        weeks: 10,
        weeksDone: 5,
        progress: 50,
        trackLength: 50,
        progressOnTrack: 25,
        inprogressOnTrack: 30,
      },
      {
        name: "B",
        weeks: 20,
        weeksDone: 10,
        progress: 50,
        trackLength: 75,
        progressOnTrack: 37,
        inprogressOnTrack: 45,
      },
    ];

    const inProgress = extractInitiativeInProgress(chartData);

    expect(inProgress).toEqual([30, 45]);
  });

  it("should handle invalid in-progress values safely", () => {
    const chartData = [
      {
        name: "A",
        weeks: 10,
        weeksDone: 5,
        progress: 50,
        trackLength: 50,
        progressOnTrack: 25,
        inprogressOnTrack: -10,
      },
      {
        name: "B",
        weeks: 20,
        weeksDone: 10,
        progress: 50,
        trackLength: 75,
        progressOnTrack: 37,
        inprogressOnTrack: Infinity,
      },
    ];

    const inProgress = extractInitiativeInProgress(chartData);

    inProgress.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
      expect(isFinite(value)).toBe(true);
    });
  });
});

describe("validateChartOptions", () => {
  it("should not modify options when initiative count is <= 4", () => {
    const options = {
      plotOptions: {
        radialBar: {
          hollow: { size: "30%", margin: 15 },
          track: { margin: 5 },
        },
      },
    };

    const result = validateChartOptions(options, 4);

    expect(result.plotOptions?.radialBar?.hollow?.size).toBe("30%");
    expect(result.plotOptions?.radialBar?.hollow?.margin).toBe(15);
    expect(result.plotOptions?.radialBar?.track?.margin).toBe(5);
  });

  it("should adjust options when initiative count > 4", () => {
    const options = {
      plotOptions: {
        radialBar: {
          hollow: { size: "30%", margin: 15 },
          track: { margin: 5 },
        },
      },
    };

    const result = validateChartOptions(options, 5);

    expect(result.plotOptions?.radialBar?.hollow?.size).toBe("35%");
    expect(result.plotOptions?.radialBar?.hollow?.margin).toBe(20);
    expect(result.plotOptions?.radialBar?.track?.margin).toBe(3);
  });

  it("should not mutate original options", () => {
    const options = {
      plotOptions: {
        radialBar: {
          hollow: { size: "30%", margin: 15 },
          track: { margin: 5 },
        },
      },
    };
    const original = JSON.parse(JSON.stringify(options));

    validateChartOptions(options, 5);

    expect(options).toEqual(original);
  });

  it("should handle options without plotOptions", () => {
    const options = { chart: {} };

    const result = validateChartOptions(options, 10);

    expect(result).toEqual(options);
  });
});

describe("getInitiativeLengthClass", () => {
  it("should generate CSS classes for initiative count", () => {
    const classes = getInitiativeLengthClass(5);

    expect(classes["global-initiatives__details-5"]).toBe(true);
    expect(classes["global-initiatives__details-gt4"]).toBe(true);
  });

  it("should not include gt4 class when count <= 4", () => {
    const classes = getInitiativeLengthClass(4);

    expect(classes["global-initiatives__details-4"]).toBe(true);
    expect(classes["global-initiatives__details-gt4"]).toBe(false);
  });

  it("should handle count of 1", () => {
    const classes = getInitiativeLengthClass(1);

    expect(classes["global-initiatives__details-1"]).toBe(true);
    expect(classes["global-initiatives__details-gt4"]).toBe(false);
  });
});
