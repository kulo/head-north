import { createStore, ActionContext } from "vuex";
import { CycleDataService } from "../services/index";
import { logger } from "@omega/utils";
import { dataProcessor } from "../lib/processors/data-processor";
import { filter } from "../lib/filters/filter";
import { viewFilterManager } from "../lib/filters/view-filter-manager";
import {
  calculateReleaseItemProgress,
  calculateCycleMetadata,
  aggregateProgressMetrics,
} from "../lib/calculations/cycle-calculations";
import type { OmegaConfig } from "@omega/config";
import type { Router } from "vue-router";
import type {
  Cycle,
  CycleId,
  CycleData,
  Person,
  Initiative,
  Area,
  Stage,
} from "@omega/types";
import type {
  StoreState,
  FilterCriteria,
  ViewFilterCriteria,
  NestedCycleData,
  RoadmapData,
  CycleOverviewData,
  Page,
  CycleWithProgress,
  InitiativeWithProgress,
} from "../types/ui-types";

/**
 * Determines the best cycle to select based on availability and priority
 * Priority: active cycles (oldest first) -> future cycles (oldest first) -> closed cycles (oldest first)
 * @param cycles - Array of available cycles
 * @returns Selected cycle or null if no cycles available
 */
const selectBestCycle = (cycles: Cycle[]): Cycle | null => {
  if (!cycles || !Array.isArray(cycles) || cycles.length === 0) {
    return null;
  }

  // Sort cycles by start date (oldest first)
  const sortedCycles = [...cycles].sort((a, b) => {
    const dateA = new Date(a.start || a.delivery || 0).getTime();
    const dateB = new Date(b.start || b.delivery || 0).getTime();
    return dateA - dateB;
  });

  // 1. Try to find active cycles (oldest first)
  const activeCycles = sortedCycles.filter((cycle) => cycle.state === "active");
  if (activeCycles.length > 0) {
    return activeCycles[0]; // Oldest active cycle
  }

  // 2. Try to find future cycles (oldest first)
  const futureCycles = sortedCycles.filter((cycle) => {
    const cycleDate = new Date(cycle.start || cycle.delivery || 0);
    const now = new Date();
    return (
      cycleDate > now && cycle.state !== "closed" && cycle.state !== "completed"
    );
  });
  if (futureCycles.length > 0) {
    return futureCycles[0]; // Oldest future cycle
  }

  // 3. Fall back to closed cycles (oldest first)
  const closedCycles = sortedCycles.filter(
    (cycle) => cycle.state === "closed" || cycle.state === "completed",
  );
  if (closedCycles.length > 0) {
    return closedCycles[0]; // Oldest closed cycle
  }

  // 4. Last resort: return the first cycle (oldest by our sort)
  return sortedCycles[0];
};

/**
 * Calculate cycle progress data by aggregating progress from all initiatives
 * @param cycle - Basic cycle object
 * @param initiatives - Array of initiatives with progress data
 * @returns CycleWithProgress object with calculated progress metrics
 */
const calculateCycleProgress = (
  cycle: Cycle,
  initiatives: InitiativeWithProgress[],
): CycleWithProgress => {
  // Calculate cycle metadata (months, days, etc.)
  const cycleMetadata = calculateCycleMetadata(cycle);

  // Collect all release items from all initiatives
  const allReleaseItems = initiatives.flatMap(
    (initiative) =>
      initiative.roadmapItems?.flatMap(
        (roadmapItem) => roadmapItem.releaseItems || [],
      ) || [],
  );

  // Calculate progress metrics from all release items
  const progressMetrics = calculateReleaseItemProgress(allReleaseItems);

  // Combine cycle data with progress metrics and metadata
  return {
    ...cycle,
    ...progressMetrics,
    ...cycleMetadata,
  };
};

