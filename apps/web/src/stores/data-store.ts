/**
 * Data Store - Data management
 *
 * Manages raw and processed cycle data. This store handles the core data
 * fetching and processing logic.
 */

import { defineStore } from "pinia";
import { ref, computed, inject } from "vue";
import { selectDefaultCycle } from "../lib/selectors/cycle-selector";
import { useAppStore } from "./app-store";
import { useFilterStore } from "./filters-store";
import type { CycleData } from "@omega/types";
import type {
  NestedCycleData,
  RoadmapData,
  CycleOverviewData,
} from "../types/ui-types";
import type { default as CycleDataService } from "../services/cycle-data-service";
import type { CycleDataViewCoordinator } from "../services/cycle-data-view-coordinator";

export const useDataStore = defineStore("data", () => {
  // Inject services
  const dataService = inject<CycleDataService>("dataService")!;
  const coordinator = inject<CycleDataViewCoordinator>("coordinator")!;

  // State
  const rawData = ref<CycleData | null>(null);
  const processedData = ref<NestedCycleData | null>(null);

  // Getters
  const hasRawData = computed(() => rawData.value !== null);
  const hasProcessedData = computed(() => processedData.value !== null);

  const initiatives = computed(() => processedData.value?.initiatives || []);
  const areas = computed(() => rawData.value?.areas || []);
  const assignees = computed(() => rawData.value?.assignees || []);
  const stages = computed(() => rawData.value?.stages || []);
  const cycles = computed(() => rawData.value?.cycles || []);

  // Sorted cycles for consistent ordering across components
  const orderedCycles = computed(() => {
    if (!cycles.value || cycles.value.length === 0) return [];
    return [...cycles.value].sort(
      (a, b) =>
        new Date(a.start || a.delivery || 0).getTime() -
        new Date(b.start || b.delivery || 0).getTime(),
    );
  });

  // Complex getters that were in Vuex
  const roadmapData = computed((): RoadmapData => {
    console.log("🔍 Computing roadmapData:", {
      hasProcessedData: !!processedData.value,
      hasRawData: !!rawData.value,
      processedDataInitiatives: processedData.value?.initiatives?.length || 0,
      rawDataCycles: rawData.value?.cycles?.length || 0,
    });

    if (!processedData.value) {
      console.log("⚠️ No processed data available for roadmapData");
      return {
        orderedCycles: [],
        roadmapItems: [],
        activeCycle: null,
        initiatives: [],
      };
    }

    const result = {
      orderedCycles: rawData.value?.cycles || [],
      roadmapItems: [],
      activeCycle: selectDefaultCycle(rawData.value?.cycles || []),
      initiatives: processedData.value.initiatives || [],
    };

    console.log("✅ roadmapData computed:", {
      initiativesCount: result.initiatives.length,
      cyclesCount: result.orderedCycles.length,
      hasActiveCycle: !!result.activeCycle,
    });

    return result;
  });

  // Filtered roadmap data using CycleDataViewCoordinator
  const filteredRoadmapData = computed((): RoadmapData => {
    // Depend on filter store's activeFilters to ensure reactivity when filters change
    const filterStore = useFilterStore();
    // Access activeFilters to create reactive dependency
    const _ = filterStore.activeFilters;

    console.log("🔍 Computing filteredRoadmapData:", {
      hasCoordinator: !!coordinator,
      hasProcessedData: !!processedData.value,
      hasRawData: !!rawData.value,
      activeFilters: filterStore.activeFilters,
    });

    if (!processedData.value || !rawData.value) {
      console.warn(
        "⚠️ No data available for filtering, using empty roadmapData",
      );
      return {
        orderedCycles: [],
        roadmapItems: [],
        activeCycle: null,
        initiatives: [],
      };
    }

    try {
      const filtered = coordinator.generateFilteredRoadmapData(
        rawData.value,
        processedData.value,
      );

      console.log("✅ filteredRoadmapData computed:", {
        initiativesCount: filtered.initiatives?.length || 0,
        cyclesCount: filtered.orderedCycles?.length || 0,
        hasActiveCycle: !!filtered.activeCycle,
      });

      return filtered;
    } catch (error) {
      console.error("❌ Error generating filtered roadmap data:", error);
      console.warn("⚠️ Falling back to unfiltered roadmapData");
      return roadmapData.value;
    }
  });

  const cycleOverviewData = computed((): CycleOverviewData | null => {
    if (!processedData.value || !rawData.value?.cycles?.length) {
      return null;
    }
    const selectedCycle = selectDefaultCycle(rawData.value.cycles);
    if (!selectedCycle) {
      return null;
    }
    return {
      cycle: selectedCycle,
      initiatives: processedData.value.initiatives || [],
    };
  });

  // Filtered cycle overview data using CycleDataViewCoordinator
  const filteredCycleOverviewData = computed((): CycleOverviewData | null => {
    // Depend on filter store's activeFilters to ensure reactivity when filters change
    const filterStore = useFilterStore();
    // Access activeFilters to create reactive dependency
    const _ = filterStore.activeFilters;

    console.log("🔍 Computing filteredCycleOverviewData:", {
      hasCoordinator: !!coordinator,
      hasProcessedData: !!processedData.value,
      hasRawData: !!rawData.value,
      activeFilters: filterStore.activeFilters,
    });

    if (!processedData.value || !rawData.value) {
      console.warn(
        "⚠️ No data available for filtering cycle overview, using null",
      );
      return null;
    }

    try {
      const filtered = coordinator.generateFilteredCycleOverviewData(
        rawData.value,
        processedData.value,
      );

      console.log("✅ filteredCycleOverviewData computed:", {
        hasCycle: !!filtered?.cycle,
        initiativesCount: filtered?.initiatives?.length || 0,
      });

      return filtered;
    } catch (error) {
      console.error("❌ Error generating filtered cycle overview data:", error);
      console.warn("⚠️ Falling back to unfiltered cycleOverviewData");
      return cycleOverviewData.value;
    }
  });

  // Actions
  function setRawData(data: CycleData) {
    rawData.value = data;
  }

  function setProcessedData(data: NestedCycleData) {
    processedData.value = data;
  }

  async function fetchAndProcessData() {
    try {
      const appStore = useAppStore();
      appStore.setLoading(true);
      appStore.clearError();

      console.log("Fetching cycle data from API");
      const cycleData = await dataService.getCycleData();

      if (!cycleData) {
        throw new Error("No cycle data received from API");
      }

      console.log("Raw data received", {
        roadmapItems: cycleData.roadmapItems?.length || 0,
        releaseItems: cycleData.releaseItems?.length || 0,
        cycles: cycleData.cycles?.length || 0,
      });

      // Store raw data
      setRawData(cycleData);

      // Process data using coordinator
      console.log("Processing data with DataProcessor");
      const processed = coordinator.processCycleData(cycleData);

      if (!processed) {
        throw new Error("Data processing failed");
      }

      console.log("Data processed successfully", {
        initiatives: processed.initiatives?.length || 0,
      });

      // Store processed data
      setProcessedData(processed);

      console.log("Data fetch and processing completed successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to fetch and process data", error);
      const appStore = useAppStore();
      appStore.setError(errorMessage);
    } finally {
      const appStore = useAppStore();
      appStore.setLoading(false);
    }
  }

  function clearData() {
    rawData.value = null;
    processedData.value = null;
  }

  function getReleaseItemsForCycle(
    roadmapItem: { releaseItems?: unknown[] },
    cycleId: string | number,
  ) {
    if (!roadmapItem?.releaseItems) {
      return [];
    }

    // Filter release items that belong to this cycle
    // Use == for type coercion to handle string/number mismatches
    return roadmapItem.releaseItems.filter(
      (releaseItem: { cycle?: { id: string | number } }) =>
        releaseItem.cycle && releaseItem.cycle.id == cycleId,
    );
  }

  return {
    // State
    rawData,
    processedData,

    // Getters
    hasRawData,
    hasProcessedData,
    initiatives,
    areas,
    assignees,
    stages,
    cycles,
    orderedCycles,
    roadmapData,
    filteredRoadmapData,
    cycleOverviewData,
    filteredCycleOverviewData,

    // Actions
    setRawData,
    setProcessedData,
    fetchAndProcessData,
    clearData,
    getReleaseItemsForCycle,
  };
});
