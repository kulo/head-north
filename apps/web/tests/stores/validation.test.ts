/**
 * Validation Store Tests
 *
 * Unit tests for the validation store functionality
 */

import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useValidationStore } from "../../src/stores/validation-store";
import { setupTestApp } from "../setup-stores";

// Mock services
const mockCycleDataService = {
  getCycleData: () => Promise.resolve({}),
} as any;

const mockViewFilterManager = {
  getActiveFilters: () => ({}),
  updateFilter: () => {},
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

const mockHeadNorthConfig = {
  getFrontendConfig: () => ({
    getAllPages: () => [],
    pages: { ROOT: { id: "roadmap" } },
  }),
  getValidationEnabled: () => false,
} as any;

describe("Validation Store", () => {
  beforeEach(() => {
    const { app, pinia } = setupTestApp();
    setActivePinia(pinia);
  });

  it("should initialize with default state", () => {
    const store = useValidationStore();

    expect(store.isValidationEnabled).toBe(false);
    expect(store.hasValidationSummary).toBe(false);
    expect(store.summary).toEqual([]);
  });

  it("should set validation state", () => {
    const store = useValidationStore();
    const validation = {
      enabled: true,
      summary: [{ type: "error", message: "Test error" }],
    };

    store.setValidation(validation);

    expect(store.isValidationEnabled).toBe(true);
    expect(store.hasValidationSummary).toBe(true);
    expect(store.summary).toEqual(validation.summary);
  });

  it("should enable and disable validation", () => {
    const store = useValidationStore();

    store.enableValidation();
    expect(store.isValidationEnabled).toBe(true);

    store.disableValidation();
    expect(store.isValidationEnabled).toBe(false);
  });

  it("should toggle validation", () => {
    const store = useValidationStore();

    expect(store.isValidationEnabled).toBe(false);

    store.toggleValidation();
    expect(store.isValidationEnabled).toBe(true);

    store.toggleValidation();
    expect(store.isValidationEnabled).toBe(false);
  });

  it("should set validation summary", () => {
    const store = useValidationStore();
    const summary = [
      { type: "error", message: "Error 1" },
      { type: "warning", message: "Warning 1" },
    ];

    store.setValidationSummary(summary);
    expect(store.summary).toEqual(summary);
    expect(store.hasValidationSummary).toBe(true);
  });

  it("should clear validation summary", () => {
    const store = useValidationStore();

    store.setValidationSummary([{ type: "error", message: "Test" }]);
    expect(store.hasValidationSummary).toBe(true);

    store.clearValidationSummary();
    expect(store.hasValidationSummary).toBe(false);
    expect(store.summary).toEqual([]);
  });
});
