/**
 * Pinia Stores Composable
 *
 * Provides a unified interface to all Pinia stores, similar to the old useStoreData.
 * This composable helps bridge the migration from Vuex to Pinia.
 */

import { computed } from "vue";
import {
  useAppStore,
  useDataStore,
  useFilterStore,
  useValidationStore,
} from "../stores/registry";
import { useCycleData } from "./useCycleData";
import { useFilters } from "./useFilters";
import type { CycleDataViewCoordinator } from "../services/cycle-data-view-coordinator";
import type { FilterKey } from "../types/filter-types";

export function usePiniaStores(
  cycleDataViewCoordinator: CycleDataViewCoordinator,
) {
  const appStore = useAppStore();
  const dataStore = useDataStore();
  const filterStore = useFilterStore();
  const validationStore = useValidationStore();

  // Store state - direct access to reactive state
  const loading = computed(() => appStore.isLoading);
  const error = computed(() => appStore.errorMessage);
  const validationEnabled = computed(() => validationStore.isValidationEnabled);
  const validationSummary = computed(() => validationStore.summary);
  const pages = computed(() => appStore.allPages);
  const currentPage = computed(() => appStore.currentPageId);
  const rawData = computed(() => dataStore.rawData);
  const processedData = computed(() => dataStore.processedData);
  const filters = computed(() => filterStore.currentFilters);

  // Cycle data with complex calculations
  const cycleData = useCycleData(cycleDataViewCoordinator, {
    rawData,
    processedData,
  });

  // Filter management
  const filterManager = useFilters(cycleDataViewCoordinator, filters.value);

  // Store actions - simplified interface
  const fetchAndProcessData = async () => {
    // Note: We need to pass the actual CycleDataService instance
    // This will be fixed when we properly integrate with the service layer
    console.warn("fetchAndProcessData: CycleDataService integration pending");
  };

  const updateFilters = async (newFilters: any) => {
    await filterStore.updateFilters(newFilters);
  };

  const updateFilter = async (key: FilterKey, value: any) => {
    await filterStore.updateFilter(key, value);
  };

  const switchView = async (page: string) => {
    await filterStore.switchView(page, appStore);
  };

  const initializeFilters = () => {
    filterStore.initializeFilters();
  };

  // Simplified fetch actions
  const fetchRoadmap = fetchAndProcessData;
  const fetchCycleOverviewData = fetchAndProcessData;
  const fetchInitiatives = fetchAndProcessData;
  const fetchAreas = fetchAndProcessData;
  const fetchAssignees = fetchAndProcessData;
  const fetchStages = fetchAndProcessData;
  const fetchCycles = fetchAndProcessData;

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

    // Direct store access for advanced usage
    appStore,
    dataStore,
    filterStore,
    validationStore,
  };
}
