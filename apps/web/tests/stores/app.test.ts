/**
 * App Store Tests
 *
 * Unit tests for the app store functionality
 */

import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { Right } from "purify-ts";
import { useAppStore } from "../../src/stores/app-store";
import { setupTestApp } from "../setup-stores";
import type { HeadNorthConfig } from "@headnorth/config";

// Mock services
const mockHeadNorthConfig = {
  getFrontendConfig: () => ({
    getAllPages: () => [
      { id: "roadmap", name: "Roadmap", path: "/roadmap" },
      { id: "cycle-overview", name: "Cycle Overview", path: "/cycle-overview" },
    ],
    pages: {
      ROOT: { id: "roadmap" },
    },
  }),
  getValidationEnabled: () => false,
} as unknown as HeadNorthConfig;

const mockCycleDataService = {
  getCycleData: () => Promise.resolve({}),
} as any;

const mockViewFilterManager = {
  getActiveFilters: () => ({}),
  updateFilter: () => Right({}),
  getAllViewFilters: () => ({ common: {}, cycleOverview: {}, roadmap: {} }),
  switchView: () => ({}),
  setAllViewFilters: () => {},
} as any;

const mockCycleDataViewCoordinator = {
  generateFilteredRoadmapData: () => ({
    orderedCycles: [],
    roadmapItems: [],
    activeCycle: null,
    initiatives: [],
  }),
} as any;

const mockRouter = {
  push: () => {},
} as any;

describe("App Store", () => {
  beforeEach(() => {
    const { app, pinia } = setupTestApp();
    setActivePinia(pinia);
  });

  it("should initialize with default state", () => {
    const store = useAppStore();

    expect(store.isLoading).toBe(false);
    expect(store.hasError).toBe(false);
    expect(store.errorMessage).toBe(null);
    expect(store.allPages).toEqual([]);
    expect(store.currentPageId).toBe("");
  });

  it("should set loading state", () => {
    const store = useAppStore();

    store.setLoading(true);
    expect(store.isLoading).toBe(true);

    store.setLoading(false);
    expect(store.isLoading).toBe(false);
  });

  it("should set and clear error", () => {
    const store = useAppStore();

    store.setError("Test error");
    expect(store.hasError).toBe(true);
    expect(store.errorMessage).toBe("Test error");

    store.clearError();
    expect(store.hasError).toBe(false);
    expect(store.errorMessage).toBe(null);
  });

  it("should set pages", () => {
    const store = useAppStore();
    const pages = [
      { id: "test1", name: "Test 1", path: "/test1" },
      { id: "test2", name: "Test 2", path: "/test2" },
    ];

    store.setPages(pages);
    expect(store.allPages).toEqual(pages);
  });

  it("should set current page", () => {
    const store = useAppStore();

    store.setCurrentPage("test-page");
    expect(store.currentPageId).toBe("test-page");
  });

  it("should initialize app with config", () => {
    const store = useAppStore();

    store.initializeApp();

    expect(store.allPages).toHaveLength(2);
    expect(store.allPages[0].id).toBe("roadmap");
    expect(store.currentPageId).toBe("roadmap");
  });
});
