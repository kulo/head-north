/**
 * Simplified Vuex Store
 *
 * Focused purely on state management with minimal business logic.
 * Complex calculations and data processing have been moved to services and composables.
 */

import { createStore, ActionContext } from "vuex";
import { CycleDataService } from "../services/index";
import { createCycleDataViewCoordinator } from "../services/cycle-data-view-coordinator";
import { createViewFilterManager } from "../services/view-filter-manager";
import { logger } from "@omega/utils";
import type { OmegaConfig } from "@omega/config";
import type { Router } from "vue-router";
import type { CycleData } from "@omega/types";
import type {
  StoreState,
  ViewFilterCriteria,
  NestedCycleData,
} from "../types/ui-types";

// Store factory function that accepts dependencies
export default function createAppStore(
  cycleDataService: CycleDataService,
  omegaConfig: OmegaConfig,
  router: Router,
) {
  // Create services with dependency injection
  const viewFilterManager = createViewFilterManager(omegaConfig);
  const cycleDataViewCoordinator =
    createCycleDataViewCoordinator(viewFilterManager);

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
      // Simple state getters - no complex calculations
      loading: (state) => state.loading,
      error: (state) => state.error,
      validationEnabled: (state) => state.validationEnabled,
      validationSummary: (state) => state.validationSummary,
      pages: (state) => state.pages,
      currentPage: (state) => state.currentPage,
      rawData: (state) => state.rawData,
      processedData: (state) => state.processedData,
      filters: (state) => state.filters,
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
      async fetchAndProcessData({ commit }) {
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

          // Process data using CycleDataViewCoordinator
          const processedData =
            cycleDataViewCoordinator.processCycleData(cycleData);

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

      async updateFilters({ commit }, filters: ViewFilterCriteria) {
        try {
          commit("SET_FILTERS", filters);
          console.log("Filters updated", filters);
        } catch (error) {
          console.error("Failed to update filters", error);
          commit("SET_ERROR", "Failed to update filters");
        }
      },

      async updateFilter(
        { commit },
        { key, value }: { key: string; value: any },
      ) {
        try {
          const updatedFilters = cycleDataViewCoordinator.updateFilter(
            key as any,
            value,
          );
          commit("SET_FILTERS", updatedFilters);
          console.log("Filter updated", { key, value, updatedFilters });
        } catch (error) {
          console.error("Failed to update filter", error);
          commit("SET_ERROR", "Failed to update filter");
        }
      },

      async switchView({ commit, state }, page: string) {
        try {
          commit("SET_CURRENT_PAGE", page);

          const updatedFilters = cycleDataViewCoordinator.switchView(
            page as any,
          );
          commit("SET_FILTERS", updatedFilters);

          console.log("View switched with filters:", { page, updatedFilters });

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

      async initializeFilters({ commit, state }) {
        try {
          cycleDataViewCoordinator.initializeFilters(state.filters);
          console.log("Filters initialized");
        } catch (error) {
          console.error("Failed to initialize filters", error);
          commit("SET_ERROR", "Failed to initialize filters");
        }
      },

      // Simplified fetch actions - all delegate to the main fetch action
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
    },
  });

  return store;
}
