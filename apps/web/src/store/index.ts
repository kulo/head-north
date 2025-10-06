import { createStore, ActionContext } from "vuex";
import { CycleDataService } from "@/services/index";
import { logger } from "@omega/utils";
import { filterByArea } from "@/filters/area-filter";
import { filterByInitiatives } from "@/filters/initiatives-filter";
import { filterByStages } from "@/filters/stages-filter";
import { filterByAssignees } from "@/filters/assignee-filter";
import { filterByCycle } from "@/filters/cycle-filter";
import {
  transformForCycleOverview,
  transformForRoadmap,
  calculateCycleProgress,
  calculateCycleData,
} from "@/lib/transformers/data-transformations";
import type { OmegaConfig } from "@omega/config";
import type { Router } from "vue-router";
import type { Cycle, CycleId, CycleData, Person } from "@omega/types";
import type { StoreState, Filters, Page, RoadmapData } from "../types";
import {
  ALL_ASSIGNEES_FILTER,
  ALL_INITIATIVES_FILTER,
  ALL_STAGES_FILTER,
} from "@/filters/filter-constants";

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
 * Transform raw assignees data to include "All Assignees" option for UI
 * @param {Person[]} assignees - Raw assignees from backend
 * @returns {Array<{id: string, name: string}>} Assignees with "All Assignees" option
 */
const transformAssigneesForUI = (
  assignees: Person[],
): Array<{ id: string; name: string }> => {
  return [ALL_ASSIGNEES_FILTER].concat(
    assignees.map((assignee) => ({
      id: assignee.accountId,
      name: assignee.displayName,
    })),
  );
};

