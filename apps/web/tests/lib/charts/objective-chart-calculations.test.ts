/**
 * Tests for Objective Chart Calculations
 *
 * Tests for pure functions extracted from ObjectiveChart.vue
 */

import { describe, it, expect } from "vitest";
import {
  sortObjectives,
  summarizeObjectives,
  calculateObjectiveRelativeValues,
  extractObjectiveTracks,
  extractObjectiveProgresses,
  extractObjectiveInProgress,
  validateChartOptions,
  getObjectiveLengthClass,
} from "../../../src/lib/charts/objective-chart-calculations";
import type { ObjectiveWithProgress } from "../../../src/types/ui-types";

/**
 * Helper to create a test objective
 */
const createObjective = (
  id: string,
  name: string,
  weeks: number,
  weeksDone: number,
  weeksInProgress: number = 0,
): ObjectiveWithProgress => ({
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
  cycleItemsCount: 0,
  cycleItemsDoneCount: 0,
  progress: weeks > 0 ? Math.round((weeksDone / weeks) * 100) : 0,
  progressWithInProgress:
    weeks > 0 ? Math.round(((weeksDone + weeksInProgress) / weeks) * 100) : 0,
  progressByCycleItems: 0,
  percentageNotToDo: 0,
  daysFromStartOfCycle: 0,
  daysInCycle: 0,
  currentDayPercentage: 0,
});

describe("sortObjectives", () => {
  it("should sort objectives by weeks in descending order", () => {
    const objectives = [
      createObjective("1", "Small", 10, 5),
      createObjective("2", "Large", 50, 25),
      createObjective("3", "Medium", 30, 15),
    ];

    const sorted = sortObjectives(objectives);

    expect(sorted[0]?.id).toBe("2"); // Largest first
    expect(sorted[1]?.id).toBe("3");
    expect(sorted[2]?.id).toBe("1");
  });

  it("should not mutate the original array", () => {
    const objectives = [
      createObjective("1", "Small", 10, 5),
      createObjective("2", "Large", 50, 25),
    ];
    const original = [...objectives];

    sortObjectives(objectives);

    expect(objectives).toEqual(original);
  });

  it("should handle empty array", () => {
    expect(sortObjectives([])).toEqual([]);
  });
});

describe("summarizeObjectives", () => {
  it("should return all objectives when count is less than max", () => {
    const objectives = [
      createObjective("1", "A", 10, 5),
      createObjective("2", "B", 20, 10),
      createObjective("3", "C", 15, 7),
    ];

    const result = summarizeObjectives(objectives, 8);

    expect(result).toHaveLength(3);
    // Objectives are sorted by weeks (descending), so order should be: B (20), C (15), A (10)
    // Note: Since count < max, summarizeObjectives sorts and returns all
    const sortedIds = result.map((i) => i.id);
    expect(sortedIds).toContain("1");
    expect(sortedIds).toContain("2");
    expect(sortedIds).toContain("3");
    // Verify sorting: largest first
    expect(result[0]?.weeks).toBe(20); // B
    expect(result[1]?.weeks).toBe(15); // C
    expect(result[2]?.weeks).toBe(10); // A
  });

  it("should summarize objectives when count exceeds max", () => {
    const objectives = Array.from({ length: 10 }, (_, i) =>
      createObjective(`obj-${i}`, `Objective ${i}`, 10 * (i + 1), 5 * (i + 1)),
    );

    const result = summarizeObjectives(objectives, 8);

    expect(result).toHaveLength(8); // 7 head + 1 "Other Projects"
    // Find "Other Projects" - it should be in the result (not necessarily at index 7 due to sorting)
    const otherProject = result.find((i) => i.id === "other");
    expect(otherProject).toBeDefined();
    expect(otherProject?.name).toBe("Other Projects");
  });

  it("should aggregate tail objectives into 'Other Projects'", () => {
    const objectives = Array.from({ length: 10 }, (_, i) =>
      createObjective(`obj-${i}`, `Objective ${i}`, 10, 5),
    );

    const result = summarizeObjectives(objectives, 8);

    const otherProject = result.find((i) => i.id === "other");
    expect(otherProject).toBeDefined();
    expect(otherProject?.weeks).toBe(30); // 3 tail objectives × 10 weeks
    expect(otherProject?.weeksDone).toBe(15); // 3 tail objectives × 5 weeks done
  });

  it("should calculate progress for summarized objective", () => {
    const objectives = Array.from({ length: 10 }, (_, i) =>
      createObjective(
        `obj-${i}`,
        `Objective ${i}`,
        100, // 50% progress each
        50,
      ),
    );

    const result = summarizeObjectives(objectives, 8);

    const otherProject = result.find((i) => i.id === "other");
    expect(otherProject?.progress).toBe(50); // 50/100 = 50%
    expect(otherProject?.progressWithInProgress).toBe(50); // 50/100 = 50%
  });

  it("should handle zero weeks in summarized objective", () => {
    const objectives = Array.from({ length: 10 }, (_, i) =>
      createObjective(`obj-${i}`, `Objective ${i}`, 0, 0),
    );

    const result = summarizeObjectives(objectives, 8);

    const otherProject = result.find((i) => i.id === "other");
    expect(otherProject?.progress).toBe(0);
    expect(otherProject?.progressWithInProgress).toBe(0);
  });

  it("should use custom maxCount", () => {
    const objectives = Array.from({ length: 15 }, (_, i) =>
      createObjective(`obj-${i}`, `Objective ${i}`, 10, 5),
    );

    const result = summarizeObjectives(objectives, 5);

    expect(result).toHaveLength(5); // 4 head + 1 "Other Projects"
  });
});

