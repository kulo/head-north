/**
 * Filter Store - Filter management
 *
 * Manages all filtering logic and state. This store coordinates with
 * ViewFilterManager to handle view-specific filtering.
 */

import { defineStore } from "pinia";
import { ref, computed, inject } from "vue";
import { Either, logger } from "@omega/utils";
import { selectDefaultCycle } from "../lib/selectors/cycle-selector";
import { useAppStore } from "./app-store";
import type { ViewFilterCriteria } from "../types/ui-types";
import type { ViewFilterManager } from "../types/filter-types";
import type { Router } from "vue-router";
import type { Cycle } from "@headnorth/types";
import type { FilterKey } from "../types/filter-types";

export const useFilterStore = defineStore("filters", () => {
  // Inject services
  const filterManager = inject<ViewFilterManager>("filterManager")!;
  const routerInstance = inject<Router>("router")!;

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

  /**
   * Set filters - immutable update (creates new object)
   */
  function setFilters(newFilters: ViewFilterCriteria) {
    // Create new object for immutability to ensure Vue reactivity
    filters.value = { ...newFilters };
  }

  async function updateFilters(newFilters: ViewFilterCriteria) {
    setFilters(newFilters);
    logger.service.info("Filters updated", newFilters);
  }

  async function updateFilter(
    key: FilterKey,
    value: unknown,
  ): Promise<Either<Error, void>> {
    // Use ViewFilterManager to handle filter updates
    const result = filterManager.updateFilter(key, value);
    return result.map((activeFilters) => {
      const allViewFilters = filterManager.getAllViewFilters();
      setFilters(allViewFilters);
      logger.service.info("Filter updated", {
        key,
        value,
        activeFilters,
        allViewFilters,
      });
    });
  }

  async function switchView(page: string) {
    const appStore = useAppStore();
    appStore.setCurrentPage(page);
    logger.service.info("Switched to page", page);

    // Use ViewFilterManager to handle view switching and filter management
    const activeFilters = filterManager.switchView(
      page as "cycle-overview" | "roadmap",
    );
    const allViewFilters = filterManager.getAllViewFilters();

    // Update store with the structured filters from ViewFilterManager
    setFilters(allViewFilters);

    logger.service.info("View switched with filters:", {
      page,
      activeFilters,
      allViewFilters,
    });

    // Find the page in the config and navigate to its path
    const pageConfig = appStore.allPages.find((p) => p.id === page);
    if (pageConfig) {
      routerInstance.push(pageConfig.path);
    }
  }

  function initializeFilters() {
    // Initialize ViewFilterManager with current state
    filterManager.setAllViewFilters(filters.value);
    logger.service.info("Filters initialized with ViewFilterManager");
  }

  function clearFilters() {
    filters.value = {
      common: {},
      cycleOverview: {},
      roadmap: {},
    };
  }

  async function initializeDefaultFilters(cycles: Cycle[]) {
    // Only initialize cycle filter if we're in cycle-overview view
    // Cycle filter is not valid for other views (root, roadmap)
    const currentView = filterManager.getCurrentView();
    if (currentView !== "cycle-overview") {
      return;
    }

    // Only set default cycle if no cycle filter is currently active
    if (!activeFilters.value.cycle && cycles && cycles.length > 0) {
      const defaultCycle = selectDefaultCycle(cycles);
      if (defaultCycle) {
        const result = await updateFilter("cycle", defaultCycle.id);
        result.caseOf({
          Left: (error) => {
            logger.service.errorSafe(
              "Failed to initialize default cycle filter",
              error,
              { cycleId: defaultCycle.id },
            );
          },
          Right: () => {
            logger.service.info("Default cycle filter initialized:", {
              cycleId: defaultCycle.id,
            });
          },
        });
      }
    }
  }

  async function updateArrayFilter(
    filterKey: FilterKey,
    values: unknown[],
    allValue: string = "all",
  ): Promise<Either<Error, void>> {
    // If "all" is selected or no values, clear the filter
    if (!values || values.length === 0 || values.includes(allValue)) {
      return updateFilter(filterKey, []);
    }

    // Update store with new values
    return updateFilter(filterKey, values);
  }

  async function updateSingleFilter(
    filterKey: FilterKey,
    value: unknown,
    allValue: string = "all",
  ): Promise<Either<Error, void>> {
    // If "all" is selected, clear the filter (set to undefined)
    const filterValue = value === allValue ? undefined : value;
    return updateFilter(filterKey, filterValue);
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
