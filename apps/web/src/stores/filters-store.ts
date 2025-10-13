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
import { selectDefaultCycle } from "../lib/selectors/cycle-selector";
import type { ViewFilterCriteria } from "../types/ui-types";
import type { ViewFilterManager } from "../services/view-filter-manager";
import type { Router } from "vue-router";
import type { Cycle } from "@omega/types";
import type { FilterKey } from "../types/filter-types";

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
      // Depend on filters.value to ensure reactivity when filters change
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      filters.value; // This makes the computed reactive to filter changes
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

    async function updateFilter(key: FilterKey, value: unknown) {
      try {
        // Use ViewFilterManager to handle filter updates
        const activeFilters = filterManager.updateFilter(key, value);
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
      appStore: ReturnType<
        ReturnType<typeof import("./app-store").createAppStore>
      >,
    ) {
      try {
        appStore.setCurrentPage(page);
        console.log("Switched to page", page);

        // Use ViewFilterManager to handle view switching and filter management
        const activeFilters = filterManager.switchView(
          page as "cycle-overview" | "roadmap",
        );
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

    async function initializeDefaultFilters(cycles: Cycle[]) {
      try {
        // Only set default cycle if no cycle filter is currently active
        if (!activeFilters.value.cycle && cycles && cycles.length > 0) {
          const defaultCycle = selectDefaultCycle(cycles);
          if (defaultCycle) {
            await updateFilter("cycle", defaultCycle.id);
            console.log("Default cycle filter initialized:", defaultCycle.id);
          }
        }
      } catch (error) {
        console.error("Failed to initialize default filters:", error);
        throw new Error("Failed to initialize default filters");
      }
    }

    async function updateArrayFilter(
      filterKey: FilterKey,
      values: unknown[],
      allValue: string = "all",
    ) {
      try {
        // If "all" is selected or no values, clear the filter
        if (!values || values.length === 0 || values.includes(allValue)) {
          await updateFilter(filterKey, []);
          return;
        }

        // Update store with new values
        await updateFilter(filterKey, values);
      } catch (error) {
        console.error(`Failed to update ${filterKey} filter:`, error);
        throw new Error(`Failed to update ${filterKey} filter`);
      }
    }

    async function updateSingleFilter(
      filterKey: FilterKey,
      value: unknown,
      allValue: string = "all",
    ) {
      try {
        // If "all" is selected, clear the filter (set to undefined)
        const filterValue = value === allValue ? undefined : value;
        await updateFilter(filterKey, filterValue);
      } catch (error) {
        console.error(`Failed to update ${filterKey} filter:`, error);
        throw new Error(`Failed to update ${filterKey} filter`);
      }
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
      initializeDefaultFilters,
      updateArrayFilter,
      updateSingleFilter,
    };
  });
}