describe("calculateObjectiveRelativeValues", () => {
  it("should return empty array for empty input", () => {
    expect(calculateObjectiveRelativeValues([])).toEqual([]);
  });

  it("should calculate relative track lengths based on longest objective", () => {
    const objectives = [
      createObjective("1", "Small", 10, 5, 0), // 10 weeks
      createObjective("2", "Large", 100, 50, 0), // 100 weeks (longest)
      createObjective("3", "Medium", 50, 25, 0), // 50 weeks
    ];

    // Note: calculateObjectiveRelativeValues expects objectives sorted by weeks (largest first)
    // The result is based on first objective being the longest
    const sorted = sortObjectives(objectives);
    const result = calculateObjectiveRelativeValues(sorted);

    expect(result).toHaveLength(3);
    // Large should have longest track (first item)
    const large = result[0]; // First item after sorting
    const medium = result[1];
    const small = result[2];

    // Track lengths are relative to longest (first in sorted array)
    // Large (100 weeks) = 100% = max track length
    // Medium (50 weeks) = 50% of large
    // Small (10 weeks) = 10% of large
    expect(large?.trackLength).toBeGreaterThan(medium?.trackLength ?? 0);
    expect(medium?.trackLength).toBeGreaterThan(small?.trackLength ?? 0);
  });

  it("should calculate progress on track correctly", () => {
    const objectives = [
      createObjective("1", "Half Done", 100, 50, 0), // 50% progress
    ];

    const result = calculateObjectiveRelativeValues(objectives);

    expect(result[0]?.progress).toBe(50);
    // progressOnTrack should be proportional to trackLength
    expect(result[0]?.progressOnTrack).toBeGreaterThan(0);
    expect(result[0]?.progressOnTrack).toBeLessThanOrEqual(
      result[0]?.trackLength ?? 0,
    );
  });

  it("should handle zero progress correctly", () => {
    const objectives = [createObjective("1", "Not Started", 100, 0, 0)];

    const result = calculateObjectiveRelativeValues(objectives);

    expect(result[0]?.progress).toBe(0);
    expect(result[0]?.progressOnTrack).toBe(0);
  });

  it("should ensure all values are within safe bounds", () => {
    const objectives = [
      createObjective("1", "Test", 100, 50, 25),
      createObjective("2", "Test2", 0, 0, 0), // Edge case: zero weeks
      createObjective("3", "Test3", -10, -5, 0), // Edge case: negative
    ];

    const result = calculateObjectiveRelativeValues(objectives);

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

describe("extractObjectiveTracks", () => {
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

    const tracks = extractObjectiveTracks(chartData);

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

    const tracks = extractObjectiveTracks(chartData);

    // All should be clamped to valid range [1, 100]
    tracks.forEach((track) => {
      expect(track).toBeGreaterThanOrEqual(1);
      expect(track).toBeLessThanOrEqual(100);
      expect(isFinite(track)).toBe(true);
    });
  });
});

describe("extractObjectiveProgresses", () => {
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

    const progresses = extractObjectiveProgresses(chartData);

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

    const progresses = extractObjectiveProgresses(chartData);

    progresses.forEach((progress) => {
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
      expect(isFinite(progress)).toBe(true);
    });
  });
});

describe("extractObjectiveInProgress", () => {
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

    const inProgress = extractObjectiveInProgress(chartData);

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

    const inProgress = extractObjectiveInProgress(chartData);

    inProgress.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
      expect(isFinite(value)).toBe(true);
    });
  });
});

describe("validateChartOptions", () => {
  it("should not modify options when objective count is <= 4", () => {
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

  it("should adjust options when objective count > 4", () => {
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
    const options = { chart: {}, plotOptions: undefined };

    const result = validateChartOptions(options, 10);

    expect(result).toEqual(options);
  });
});

describe("getObjectiveLengthClass", () => {
  it("should generate CSS classes for objective count", () => {
    const classes = getObjectiveLengthClass(5);

    expect(classes["global-objectives__details-5"]).toBe(true);
    expect(classes["global-objectives__details-gt4"]).toBe(true);
  });

  it("should not include gt4 class when count <= 4", () => {
    const classes = getObjectiveLengthClass(4);

    expect(classes["global-objectives__details-4"]).toBe(true);
    expect(classes["global-objectives__details-gt4"]).toBe(false);
  });

  it("should handle count of 1", () => {
    const classes = getObjectiveLengthClass(1);

    expect(classes["global-objectives__details-1"]).toBe(true);
    expect(classes["global-objectives__details-gt4"]).toBe(false);
  });
});
