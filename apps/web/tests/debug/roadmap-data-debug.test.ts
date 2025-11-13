/**
 * Debug Test: Roadmap Data Flow
 *
 * This test helps debug the "No roadmap data available" issue by
 * verifying the data flow from API to roadmap component.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useDataStore } from "../../src/stores/data-store";
import { useAppStore } from "../../src/stores/app-store";
import { useFilterStore } from "../../src/stores/filters-store";
import { setupTestApp, getMockServices } from "../setup-stores";

// Mock services
const mockCycleDataService = {
  getCycleData: vi.fn(),
};

const mockViewFilterManager = {
  getActiveFilters: vi.fn(() => ({})),
  getAllViewFilters: vi.fn(() => ({
    common: {},
    cycleOverview: {},
    roadmap: {},
  })),
  switchView: vi.fn(),
  updateFilter: vi.fn(),
  setAllViewFilters: vi.fn(),
};

const mockRouter = {
  push: vi.fn(),
};

const mockCycleDataViewCoordinator = {
  generateFilteredRoadmapData: vi.fn((rawData, processedData) => ({
    orderedCycles: rawData?.cycles || [],
    roadmapItems: [],
    activeCycle: null,
    initiatives: processedData?.initiatives || [],
  })),
};

const mockHeadNorthConfig = {
  getFrontendConfig: vi.fn(() => ({
    getAllPages: vi.fn(() => []),
    pages: { ROOT: { id: "roadmap" } },
  })),
  getValidationEnabled: vi.fn(() => false),
};

describe("Roadmap Data Debug", () => {
  beforeEach(() => {
    const { app, pinia } = setupTestApp();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  it("should have roadmapData computed property in data store", () => {
    const dataStore = useDataStore();

    // Check if roadmapData exists
    expect(dataStore.roadmapData).toBeDefined();
    expect(typeof dataStore.roadmapData).toBe("object");

    // Check initial state
    expect(dataStore.roadmapData.initiatives).toEqual([]);
    expect(dataStore.roadmapData.orderedCycles).toEqual([]);
    expect(dataStore.roadmapData.activeCycle).toBeNull();
  });

  it("should HAVE filteredRoadmapData computed property in data store", () => {
    const dataStore = useDataStore();

    // This should now exist after the fix
    expect("filteredRoadmapData" in dataStore).toBe(true);

    // Verify it's a computed property
    expect(dataStore.filteredRoadmapData).toBeDefined();
    expect(typeof dataStore.filteredRoadmapData).toBe("object");

    // Log available properties for debugging
    console.log("Available dataStore properties:", Object.keys(dataStore));
  });

  it("should process data correctly when raw data is available", async () => {
    const dataStore = useDataStore();
    const appStore = useAppStore();
    const { cycleDataService } = getMockServices();

    // Mock successful API response
    const mockCycleData = {
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
      roadmapItems: [],
      releaseItems: [],
      areas: [],
      assignees: [],
      stages: [],
      initiatives: [],
    };

    (cycleDataService as any).getCycleData.mockResolvedValue(mockCycleData);

    // Fetch and process data
    await dataStore.fetchAndProcessData();

    // Verify data was processed
    expect(dataStore.hasRawData).toBe(true);
    expect(dataStore.hasProcessedData).toBe(true);
    expect(dataStore.cycles.length).toBe(1);
    expect(dataStore.roadmapData.orderedCycles.length).toBe(1);
    expect(dataStore.roadmapData.activeCycle).toBeDefined();
  });

  it("should handle empty data gracefully", async () => {
    const dataStore = useDataStore();
    const appStore = useAppStore();
    const { cycleDataService } = getMockServices();

    // Mock empty API response
    const mockEmptyData = {
      cycles: [],
      roadmapItems: [],
      releaseItems: [],
      areas: [],
      assignees: [],
      stages: [],
      initiatives: [],
    };

    (cycleDataService as any).getCycleData.mockResolvedValue(mockEmptyData);

    // Fetch and process data
    await dataStore.fetchAndProcessData();

    // Verify empty data is handled
    expect(dataStore.hasRawData).toBe(true);
    expect(dataStore.hasProcessedData).toBe(true);
    expect(dataStore.cycles.length).toBe(0);
    expect(dataStore.roadmapData.orderedCycles.length).toBe(0);
    expect(dataStore.roadmapData.activeCycle).toBeNull();
    expect(dataStore.roadmapData.initiatives.length).toBe(0);
  });

  it("should show correct roadmap data structure", () => {
    const dataStore = useDataStore();

    // Log the structure for debugging
    console.log("Roadmap data structure:", {
      hasRoadmapData: !!dataStore.roadmapData,
      roadmapDataKeys: Object.keys(dataStore.roadmapData),
      roadmapDataType: typeof dataStore.roadmapData,
      initiativesType: typeof dataStore.roadmapData.initiatives,
      initiativesLength: dataStore.roadmapData.initiatives.length,
    });

    // Verify structure
    expect(dataStore.roadmapData).toHaveProperty("initiatives");
    expect(dataStore.roadmapData).toHaveProperty("orderedCycles");
    expect(dataStore.roadmapData).toHaveProperty("activeCycle");
    expect(dataStore.roadmapData).toHaveProperty("roadmapItems");

    expect(Array.isArray(dataStore.roadmapData.initiatives)).toBe(true);
    expect(Array.isArray(dataStore.roadmapData.orderedCycles)).toBe(true);
    expect(Array.isArray(dataStore.roadmapData.roadmapItems)).toBe(true);
  });

  it("should have filteredRoadmapData with same structure as roadmapData", () => {
    const dataStore = useDataStore();

    // Both should have the same structure
    expect(dataStore.filteredRoadmapData).toHaveProperty("initiatives");
    expect(dataStore.filteredRoadmapData).toHaveProperty("orderedCycles");
    expect(dataStore.filteredRoadmapData).toHaveProperty("activeCycle");
    expect(dataStore.filteredRoadmapData).toHaveProperty("roadmapItems");

    expect(Array.isArray(dataStore.filteredRoadmapData.initiatives)).toBe(true);
    expect(Array.isArray(dataStore.filteredRoadmapData.orderedCycles)).toBe(
      true,
    );
    expect(Array.isArray(dataStore.filteredRoadmapData.roadmapItems)).toBe(
      true,
    );

    // Log the structure for debugging
    console.log("Filtered roadmap data structure:", {
      hasFilteredRoadmapData: !!dataStore.filteredRoadmapData,
      filteredRoadmapDataKeys: Object.keys(dataStore.filteredRoadmapData),
      filteredRoadmapDataType: typeof dataStore.filteredRoadmapData,
      filteredInitiativesType: typeof dataStore.filteredRoadmapData.initiatives,
      filteredInitiativesLength:
        dataStore.filteredRoadmapData.initiatives.length,
    });
  });
});