// Simple filtering function that works with the simplified data structure
const applyFilters = (data: unknown[], filters: Filters): unknown[] => {
  if (!data || !Array.isArray(data)) {
    return data;
  }

  let filteredData = data;

  // Apply area filtering if specified
  if (filters && filters.area && filters.area !== "all") {
    filteredData = filterByArea(filteredData, filters.area);
  }

  // Apply initiative filtering if specified
  if (filters && filters.initiatives && filters.initiatives.length > 0) {
    filteredData = filterByInitiatives(
      filteredData,
      filters.initiatives as any,
    );
  }

  // Apply stage filtering if specified
  if (filters && filters.stages && filters.stages.length > 0) {
    filteredData = filterByStages(filteredData, filters.stages as any);
  }

  // Apply assignee filtering if specified
  if (filters && filters.assignees && filters.assignees.length > 0) {
    filteredData = filterByAssignees(filteredData, filters.assignees as any);
  }

  // Apply cycle filtering if specified
  if (filters && filters.cycle) {
    const cycleName =
      typeof filters.cycle === "string" ? filters.cycle : filters.cycle.name;
    filteredData = filterByCycle(filteredData, cycleName);
  }

  return filteredData;
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
      // Backend cycles data
      cycles: [],
      // Roadmap data
      roadmapData: {
        orderedCycles: [],
        roadmapItems: [],
        activeCycle: null,
      },
      // Cycle overview data
      cycleOverviewData: null,
      currentCycleOverviewData: null,
      // Selector data
      initiatives: [],
      assignees: [],
      areas: [],
      stages: [],
      pages: {
        all: [],
        current: null,
      },
      // Selected filters
      selectedInitiatives: [],
      selectedAssignees: [],
      selectedArea: null,
      selectedCycle: null,
      selectedStages: [],
      // Validation
      validationEnabled: false,
      validationSummary: [],
    },
    getters: {
      roadmapData: (state) => state.roadmapData,
      cycleOverviewData: (state) => state.cycleOverviewData,
      cycles: (state) => state.cycles,

      // Unified filtering getters using the filtering utilities
      filteredRoadmapData: (state) => {
        if (!state.roadmapData || !state.roadmapData.initiatives) {
          return [];
        }

        // Roadmap view only supports initiatives and areas filtering
        const filteredData = applyFilters(state.roadmapData.initiatives, {
          area: state.selectedArea,
          initiatives: state.selectedInitiatives || [],
        });

        // Return the filtered initiatives array
        return filteredData || [];
      },

      currentCycleOverviewData: (state) => {
        const cycleOverviewData = state.currentCycleOverviewData;

        if (!cycleOverviewData || !cycleOverviewData.initiatives) {
          return cycleOverviewData;
        }

        const initiativesIds = (state.selectedInitiatives || []).map(
          (init) => init.id,
        );
        const stagesIds = (state.selectedStages || []).map((stage) => stage.id);
        const assigneesIds = (state.selectedAssignees || []).map(
          (assignee) => assignee.accountId,
        );

        const filterOptions: any = {
          area: state.selectedArea || "all",
          initiatives: initiativesIds,
          stages: stagesIds,
          assignees: assigneesIds,
        };

        // Only add cycle filter if a cycle is actually selected
        if (state.selectedCycle) {
          filterOptions.cycle = state.selectedCycle;
        }

        const filteredInitiatives = applyFilters(
          cycleOverviewData.initiatives,
          filterOptions,
        );

        // Recalculate cycle data based on filtered initiatives
        const recalculatedCycle = calculateCycleData(
          cycleOverviewData.cycle,
          filteredInitiatives,
        );

        return {
          ...cycleOverviewData,
          cycle: recalculatedCycle,
          initiatives: filteredInitiatives,
        };
      },
      validationSummary: (state) => state.validationSummary,
      initiativeName: (state) => (id) => {
        const initiative = state.initiatives.find((i) => i.id === id);
        return initiative ? initiative.name : `Unknown Initiative (${id})`;
      },
      selectedPageName: (state) => {
        return (
          state.pages.current?.name ||
          omegaConfig.getPage("CYCLE_OVERVIEW").name
        );
      },

      // Stage selector getters - these are global state used for filtering
      filteredStages: (state) => {
        return state.stages.filter((stage) => stage.id !== "all");
      },

      isStageSelected: (state) => (stageId) => {
        return state.selectedStages.some((stage) => stage.id === stageId);
      },

      selectedStageIds: (state) => {
        return state.selectedStages
          .map((stage) => stage.id)
          .filter((id) => id !== undefined && id !== "all");
      },
    },
    mutations: {
      SET_LOADING(state, loading) {
        state.loading = loading;
      },
      SET_ERROR(state, error) {
        state.error = error;
      },
      SET_ROADMAP_DATA(state, data) {
        state.roadmapData = data;
      },
      SET_CYCLES(state, cycles) {
        state.cycles = cycles;
      },
      SET_INITIATIVES(state, initiatives) {
        state.initiatives = initiatives;
      },
      SET_ASSIGNEES(state, assignees) {
        state.assignees = assignees;
      },
      SET_AREAS(state, areas) {
        state.areas = areas;
      },
      SET_SELECTED_INITIATIVES(state, initiatives) {
        state.selectedInitiatives = initiatives;
      },
      SET_SELECTED_ASSIGNEES(state, assignees) {
        state.selectedAssignees = assignees;
      },
      SET_SELECTED_AREA(state, areaId) {
        state.selectedArea = areaId;
      },
      SET_CYCLE_OVERVIEW_DATA(state, data) {
        state.cycleOverviewData = data;
      },
      SET_CURRENT_CYCLE_OVERVIEW_DATA(state, data) {
        state.currentCycleOverviewData = data;
      },
      SET_STAGES(state, stages) {
        state.stages = stages;
      },
      SET_SELECTED_CYCLE(state, cycle) {
        state.selectedCycle = cycle;
      },
      SET_SELECTED_STAGES(state, stages) {
        state.selectedStages = stages;
      },
      setSelectedStages(state, stages) {
        state.selectedStages = stages;
      },
      TOGGLE_VALIDATION(state) {
        state.validationEnabled = !state.validationEnabled;
      },
      SET_VALIDATION_SUMMARY(state, summary) {
        state.validationSummary = summary;
      },
      CLEAR_ERROR(state) {
        state.error = null;
      },
      SET_SELECTED_AREA_BY_PATH(state, route) {
        // Extract area ID from route params if available
        if (route && route.params && route.params.areaId) {
          state.selectedArea = route.params.areaId;
        }
      },
      SET_PAGES(state, pages) {
        state.pages.all = pages;
      },
      SET_CURRENT_PAGE(state, page) {
        state.pages.current = page;
      },
    },
    actions: {
      /**
       * Helper function to get cycle ID, setting selectedCycle if needed
       * @param {object} context - Vuex action context
       * @returns {Promise<string|null>} Cycle ID or null
       */
      async _ensureSelectedCycle({
        commit,
        state,
      }: ActionContext<StoreState, StoreState>): Promise<CycleId | null> {
        let cycleId = state.selectedCycle?.id;

        // If no cycle selected, determine the best cycle to select
        if (!cycleId) {
          // First try to get cycles from state if available
          let cycles = state.cycles;

          // If no cycles in state, fetch them
          if (!cycles || cycles.length === 0) {
            try {
              cycles = await cycleDataService.getAllCycles();
            } catch (error) {
              console.error("Failed to fetch cycles for selection:", error);
              return null;
            }
          }

          // Select the best cycle using our dedicated function
          const bestCycle = selectBestCycle(cycles);
          if (bestCycle) {
            cycleId = bestCycle.id;
            commit("SET_SELECTED_CYCLE", bestCycle);
          }
        }

        return cycleId;
      },

      async fetchRoadmap({
        commit,
      }: ActionContext<StoreState, StoreState>): Promise<void> {
        try {
          commit("SET_LOADING", true);
          commit("SET_ERROR", null);

          const cycleData: CycleData = await cycleDataService.getCycleData();
          const roadmapData: RoadmapData = transformForRoadmap(cycleData);

          commit("SET_ROADMAP_DATA", roadmapData);

          if (cycleData.cycles) {
            const cyclesWithProgress = calculateCycleProgress(
              cycleData.cycles,
              cycleData.releaseItems || [],
            );
            commit("SET_CYCLES", cyclesWithProgress);
          }

          if (cycleData.stages) {
            commit("SET_STAGES", cycleData.stages);
          }

          if (cycleData.areas) {
            commit(
              "SET_AREAS",
              cycleData.areas.map((area) => ({
                id: area.id,
                name: area.name || area.id,
                teams: area.teams || [],
              })),
            );
          }

          if (cycleData.assignees) {
            commit(
              "SET_ASSIGNEES",
              transformAssigneesForUI(cycleData.assignees),
            );
          }

          if (cycleData.initiatives) {
            const allInitiatives = [ALL_INITIATIVES_FILTER].concat(
              cycleData.initiatives,
            );
            commit("SET_INITIATIVES", allInitiatives);
          }
        } catch (error) {
          const errorMessage =
            error?.message || error?.toString() || "Unknown error";
          logger.error.errorSafe("Failed to fetch roadmap data", error);
          commit("SET_ERROR", errorMessage);
        } finally {
          commit("SET_LOADING", false);
        }
      },

      // Selector actions
      async fetchInitiatives({
        commit,
        dispatch,
      }: ActionContext<StoreState, StoreState>): Promise<void> {
        try {
          await dispatch("_ensureSelectedCycle");
          const initiatives = await cycleDataService.getAllInitiatives();

          // Add "All Initiatives" filter option
          const allInitiatives = [ALL_INITIATIVES_FILTER].concat(initiatives);
          commit("SET_INITIATIVES", allInitiatives);
        } catch (error) {
          const errorMessage =
            error?.message || error?.toString() || "Unknown error";
          commit("SET_ERROR", errorMessage);
        }
      },

      async fetchAssignees({
        commit,
      }: ActionContext<StoreState, StoreState>): Promise<void> {
        try {
          const assignees = await cycleDataService.getAllAssignees();
          commit("SET_ASSIGNEES", transformAssigneesForUI(assignees));
        } catch (error) {
          const errorMessage =
            error?.message || error?.toString() || "Unknown error";
          commit("SET_ERROR", errorMessage);
        }
      },

      async fetchAreas({
        commit,
        dispatch,
      }: ActionContext<StoreState, StoreState>): Promise<void> {
        try {
          const cycleId = await dispatch("_ensureSelectedCycle");
          const areas = await cycleDataService.getAllAreas(cycleId);
          commit("SET_AREAS", areas);
        } catch (error) {
          console.error("Error fetching areas:", error);
          const errorMessage =
            error?.message || error?.toString() || "Unknown error";
          commit("SET_ERROR", errorMessage);
        }
      },

      setSelectedInitiatives({ commit }, initiatives) {
        commit("SET_SELECTED_INITIATIVES", initiatives);
      },

      setSelectedAssignees({ commit }, assignees) {
        commit("SET_SELECTED_ASSIGNEES", assignees);
      },

      setSelectedStages({ commit }, stages) {
        commit("SET_SELECTED_STAGES", stages);
      },

      setSelectedArea({ commit }, areaId) {
        commit("SET_SELECTED_AREA", areaId);
      },

      // Cycle overview data actions
      async fetchCycleOverviewData({
        state,
        commit,
      }: ActionContext<StoreState, StoreState>): Promise<void> {
        commit("SET_LOADING", true);
        commit("CLEAR_ERROR");
        try {
          const cycleData = await cycleDataService.getCycleData();

          // Transform raw data for cycle overview view
          const cycleOverviewData = transformForCycleOverview(cycleData);

          // Calculate cycle progress with release items
          const cyclesWithProgress = calculateCycleProgress(
            cycleData.cycles || [],
            cycleData.releaseItems || [],
          );

          // Use currently selected cycle if available, otherwise select the best cycle
          let displayCycle = state.selectedCycle;
          if (!displayCycle) {
            displayCycle = selectBestCycle(cyclesWithProgress);
          }

          // Calculate cycle data with aggregated metrics
          const cycleWithData = calculateCycleData(
            displayCycle,
            cycleOverviewData.initiatives,
          );

          // Set the cycle overview data with selected cycle
          const finalCycleOverviewData = {
            cycle: cycleWithData,
            initiatives: cycleOverviewData.initiatives,
          };

          commit("SET_CURRENT_CYCLE_OVERVIEW_DATA", finalCycleOverviewData);
          commit("SET_SELECTED_AREA_BY_PATH", router?.currentRoute);
          commit("SET_CYCLES", cyclesWithProgress);
          commit("SET_SELECTED_CYCLE", displayCycle);

          // Set metadata from raw data
          if (cycleData.initiatives) {
            const allInitiatives = [ALL_INITIATIVES_FILTER].concat(
              cycleData.initiatives,
            );
            commit("SET_INITIATIVES", allInitiatives);
          }

          if (cycleData.assignees) {
            commit(
              "SET_ASSIGNEES",
              transformAssigneesForUI(cycleData.assignees),
            );
          }

          if (cycleData.areas) {
            const areas = cycleData.areas.map((area) => ({
              id: area.id,
              name: area.name || area.id,
              teams: area.teams || [],
            }));
            commit("SET_AREAS", areas);
          }

          let allStages = [];
          if (cycleData.stages) {
            allStages = [ALL_STAGES_FILTER].concat(
              cycleData.stages.map((stage) => ({
                name: stage.name,
                id: stage.id,
              })),
            );
            commit("SET_STAGES", allStages);
          }

          if (
            !state.selectedInitiatives ||
            state.selectedInitiatives.length === 0
          ) {
            const allInitiatives = [ALL_INITIATIVES_FILTER].concat(
              cycleData.initiatives || [],
            );
            commit("SET_SELECTED_INITIATIVES", [allInitiatives[0]]);
          }

          if (
            !state.selectedAssignees ||
            state.selectedAssignees.length === 0
          ) {
            const allAssignees = transformAssigneesForUI(
              cycleData.assignees || [],
            );
            commit("SET_SELECTED_ASSIGNEES", [allAssignees[0]]);
          }

          if (!state.selectedStages || state.selectedStages.length === 0) {
            if (allStages.length > 0) {
              commit("SET_SELECTED_STAGES", [allStages[0]]);
            }
          }

          // Set current cycle overview data for display
          const currentCycleOverviewData = {
            cycle: cycleWithData,
            initiatives: cycleOverviewData.initiatives,
          };
          commit("SET_CURRENT_CYCLE_OVERVIEW_DATA", currentCycleOverviewData);
        } catch (e) {
          const errorMessage = e?.message || e?.toString() || "Unknown error";
          logger.error.errorSafe("Error on loading Cycle Overview data", e);
          commit("SET_ERROR", errorMessage);
        } finally {
          commit("SET_LOADING", false);
        }
      },

      // Additional selector actions
      async fetchCycles({
        commit,
      }: ActionContext<StoreState, StoreState>): Promise<void> {
        try {
          const data = await cycleDataService.getAllCycles();
          commit("SET_CYCLES", data);
          if (data.length > 0) {
            // Select the best cycle using our dedicated function
            const bestCycle = selectBestCycle(data);
            if (bestCycle) {
              commit("SET_SELECTED_CYCLE", bestCycle);
            }
          }
        } catch (error) {
          const errorMessage =
            error?.message || error?.toString() || "Unknown error";
          commit("SET_ERROR", errorMessage);
        }
      },

      fetchCycle({ commit, dispatch }, cycle) {
        commit("SET_SELECTED_CYCLE", cycle);
        // Refresh cycle overview data when cycle changes
        dispatch("fetchCycleOverviewData");
      },

      async fetchStages({
        commit,
      }: ActionContext<StoreState, StoreState>): Promise<void> {
        try {
          const data = await cycleDataService.getAllStages();
          commit("SET_STAGES", data);
        } catch (error) {
          const errorMessage =
            error?.message || error?.toString() || "Unknown error";
          commit("SET_ERROR", errorMessage);
        }
      },

      // Change page
      changePage({ commit, state }, pageId) {
        const targetPage = state.pages.all.find((page) => page.id === pageId);
        if (targetPage) {
          commit("SET_CURRENT_PAGE", targetPage);
          router?.push(targetPage.path);
        }
      },

      // Validation
      toggleValidation({ commit }) {
        commit("TOGGLE_VALIDATION");
      },
    },
  });

  // Initialize pages from configuration
  if (omegaConfig) {
    const pageConfigs = omegaConfig.getFrontendConfig().getAllPages();
    // Convert PageConfig to Page (they have the same structure)
    const pages: Page[] = pageConfigs.map((config) => ({
      id: config.id,
      name: config.name,
      path: config.path,
    }));
    store.commit("SET_PAGES", pages);

    // Set current page based on initial route
    const currentPath = router?.currentRoute?.value?.path || "/";
    const currentPage = pages.find((page) => page.path === currentPath);
    if (currentPage) {
      store.commit("SET_CURRENT_PAGE", currentPage);
    }
  }

  return store;
}
