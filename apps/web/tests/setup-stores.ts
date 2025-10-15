/**
 * Test Setup for Stores
 *
 * Provides mock dependencies for store tests using Vue's provide/inject system.
 */

import { createApp } from "vue";
import { createPinia } from "pinia";
import { vi } from "vitest";

// Mock services
const mockCycleDataService = {
  getCycleData: vi.fn(() => Promise.resolve({})),
} as any;

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
  currentView: "cycle-overview",
  viewFilters: { common: {}, cycleOverview: {}, roadmap: {} },
  filterConfig: {},
  getCurrentView: vi.fn(() => "cycle-overview"),
  getViewFilters: vi.fn(() => ({ common: {}, cycleOverview: {}, roadmap: {} })),
  resetViewFilters: vi.fn(),
} as any;

const mockCycleDataViewCoordinator = {
  generateFilteredRoadmapData: vi.fn(() => ({
    orderedCycles: [],
    roadmapItems: [],
    activeCycle: null,
    initiatives: [],
  })),
  generateFilteredCycleOverviewData: vi.fn(() => ({
    cycle: null,
    initiatives: [],
  })),
} as any;

const mockRouter = {
  push: vi.fn(),
} as any;

const mockOmegaConfig = {
  getFrontendConfig: vi.fn(() => ({
    getAllPages: vi.fn(() => [
      { id: "roadmap", name: "Roadmap", path: "/roadmap" },
      { id: "cycle-overview", name: "Cycle Overview", path: "/cycle-overview" },
    ]),
    pages: {
      ROOT: { id: "roadmap" },
    },
  })),
  getValidationEnabled: vi.fn(() => false),
} as any;

/**
 * Sets up a test app with all required dependencies provided
 */
export function setupTestApp() {
  const app = createApp({});
  const pinia = createPinia();

  app.use(pinia);

  // Provide all required dependencies
  app.provide("config", mockOmegaConfig);
  app.provide("dataService", mockCycleDataService);
  app.provide("filterManager", mockViewFilterManager);
  app.provide("coordinator", mockCycleDataViewCoordinator);
  app.provide("router", mockRouter);

  return { app, pinia };
}

/**
 * Gets mock services for use in tests
 */
export function getMockServices() {
  return {
    cycleDataService: mockCycleDataService,
    viewFilterManager: mockViewFilterManager,
    cycleDataViewCoordinator: mockCycleDataViewCoordinator,
    router: mockRouter,
    config: mockOmegaConfig,
  };
}
