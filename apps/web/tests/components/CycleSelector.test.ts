/**
 * CycleSelector Component Tests
 *
 * Tests for the CycleSelector component
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import { Right } from "purify-ts";
import { useDataStore } from "../../src/stores/data-store";
import { useFilterStore } from "../../src/stores/filters-store";
import { setupTestApp, getMockServices } from "../setup-stores";
import CycleSelector from "../../src/components/ui/CycleSelector.vue";

// Mock Ant Design Vue components
vi.mock("ant-design-vue", () => ({
  Select: {
    name: "a-select",
    template: '<select class="cycle-selector"><slot /></select>',
    props: ["value", "placeholder"],
    emits: ["change", "update:value"],
  },
  SelectOption: {
    name: "a-select-option",
    template: "<option><slot /></option>",
    props: ["value"],
  },
}));

// Mock services
const mockCycleDataService = {
  getCycleData: () => Promise.resolve({}),
} as any;

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
  push: vi.fn(),
} as any;

const mockHeadNorthConfig = {
  getFrontendConfig: () => ({
    getAllPages: () => [],
    pages: { ROOT: { id: "roadmap" } },
  }),
  getValidationEnabled: () => false,
} as any;

describe("CycleSelector", () => {
  beforeEach(() => {
    const { app, pinia } = setupTestApp();
    setActivePinia(pinia);
  });

  it("should render with cycles from store", () => {
    const dataStore = useDataStore();
    const filterStore = useFilterStore();

    // Set up mock cycles
    const mockCycles = [
      {
        id: "cycle1",
        name: "Cycle 1",
        state: "active" as const,
        start: "2024-01-01" as const,
        end: "2024-01-31" as const,
        delivery: "2024-01-31" as const,
      },
      {
        id: "cycle2",
        name: "Cycle 2",
        state: "future" as const,
        start: "2024-02-01" as const,
        end: "2024-02-29" as const,
        delivery: "2024-02-29" as const,
      },
    ];

    // Mock the data store
    vi.spyOn(dataStore, "cycles", "get").mockReturnValue(mockCycles);

    const wrapper = mount(CycleSelector);

    // Test that the component mounts successfully
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.vm.cycles).toEqual(mockCycles);
  });

  it("should handle cycle selection", async () => {
    const dataStore = useDataStore();
    const filterStore = useFilterStore();
    const { viewFilterManager } = getMockServices();

    const mockCycles = [
      {
        id: "cycle1",
        name: "Cycle 1",
        state: "active" as const,
        start: "2024-01-01" as const,
        end: "2024-01-31" as const,
        delivery: "2024-01-31" as const,
      },
    ];

    vi.spyOn(dataStore, "cycles", "get").mockReturnValue(mockCycles);

    const wrapper = mount(CycleSelector);

    // Simulate cycle change
    await wrapper.vm.handleCycleChange("cycle1");

    expect((viewFilterManager as any).updateFilter).toHaveBeenCalledWith(
      "cycle",
      "cycle1",
    );
  });

  it("should set default cycle when cycles are loaded", async () => {
    const dataStore = useDataStore();
    const filterStore = useFilterStore();
    const { viewFilterManager } = getMockServices();

    const mockCycles = [
      {
        id: "cycle1",
        name: "Cycle 1",
        state: "active" as const,
        start: "2024-01-01" as const,
        end: "2024-01-31" as const,
        delivery: "2024-01-31" as const,
      },
    ];

    // Initially no cycles, then cycles are loaded
    vi.spyOn(dataStore, "cycles", "get").mockReturnValue([]);

    const wrapper = mount(CycleSelector);

    // Simulate cycles being loaded
    vi.spyOn(dataStore, "cycles", "get").mockReturnValue(mockCycles);

    // Trigger the watcher by updating the cycles
    await wrapper.vm.$nextTick();

    // The component should automatically select the first cycle
    expect((viewFilterManager as any).updateFilter).toHaveBeenCalledWith(
      "cycle",
      "cycle1",
    );
  });
});
