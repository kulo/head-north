/**
 * Store Data Composable
 *
 * Vue 3 composable that bridges the simplified Vuex store with the data composables.
 * This provides a clean interface for components to access both store state and computed data.
 */

import { computed } from "vue";
import { useStore } from "vuex";
import { useCycleData } from "./useCycleData";
import { useFilters } from "./useFilters";
import type { StoreState } from "../types/ui-types";
import type { CycleDataViewCoordinator } from "../services/cycle-data-view-coordinator";

export function useStoreData(
  cycleDataViewCoordinator: CycleDataViewCoordinator,
) {
  const store = useStore<StoreState>();

  // Store state
  const loading = computed(() => store.getters.loading);
  const error = computed(() => store.getters.error);
  const validationEnabled = computed(() => store.getters.validationEnabled);
  const validationSummary = computed(() => store.getters.validationSummary);
  const pages = computed(() => store.getters.pages);
  const currentPage = computed(() => store.getters.currentPage);
  const rawData = computed(() => store.getters.rawData);
  const processedData = computed(() => store.getters.processedData);
  const filters = computed(() => store.getters.filters);

  // Cycle data with complex calculations
  const cycleData = useCycleData(cycleDataViewCoordinator, {
    rawData,
    processedData,
  });

  // Filter management
  const filterManager = useFilters(cycleDataViewCoordinator, filters.value);

  // Store actions
  const fetchAndProcessData = () => store.dispatch("fetchAndProcessData");
  const updateFilters = (filters: any) =>
    store.dispatch("updateFilters", filters);
  const updateFilter = (key: string, value: any) =>
    store.dispatch("updateFilter", { key, value });
  const switchView = (page: string) => store.dispatch("switchView", page);
  const initializeFilters = () => store.dispatch("initializeFilters");

  // Simplified fetch actions
  const fetchRoadmap = () => store.dispatch("fetchRoadmap");
  const fetchCycleOverviewData = () => store.dispatch("fetchCycleOverviewData");
  const fetchInitiatives = () => store.dispatch("fetchInitiatives");
  const fetchAreas = () => store.dispatch("fetchAreas");
  const fetchAssignees = () => store.dispatch("fetchAssignees");
  const fetchStages = () => store.dispatch("fetchStages");
  const fetchCycles = () => store.dispatch("fetchCycles");

  return {
    // Store state
    loading,
    error,
    validationEnabled,
    validationSummary,
    pages,
    currentPage,
    rawData,
    processedData,
    filters,

    // Cycle data (with complex calculations)
    ...cycleData,

    // Filter management
    ...filterManager,

    // Store actions
    fetchAndProcessData,
    updateFilters,
    updateFilter,
    switchView,
    initializeFilters,
    fetchRoadmap,
    fetchCycleOverviewData,
    fetchInitiatives,
    fetchAreas,
    fetchAssignees,
    fetchStages,
    fetchCycles,
  };
}
