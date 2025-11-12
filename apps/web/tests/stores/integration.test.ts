/**
 * Store Integration Tests
 *
 * Tests for interactions between different stores
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { Right } from "purify-ts";
import { useAppStore } from "../../src/stores/app-store";
import { useDataStore } from "../../src/stores/data-store";
import { useFilterStore } from "../../src/stores/filters-store";
import { useValidationStore } from "../../src/stores/validation-store";
import { setupTestApp, getMockServices } from "../setup-stores";

// Mock services
const mockViewFilterManager = {
  getActiveFilters: vi.fn(() => ({})),
  updateFilter: vi.fn(() => Right({})),
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
    const { app, pinia } = setupTestApp();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  it("should coordinate data fetching with app state", async () => {
    const appStore = useAppStore();
    const dataStore = useDataStore();
    const { cycleDataService } = getMockServices();

    const mockData = {
      cycles: [{ id: "cycle1", name: "Cycle 1", state: "active" }],
      initiatives: [],
      areas: [],
      assignees: [],
      stages: [],
      roadmapItems: [],
      releaseItems: [],
    };

    (cycleDataService as any).getCycleData.mockResolvedValue(Right(mockData));

    // Initial state
    expect(appStore.isLoading).toBe(false);
    expect(dataStore.hasRawData).toBe(false);

    // Fetch data
    await dataStore.fetchAndProcessData();

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
    await filterStore.switchView("cycle-overview");

    expect(appStore.currentPageId).toBe("cycle-overview");
    const { viewFilterManager } = getMockServices();
    expect((viewFilterManager as any).switchView).toHaveBeenCalledWith(
      "cycle-overview",
    );
    const { router } = getMockServices();
    expect((router as any).push).toHaveBeenCalledWith("/cycle-overview");
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
    const { cycleDataService, viewFilterManager } = getMockServices();

    const mockData = {
      cycles: [{ id: "cycle1", name: "Cycle 1", state: "active" }],
      initiatives: [{ id: "init1", name: "Initiative 1" }],
      areas: [{ id: "area1", name: "Area 1" }],
      assignees: [],
      stages: [],
      roadmapItems: [],
      releaseItems: [],
    };

    (cycleDataService as any).getCycleData.mockResolvedValue(Right(mockData));

    // 1. Fetch data
    await dataStore.fetchAndProcessData();

    // 2. Switch view
    await filterStore.switchView("roadmap");

    // 3. Update filter
    await filterStore.updateFilter("area", "area1");

    // Verify final state
    expect(dataStore.hasRawData).toBe(true);
    expect(appStore.currentPageId).toBe("roadmap");
    expect((viewFilterManager as any).updateFilter).toHaveBeenCalledWith(
      "area",
      "area1",
    );
  });
});
