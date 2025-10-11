/**
 * Pinia Stores Composable
 *
 * Provides a unified interface to all Pinia stores, similar to the old useStoreData.
 * This composable helps bridge the migration from Vuex to Pinia.
 */

import { computed } from "vue";
import { useStores } from "../stores";
import { useCycleData } from "./useCycleData";
import { useFilters } from "./useFilters";
import type { CycleDataViewCoordinator } from "../services/cycle-data-view-coordinator";

export function usePiniaStores(
  cycleDataViewCoordinator: CycleDataViewCoordinator,
) {
  const stores = useStores();

  // Store state - direct access to reactive state
  const loading = computed(() => stores.app.isLoading);
  const error = computed(() => stores.app.errorMessage);
  const validationEnabled = computed(
    () => stores.validation.isValidationEnabled,
  );
  const validationSummary = computed(() => stores.validation.summary);
  const pages = computed(() => stores.app.allPages);
  const currentPage = computed(() => stores.app.currentPageId);
  const rawData = computed(() => stores.data.rawData);
  const processedData = computed(() => stores.data.processedData);
  const filters = computed(() => stores.filter.currentFilters);

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
    await stores.filter.updateFilters(newFilters);
  };

  const updateFilter = async (key: string, value: any) => {
    await stores.filter.updateFilter(key, value);
  };

  const switchView = async (page: string) => {
    await stores.filter.switchView(page, stores.app);
  };

  const initializeFilters = () => {
    stores.filter.initializeFilters();
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
    stores,
  };
}