// Store factory function that accepts dependencies
export default function createAppStore(
  cycleDataService: CycleDataService,
  omegaConfig: OmegaConfig,
  router: Router,
) {
  const store = createStore<StoreState>({
    state: {
      loading: false,
      error: null,
      validationEnabled: false,
      pages: omegaConfig.getFrontendConfig().getAllPages(),
      currentPage: omegaConfig.getFrontendConfig().pages.ROOT.id,
      rawData: null,
      processedData: null,
      filters: {
        common: {},
        cycleOverview: {},
        roadmap: {},
      },
      validationSummary: [],
    },
    getters: {
      // Data getters
      roadmapData: (state): RoadmapData => {
        if (!state.processedData) {
          return {
            orderedCycles: [],
            roadmapItems: [],
            activeCycle: null,
            initiatives: [],
          };
        }
        return {
          orderedCycles: state.rawData?.cycles || [],
          roadmapItems: [],
          activeCycle: selectBestCycle(state.rawData?.cycles || []),
          initiatives: state.processedData.initiatives || [],
        };
      },
      cycleOverviewData: (state): CycleOverviewData | null => {
        if (!state.processedData || !state.rawData?.cycles?.length) {
          return null;
        }
        const selectedCycle = selectBestCycle(state.rawData.cycles);
        if (!selectedCycle) {
          return null;
        }
        return {
          cycle: selectedCycle,
          initiatives: state.processedData.initiatives || [],
        };
      },
      currentCycleOverviewData: (state): CycleOverviewData | null => {
        if (!state.processedData || !state.rawData?.cycles?.length) {
          return null;
        }
        const selectedCycle = selectBestCycle(state.rawData.cycles);
        if (!selectedCycle) {
          return null;
        }
        return {
          cycle: selectedCycle,
          initiatives: state.processedData.initiatives || [],
        };
      },

      // Metadata getters - now derived from rawData/processedData
      initiatives: (state) => state.processedData?.initiatives || [],
      areas: (state) => state.rawData?.areas || [],
      assignees: (state) => state.rawData?.assignees || [],
      stages: (state) => state.rawData?.stages || [],
      cycles: (state) => state.rawData?.cycles || [],

      // Filter getters
      currentFilters: (state) => state.filters,
      activeFilters: () => viewFilterManager.getActiveFilters(),

      // Filtered data getters
      filteredRoadmapData: (state): RoadmapData => {
        if (!state.processedData) {
          return {
            orderedCycles: [],
            roadmapItems: [],
            activeCycle: null,
            initiatives: [],
          };
        }

        // Apply filters using unified filter system
        const activeFilters = viewFilterManager.getActiveFilters();
        const filteredData = filter.apply(state.processedData, activeFilters);
        return {
          orderedCycles: state.rawData?.cycles || [],
          roadmapItems: [],
          activeCycle: selectBestCycle(state.rawData?.cycles || []),
          initiatives: filteredData.data.initiatives || [],
        };
      },
      filteredCycleOverviewData: (state): CycleOverviewData | null => {
        if (!state.processedData || !state.rawData?.cycles?.length) {
          return null;
        }

        const selectedCycle = selectBestCycle(state.rawData.cycles);
        if (!selectedCycle) {
          return null;
        }

        // Apply filters using unified filter system
        const activeFilters = viewFilterManager.getActiveFilters();
        const filteredData = filter.apply(state.processedData, activeFilters);
        const filteredInitiatives = filteredData.data.initiatives || [];

        // Calculate cycle progress data
        const cycleWithProgress = calculateCycleProgress(
          selectedCycle,
          filteredInitiatives,
        );

        return {
          cycle: cycleWithProgress,
          initiatives: filteredInitiatives,
        };
      },

      // UI state getters
      loading: (state) => state.loading,
      error: (state) => state.error,
      validationEnabled: (state) => state.validationEnabled,
      validationSummary: (state) => state.validationSummary,
      pages: (state) => state.pages,
      currentPage: (state) => state.currentPage,
    },
    mutations: {
      SET_LOADING(state, loading: boolean) {
        state.loading = loading;
      },
      SET_ERROR(state, error: string | null) {
        state.error = error;
      },
      SET_RAW_DATA(state, data: CycleData) {
        state.rawData = data;
      },
      SET_PROCESSED_DATA(state, data: NestedCycleData) {
        state.processedData = data;
      },
      SET_FILTERS(state, filters: ViewFilterCriteria) {
        state.filters = filters;
      },
      SET_VALIDATION(
        state,
        validation: {
          enabled: boolean;
          summary: Record<string, unknown>[];
        },
      ) {
        state.validationEnabled = validation.enabled;
        state.validationSummary = validation.summary;
      },
      SET_CURRENT_PAGE(state, page: string) {
        state.currentPage = page;
      },
    },
    actions: {
      async fetchAndProcessData({ commit, dispatch }) {
        try {
          commit("SET_LOADING", true);
          commit("SET_ERROR", null);

          console.log("Fetching cycle data from API");
          const cycleData = await cycleDataService.getCycleData();

          if (!cycleData) {
            throw new Error("No cycle data received from API");
          }

          console.log("Raw data received", {
            roadmapItems: cycleData.roadmapItems?.length || 0,
            releaseItems: cycleData.releaseItems?.length || 0,
            cycles: cycleData.cycles?.length || 0,
          });

          // Store raw data
          commit("SET_RAW_DATA", cycleData);

          // Process data using DataProcessor
          console.log("Processing data with DataProcessor");
          const processedData = dataProcessor.processCycleData(cycleData, {});

          if (!processedData) {
            throw new Error("Data processing failed");
          }

          console.log("Data processed successfully", {
            initiatives: processedData.initiatives?.length || 0,
          });

          // Store processed data
          commit("SET_PROCESSED_DATA", processedData);

          console.log("Data fetch and processing completed successfully");
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          console.error("Failed to fetch and process data", error);
          commit("SET_ERROR", errorMessage);
        } finally {
          commit("SET_LOADING", false);
        }
      },

      async updateFilters({ commit, state }, filters: ViewFilterCriteria) {
        try {
          commit("SET_FILTERS", filters);
          console.log("Filters updated", filters);
        } catch (error) {
          console.error("Failed to update filters", error);
          commit("SET_ERROR", "Failed to update filters");
        }
      },

      async updateFilter(
        { commit, state },
        { key, value }: { key: string; value: any },
      ) {
        try {
          // Use ViewFilterManager to handle filter updates
          const activeFilters = viewFilterManager.updateFilter(key, value);
          const allViewFilters = viewFilterManager.getAllViewFilters();

          commit("SET_FILTERS", allViewFilters);
          console.log("Filter updated", {
            key,
            value,
            activeFilters,
            allViewFilters,
          });
        } catch (error) {
          console.error("Failed to update filter", error);
          commit("SET_ERROR", "Failed to update filter");
        }
      },

      async switchView({ commit, state }, page: string) {
        try {
          commit("SET_CURRENT_PAGE", page);
          console.log("Switched to page", page);

          // Use ViewFilterManager to handle view switching and filter management
          const activeFilters = viewFilterManager.switchView(page as any);
          const allViewFilters = viewFilterManager.getAllViewFilters();

          // Update store with the structured filters from ViewFilterManager
          commit("SET_FILTERS", allViewFilters);

          console.log("View switched with filters:", {
            page,
            activeFilters,
            allViewFilters,
          });

          // Find the page in the config and navigate to its path
          const pageConfig = state.pages.find((p) => p.id === page);
          if (pageConfig) {
            router.push(pageConfig.path);
          }
        } catch (error) {
          console.error("Failed to switch view", error);
          commit("SET_ERROR", "Failed to switch view");
        }
      },

      async fetchRoadmap({ dispatch }) {
        await dispatch("fetchAndProcessData");
      },

      async fetchCycleOverviewData({ dispatch }) {
        await dispatch("fetchAndProcessData");
      },

      async fetchInitiatives({ dispatch }) {
        await dispatch("fetchAndProcessData");
      },

      async fetchAreas({ dispatch }) {
        await dispatch("fetchAndProcessData");
      },

      async fetchAssignees({ dispatch }) {
        await dispatch("fetchAndProcessData");
      },

      async fetchStages({ dispatch }) {
        await dispatch("fetchAndProcessData");
      },

      async fetchCycles({ dispatch }) {
        await dispatch("fetchAndProcessData");
      },

      async initializeFilters({ commit, state }) {
        try {
          // Initialize ViewFilterManager with current state
          viewFilterManager.setAllViewFilters(state.filters);
          console.log("Filters initialized with ViewFilterManager");
        } catch (error) {
          console.error("Failed to initialize filters", error);
          commit("SET_ERROR", "Failed to initialize filters");
        }
      },
    },
  });

  return store;
}
