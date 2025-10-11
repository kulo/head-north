/**
 * Filter Store - Filter management
 *
 * Manages all filtering logic and state. This store coordinates with
 * ViewFilterManager to handle view-specific filtering.
 *
 * Uses factory function pattern for immutable service injection.
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { ViewFilterCriteria } from "../types/ui-types";
import type { ViewFilterManager } from "../services/view-filter-manager";
import type { Router } from "vue-router";

export function createFilterStore(
  viewFilterManager: ViewFilterManager,
  router: Router,
) {
  return defineStore("filters", () => {
    // ✅ Services are immutable constants
    const filterManager = viewFilterManager;
    const routerInstance = router;

    // State
    const filters = ref<ViewFilterCriteria>({
      common: {},
      cycleOverview: {},
      roadmap: {},
    });

    // Getters
    const currentFilters = computed(() => filters.value);

    const activeFilters = computed(() => {
      return filterManager.getActiveFilters();
    });

    // Actions

    function setFilters(newFilters: ViewFilterCriteria) {
      filters.value = newFilters;
    }

    async function updateFilters(newFilters: ViewFilterCriteria) {
      try {
        setFilters(newFilters);
        console.log("Filters updated", newFilters);
      } catch (error) {
        console.error("Failed to update filters", error);
        throw new Error("Failed to update filters");
      }
    }

    async function updateFilter(key: string, value: any) {
      try {
        // Use ViewFilterManager to handle filter updates
        const activeFilters = filterManager.updateFilter(key as any, value);
        const allViewFilters = filterManager.getAllViewFilters();

        setFilters(allViewFilters);
        console.log("Filter updated", {
          key,
          value,
          activeFilters,
          allViewFilters,
        });
      } catch (error) {
        console.error("Failed to update filter", error);
        throw new Error("Failed to update filter");
      }
    }

    async function switchView(
      page: string,
      appStore: ReturnType<typeof import("./app").createAppStore>,
    ) {
      try {
        appStore.setCurrentPage(page);
        console.log("Switched to page", page);

        // Use ViewFilterManager to handle view switching and filter management
        const activeFilters = filterManager.switchView(page as any);
        const allViewFilters = filterManager.getAllViewFilters();

        // Update store with the structured filters from ViewFilterManager
        setFilters(allViewFilters);

        console.log("View switched with filters:", {
          page,
          activeFilters,
          allViewFilters,
        });

        // Find the page in the config and navigate to its path
        const pageConfig = appStore.allPages.find((p) => p.id === page);
        if (pageConfig) {
          routerInstance.push(pageConfig.path);
        }
      } catch (error) {
        console.error("Failed to switch view", error);
        throw new Error("Failed to switch view");
      }
    }

    function initializeFilters() {
      try {
        // Initialize ViewFilterManager with current state
        filterManager.setAllViewFilters(filters.value);
        console.log("Filters initialized with ViewFilterManager");
      } catch (error) {
        console.error("Failed to initialize filters", error);
        throw new Error("Failed to initialize filters");
      }
    }

    function clearFilters() {
      filters.value = {
        common: {},
        cycleOverview: {},
        roadmap: {},
      };
    }

    return {
      // State
      filters,

      // Getters
      currentFilters,
      activeFilters,

      // Actions
      setFilters,
      updateFilters,
      updateFilter,
      switchView,
      initializeFilters,
      clearFilters,
    };
  });
}
