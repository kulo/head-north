/**
 * PageSelector Component Tests
 *
 * Tests for the PageSelector component
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import { Right } from "purify-ts";
import { useAppStore } from "../../src/stores/app-store";
import { useFilterStore } from "../../src/stores/filters-store";
import { setupTestApp, getMockServices } from "../setup-stores";
import PageSelector from "../../src/components/ui/PageSelector.vue";

// Mock services
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

describe("PageSelector", () => {
  let testApp: ReturnType<typeof setupTestApp>;

  beforeEach(() => {
    testApp = setupTestApp();
    setActivePinia(testApp.pinia);
  });

  it("should render with pages from store", () => {
    const appStore = useAppStore();
    const filterStore = useFilterStore();

    // Set up mock pages
    const mockPages = [
      { id: "roadmap", name: "Roadmap", path: "/roadmap" },
      { id: "cycle-overview", name: "Cycle Overview", path: "/cycle-overview" },
    ];

    appStore.setPages(mockPages);
    appStore.setCurrentPage("roadmap");

    const wrapper = mount(PageSelector, {
      global: {
        plugins: [testApp.pinia],
      },
    });

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

    const wrapper = mount(PageSelector, {
      global: {
        plugins: [testApp.pinia],
      },
    });

    // Simulate page change
    await wrapper.vm.handlePageChange("cycle-overview");

    expect(switchViewSpy).toHaveBeenCalledWith("cycle-overview");
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

    const wrapper = mount(PageSelector, {
      global: {
        plugins: [testApp.pinia],
      },
    });

    // Change current page
    appStore.setCurrentPage("cycle-overview");
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.selectedPageValue).toBe("cycle-overview");
  });
});
