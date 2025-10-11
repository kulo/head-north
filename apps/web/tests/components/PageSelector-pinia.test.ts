/**
 * PageSelector Pinia Component Tests
 *
 * Tests for the Pinia version of PageSelector component
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import {
  useAppStore,
  useFilterStore,
  initializeStores,
} from "../../src/stores/registry";
import PageSelectorPinia from "../../src/components/ui/PageSelector-pinia.vue";

// Mock Ant Design Vue components
vi.mock("ant-design-vue", () => ({
  Select: {
    name: "a-select",
    template: '<select class="page-selector"><slot /></select>',
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

const mockOmegaConfig = {
  getFrontendConfig: () => ({
    getAllPages: () => [],
    pages: { ROOT: { id: "roadmap" } },
  }),
  getValidationEnabled: () => false,
} as any;

describe("PageSelector Pinia", () => {
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

  it("should render with pages from Pinia store", () => {
    const appStore = useAppStore();
    const filterStore = useFilterStore();

    // Set up mock pages
    const mockPages = [
      { id: "roadmap", name: "Roadmap", path: "/roadmap" },
      { id: "cycle-overview", name: "Cycle Overview", path: "/cycle-overview" },
    ];

    appStore.setPages(mockPages);
    appStore.setCurrentPage("roadmap");

    const wrapper = mount(PageSelectorPinia);

    // Test that the component mounts successfully
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.vm.allPages).toEqual(mockPages);
    expect(wrapper.vm.currentPage).toBe("roadmap");
  });

  it("should handle page selection", async () => {
    const appStore = useAppStore();
    const filterStore = useFilterStore();

    // Mock the switchView method
    const switchViewSpy = vi
      .spyOn(filterStore, "switchView")
      .mockResolvedValue(undefined);

    const mockPages = [
      { id: "roadmap", name: "Roadmap", path: "/roadmap" },
      { id: "cycle-overview", name: "Cycle Overview", path: "/cycle-overview" },
    ];

    appStore.setPages(mockPages);
    appStore.setCurrentPage("roadmap");

    const wrapper = mount(PageSelectorPinia);

    // Simulate page change
    await wrapper.vm.handlePageChange("cycle-overview");

    expect(switchViewSpy).toHaveBeenCalledWith("cycle-overview", appStore);
  });

  it("should update selected value when current page changes", async () => {
    const appStore = useAppStore();
    const filterStore = useFilterStore();

    const mockPages = [
      { id: "roadmap", name: "Roadmap", path: "/roadmap" },
      { id: "cycle-overview", name: "Cycle Overview", path: "/cycle-overview" },
    ];

    appStore.setPages(mockPages);
    appStore.setCurrentPage("roadmap");

    const wrapper = mount(PageSelectorPinia);

    // Change current page
    appStore.setCurrentPage("cycle-overview");
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.selectedPageValue).toBe("cycle-overview");
  });
});
