/**
 * Data Store Tests
 *
 * Unit tests for the data store functionality
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { Right, Left } from "purify-ts";
import type { Either } from "purify-ts";
import { useDataStore } from "../../src/stores/data-store";
import { useAppStore } from "../../src/stores/app-store";
import { setupTestApp, getMockServices } from "../setup-stores";
import type { CycleData } from "@headnorth/types";

// Mock DataTransformer
vi.mock("../../lib/transformers/data-transformer", () => ({
  DataTransformer: {
    processCycleData: vi.fn((data) => ({
      objectives: data.objectives || [],
    })),
  },
}));

// Mock services
const mockCycleDataService = {
  getCycleData: vi.fn(),
} as any;

const mockViewFilterManager = {
  getActiveFilters: () => ({}),
  updateFilter: () => Right({}),
  getAllViewFilters: () => ({ common: {}, cycleOverview: {}, roadmap: {} }),
  switchView: () => ({}),
  setAllViewFilters: () => {},
} as any;

const mockCycleDataViewCoordinator = {
  processCycleData: vi.fn((_rawData: Either<Error, CycleData>) =>
    Right({
      objectives: [],
    }),
  ),
  generateFilteredRoadmapData: () => ({
    orderedCycles: [],
    roadmapItems: [],
    activeCycle: null,
    objectives: [],
  }),
} as any;

const mockRouter = {
  push: () => {},
} as any;

const mockHeadNorthConfig = {
  getFrontendConfig: () => ({
    getAllPages: () => [],
    pages: { ROOT: { id: "roadmap" } },
  }),
  getValidationEnabled: () => false,
} as any;

const mockCycleData: CycleData = {
  cycles: [
    {
      id: "cycle1",
      name: "Cycle 1",
      state: "active",
      start: "2024-01-01",
      delivery: "2024-03-01",
      end: "2024-03-31",
    },
  ],
  objectives: [{ id: "obj1", name: "Objective 1" }],
  areas: [{ id: "area1", name: "Area 1", teams: [] }],
  assignees: [{ id: "user1", name: "User 1" }],
  stages: [{ id: "stage1", name: "Stage 1" }],
  roadmapItems: [],
  cycleItems: [],
};

describe("Data Store", () => {
  beforeEach(() => {
    const { app, pinia } = setupTestApp();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const store = useDataStore();

    expect(store.hasRawData).toBe(false);
    expect(store.hasProcessedData).toBe(false);
    expect(store.objectives).toEqual([]);
    expect(store.areas).toEqual([]);
    expect(store.assignees).toEqual([]);
    expect(store.stages).toEqual([]);
    expect(store.cycles).toEqual([]);
  });

  it("should set raw data", () => {
    const store = useDataStore();

    store.setRawData(mockCycleData);
    expect(store.hasRawData).toBe(true);
    expect(store.rawData).toEqual(mockCycleData);
    expect(store.areas).toEqual(mockCycleData.areas);
    expect(store.assignees).toEqual(mockCycleData.assignees);
    expect(store.stages).toEqual(mockCycleData.stages);
    expect(store.cycles).toEqual(mockCycleData.cycles);
  });

  it("should set processed data", () => {
    const store = useDataStore();
    const processedData = { objectives: [] }; // Empty array for now

    store.setProcessedData(processedData);
    expect(store.hasProcessedData).toBe(true);
    expect(store.processedData).toEqual(processedData);
    expect(store.objectives).toEqual([]);
  });

  it("should fetch and process data successfully", async () => {
    const store = useDataStore();
    const appStore = useAppStore();
    const { cycleDataService } = getMockServices();
    (cycleDataService as any).getCycleData.mockResolvedValue(
      Right(mockCycleData),
    );

    await store.fetchAndProcessData();

    expect(appStore.isLoading).toBe(false);
    expect(appStore.hasError).toBe(false);
    expect((cycleDataService as any).getCycleData).toHaveBeenCalled();
    expect(store.hasRawData).toBe(true);
    expect(store.hasProcessedData).toBe(true);
  });

  it("should handle fetch error", async () => {
    const store = useDataStore();
    const appStore = useAppStore();
    const { cycleDataService } = getMockServices();
    const error = new Error("API Error");
    // getCycleData now returns Either, so we mock it to return Left(error)
    (cycleDataService as any).getCycleData.mockResolvedValue(Left(error));

    await store.fetchAndProcessData();

    expect(appStore.hasError).toBe(true);
    expect(appStore.errorMessage).toBe("API Error");
    expect(appStore.isLoading).toBe(false);
    expect(store.hasRawData).toBe(false);
  });

  it("should clear data", () => {
    const store = useDataStore();

    store.setRawData(mockCycleData);
    store.setProcessedData({ objectives: [] });

    store.clearData();

    expect(store.hasRawData).toBe(false);
    expect(store.hasProcessedData).toBe(false);
  });
});
