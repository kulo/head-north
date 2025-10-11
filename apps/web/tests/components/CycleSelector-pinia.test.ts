/**
 * CycleSelector Pinia Component Tests
 *
 * Tests for the Pinia version of CycleSelector component
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import {
  useDataStore,
  useFilterStore,
  initializeStores,
} from "../../src/stores/registry";
import CycleSelectorPinia from "../../src/components/ui/CycleSelector-pinia.vue";

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
  updateFilter: vi.fn(),
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

const mockOmegaConfig = {
  getFrontendConfig: () => ({
    getAllPages: () => [],
    pages: { ROOT: { id: "roadmap" } },
  }),
  getValidationEnabled: () => false,
} as any;

describe("CycleSelector Pinia", () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    // Initialize stores with mock services
    initializeStores({
      cycleDataService: mockCycleDataService,
      viewFilterManager: mockViewFilterManager,
      cycleDataViewCoordinator: mockCycleDataViewCoordinator,
      router: mockRouter,
      config: mockOmegaConfig,
    });
  });

  it("should render with cycles from Pinia store", () => {
    const dataStore = useDataStore();
    const filterStore = useFilterStore();

    // Set up mock cycles
    const mockCycles = [
      { id: "cycle1", name: "Cycle 1", state: "active" },
      { id: "cycle2", name: "Cycle 2", state: "future" },
    ];

    // Mock the data store
    vi.spyOn(dataStore, "cycles", "get").mockReturnValue(mockCycles);

    const wrapper = mount(CycleSelectorPinia);

    // Test that the component mounts successfully
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.vm.cycles).toEqual(mockCycles);
  });

  it("should handle cycle selection", async () => {
    const dataStore = useDataStore();
    const filterStore = useFilterStore();

    const mockCycles = [{ id: "cycle1", name: "Cycle 1", state: "active" }];

    vi.spyOn(dataStore, "cycles", "get").mockReturnValue(mockCycles);

    const wrapper = mount(CycleSelectorPinia);

    // Simulate cycle change
    await wrapper.vm.handleCycleChange("cycle1");

    expect(mockViewFilterManager.updateFilter).toHaveBeenCalledWith(
      "cycle",
      "cycle1",
    );
  });

  it("should set default cycle when cycles are loaded", async () => {
    const dataStore = useDataStore();
    const filterStore = useFilterStore();

    const mockCycles = [{ id: "cycle1", name: "Cycle 1", state: "active" }];

    // Initially no cycles, then cycles are loaded
    vi.spyOn(dataStore, "cycles", "get").mockReturnValue([]);

    const wrapper = mount(CycleSelectorPinia);

    // Simulate cycles being loaded
    vi.spyOn(dataStore, "cycles", "get").mockReturnValue(mockCycles);

    // Trigger the watcher by updating the cycles
    await wrapper.vm.$nextTick();

    // The component should automatically select the first cycle
    expect(mockViewFilterManager.updateFilter).toHaveBeenCalledWith(
      "cycle",
      "cycle1",
    );
  });
});
