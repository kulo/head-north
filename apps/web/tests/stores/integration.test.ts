/**
 * Store Integration Tests
 *
 * Tests for interactions between different stores
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import {
  useAppStore,
  useDataStore,
  useFilterStore,
  useValidationStore,
  initializeStores,
} from "../../src/stores/registry";

// Mock services
const mockViewFilterManager = {
  getActiveFilters: vi.fn(() => ({})),
  updateFilter: vi.fn(),
  getAllViewFilters: vi.fn(() => ({
    common: {},
    cycleOverview: {},
    roadmap: {},
  })),
  switchView: vi.fn(() => ({})),
  setAllViewFilters: vi.fn(),
  // Add missing properties to satisfy the interface
  currentView: "cycle-overview",
  viewFilters: { common: {}, cycleOverview: {}, roadmap: {} },
  filterConfig: {},
  getCurrentView: vi.fn(() => "cycle-overview"),
  getViewFilters: vi.fn(() => ({ common: {}, cycleOverview: {}, roadmap: {} })),
  resetViewFilters: vi.fn(),
} as any;

const mockRouter = {
  push: vi.fn(),
} as any;

const mockCycleDataService = {
  getCycleData: vi.fn(),
} as any;

const mockCycleDataViewCoordinator = {
  generateFilteredRoadmapData: vi.fn((rawData, processedData) => ({
    orderedCycles: rawData?.cycles || [],
    roadmapItems: [],
    activeCycle: null,
    initiatives: processedData?.initiatives || [],
  })),
};

const mockOmegaConfig = {
  getFrontendConfig: vi.fn(() => ({
    getAllPages: vi.fn(() => [
      { id: "roadmap", name: "Roadmap", path: "/roadmap" },
      { id: "cycle-overview", name: "Cycle Overview", path: "/cycle-overview" },
    ]),
    pages: {
      ROOT: { id: "cycle-overview" },
    },
  })),
  getValidationEnabled: vi.fn(() => false),
};

describe("Store Integration", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Initialize stores with mock services
    initializeStores({
      cycleDataService: mockCycleDataService,
      viewFilterManager: mockViewFilterManager,
      cycleDataViewCoordinator: mockCycleDataViewCoordinator as any,
      router: mockRouter,
      config: mockOmegaConfig as any,
    });
  });

  it("should coordinate data fetching with app state", async () => {
    const appStore = useAppStore();
    const dataStore = useDataStore();

    const mockData = {
      cycles: [{ id: "cycle1", name: "Cycle 1", state: "active" }],
      initiatives: [],
      areas: [],
      assignees: [],
      stages: [],
      roadmapItems: [],
      releaseItems: [],
    };

    mockCycleDataService.getCycleData.mockResolvedValue(mockData);

    // Initial state
    expect(appStore.isLoading).toBe(false);
    expect(dataStore.hasRawData).toBe(false);

    // Fetch data
    await dataStore.fetchAndProcessData(appStore);

    // Verify coordination
    expect(appStore.isLoading).toBe(false);
    expect(dataStore.hasRawData).toBe(true);
    expect(appStore.hasError).toBe(false);
  });

  it("should handle filter updates with view switching", async () => {
    const appStore = useAppStore();
    const filterStore = useFilterStore();

    // Set up app store with pages
    appStore.setPages([
      { id: "roadmap", name: "Roadmap", path: "/roadmap" },
      { id: "cycle-overview", name: "Cycle Overview", path: "/cycle-overview" },
    ]);

    // Switch view
    await filterStore.switchView("cycle-overview", appStore);

    expect(appStore.currentPageId).toBe("cycle-overview");
    expect(mockViewFilterManager.switchView).toHaveBeenCalledWith(
      "cycle-overview",
    );
    expect(mockRouter.push).toHaveBeenCalledWith("/cycle-overview");
  });

  it("should coordinate validation state across stores", () => {
    const appStore = useAppStore();
    const validationStore = useValidationStore();

    // Set validation
    validationStore.setValidation({
      enabled: true,
      summary: [{ type: "error", message: "Test error" }],
    });

    expect(validationStore.isValidationEnabled).toBe(true);
    expect(validationStore.hasValidationSummary).toBe(true);

    // Simulate error in app store
    appStore.setError("Application error");

    expect(appStore.hasError).toBe(true);
    expect(validationStore.isValidationEnabled).toBe(true); // Independent state
  });

  it("should handle complex data flow", async () => {
    const appStore = useAppStore();
    const dataStore = useDataStore();
    const filterStore = useFilterStore();

    const mockData = {
      cycles: [{ id: "cycle1", name: "Cycle 1", state: "active" }],
      initiatives: [{ id: "init1", name: "Initiative 1" }],
      areas: [{ id: "area1", name: "Area 1" }],
      assignees: [],
      stages: [],
      roadmapItems: [],
      releaseItems: [],
    };

    mockCycleDataService.getCycleData.mockResolvedValue(mockData);

    // 1. Fetch data
    await dataStore.fetchAndProcessData(appStore);

    // 2. Switch view
    await filterStore.switchView("roadmap", appStore);

    // 3. Update filter
    await filterStore.updateFilter("area", "area1");

    // Verify final state
    expect(dataStore.hasRawData).toBe(true);
    expect(appStore.currentPageId).toBe("roadmap");
    expect(mockViewFilterManager.updateFilter).toHaveBeenCalledWith(
      "area",
      "area1",
    );
  });
});
