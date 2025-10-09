/**
 * Filters Composable
 *
 * Vue 3 composable for managing filter state and operations.
 * Provides reactive filter management without coupling to Vuex.
 */

import { ref, computed, type Ref } from "vue";
import type { CycleDataViewCoordinator } from "../services/cycle-data-view-coordinator";
import type { ViewFilterCriteria } from "../types/ui-types";

export function useFilters(
  cycleDataViewCoordinator: CycleDataViewCoordinator,
  initialFilters?: ViewFilterCriteria,
) {
  const filters = ref<ViewFilterCriteria>(
    initialFilters || {
      common: {},
      cycleOverview: {},
      roadmap: {},
    },
  );

  const currentFilters = computed(() => filters.value);

  const updateFilter = (key: string, value: any) => {
    try {
      const updatedFilters = cycleDataViewCoordinator.updateFilter(
        key as any,
        value,
      );
      filters.value = updatedFilters;
      console.log("Filter updated", { key, value, updatedFilters });
    } catch (error) {
      console.error("Failed to update filter", error);
      throw new Error("Failed to update filter");
    }
  };

  const switchView = (page: string) => {
    try {
      const updatedFilters = cycleDataViewCoordinator.switchView(page as any);
      filters.value = updatedFilters;
      console.log("View switched with filters:", { page, updatedFilters });
    } catch (error) {
      console.error("Failed to switch view", error);
      throw new Error("Failed to switch view");
    }
  };

  const initializeFilters = () => {
    try {
      cycleDataViewCoordinator.initializeFilters(filters.value);
      console.log("Filters initialized");
    } catch (error) {
      console.error("Failed to initialize filters", error);
      throw new Error("Failed to initialize filters");
    }
  };

  return {
    filters,
    currentFilters,
    updateFilter,
    switchView,
    initializeFilters,
  };
}
