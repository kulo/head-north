import { createStore } from 'vuex'
import { CycleDataService } from '@/services/index.js'
import { calculateAreaData } from '@/libraries/calculateAreaData.js'
import { logger } from '@omega-one/shared-utils'
import { filterByArea } from '@/filters/areaFilter.js'
import { filterByInitiatives } from '@/filters/initiativesFilter.js'
import { filterByStages } from '@/filters/stagesFilter.js'
import { filterByAssignees } from '@/filters/assigneeFilter.js'

// Simple filtering function that works with the simplified data structure
const applyFilters = (data, filters) => {
  if (!data || !Array.isArray(data)) {
    return data
  }

  let filteredData = data

  // Apply area filtering if specified
  if (filters && filters.area && filters.area !== 'all') {
    filteredData = filterByArea(filteredData, filters.area)
  }

  // Apply initiative filtering if specified
  if (filters && filters.initiatives && filters.initiatives.length > 0) {
    filteredData = filterByInitiatives(filteredData, filters.initiatives)
  }

  // Apply stage filtering if specified
  if (filters && filters.stages && filters.stages.length > 0) {
    filteredData = filterByStages(filteredData, filters.stages)
  }

  // Apply assignee filtering if specified
  if (filters && filters.assignees && filters.assignees.length > 0) {
    filteredData = filterByAssignees(filteredData, filters.assignees)
  }

  return filteredData
}

// Store factory function that accepts dependencies
export default function createAppStore(cycleDataService, omegaConfig, router) {
  const store = createStore({
    state: {
      loading: false,
      error: null,
      // Roadmap data
      roadmapData: {
        orderedCycles: [],
        roadmapItems: [],
        activeCycle: null
      },
      // Cycle overview data
      cycleOverviewData: null,
      currentCycleOverviewData: null,
      // Selector data
      initiatives: [],
      assignees: [],
      areas: [],
      cycles: [],
      stages: [],
      pages: {
        all: [],
        current: {}
      },
      // Selected filters
      selectedInitiatives: [],
      selectedAssignees: [],
      selectedArea: null,
      selectedCycle: null,
      selectedStages: [],
      // Validation
      validationEnabled: false,
      validationSummary: []
    },
    getters: {
      roadmapData: (state) => state.roadmapData,
      cycleOverviewData: (state) => state.cycleOverviewData,
      
      // Unified filtering getters using the filtering utilities
      filteredRoadmapData: (state) => {
        if (!state.roadmapData || !state.roadmapData.initiatives) {
          return []
        }
        
        const filteredData = applyFilters(state.roadmapData.initiatives, {
          area: state.selectedArea,
          initiatives: state.selectedInitiatives,
          stages: state.selectedStages,
          assignees: state.selectedAssignees
        })
        
        // Return the filtered initiatives array
        return filteredData || []
      },
      
  currentCycleOverviewData: (state) => {
    const rawData = state.currentCycleOverviewData;
    
    if (!rawData || !rawData.initiatives) {
      return rawData;
    }

    const filteredInitiatives = applyFilters(rawData.initiatives, {
      area: state.selectedArea,
      initiatives: state.selectedInitiatives,
      stages: state.selectedStages,
      assignees: state.selectedAssignees
    });

    return {
      ...rawData,
      initiatives: filteredInitiatives
    };
  },
      validationSummary: (state) => state.validationSummary,
      initiativeName: (state) => (initiativeId) => {
        const initiative = state.initiatives.find(i => i.id === initiativeId)
        return initiative ? initiative.name : `Unknown Initiative (${initiativeId})`
      },
      selectedPageName: (state) => {
        return state.pages.current?.name || omegaConfig.getPage('CYCLE_OVERVIEW').name
      },
      
      // Stage selector getters - these are global state used for filtering
      filteredStages: (state) => {
        return state.stages.filter(stage => stage.id !== 'all')
      },
      
      isStageSelected: (state) => (stageId) => {
        return state.selectedStages.some(stage => (stage.value || stage.id || stage.name) === stageId)
      },
      
      selectedStageIds: (state) => {
        return state.selectedStages
          .map(stage => stage.value || stage.id || stage.name || stage)
          .filter(id => id !== undefined && id !== 'all')
      }
    },
    mutations: {
      SET_LOADING(state, loading) {
        state.loading = loading
      },
      SET_ERROR(state, error) {
        state.error = error
      },
      SET_ROADMAP_DATA(state, data) {
        state.roadmapData = data
      },
      SET_INITIATIVES(state, initiatives) {
        state.initiatives = initiatives
      },
      SET_ASSIGNEES(state, assignees) {
        state.assignees = assignees
      },
      SET_AREAS(state, areas) {
        state.areas = areas
      },
      SET_SELECTED_INITIATIVES(state, initiatives) {
        state.selectedInitiatives = initiatives
      },
      SET_SELECTED_ASSIGNEES(state, assignees) {
        state.selectedAssignees = assignees
      },
      SET_SELECTED_AREA(state, areaId) {
        state.selectedArea = areaId
      },
      SET_CYCLE_OVERVIEW_DATA(state, data) {
        state.cycleOverviewData = data
      },
      SET_CURRENT_CYCLE_OVERVIEW_DATA(state, data) {
        state.currentCycleOverviewData = data
      },
      SET_CYCLES(state, cycles) {
        state.cycles = cycles
      },
      SET_STAGES(state, stages) {
        state.stages = stages
      },
      SET_SELECTED_CYCLE(state, cycle) {
        state.selectedCycle = cycle
      },
      SET_SELECTED_STAGES(state, stages) {
        state.selectedStages = stages
      },
      setSelectedStages(state, stages) {
        state.selectedStages = stages
      },
      TOGGLE_VALIDATION(state) {
        state.validationEnabled = !state.validationEnabled
      },
      SET_VALIDATION_SUMMARY(state, summary) {
        state.validationSummary = summary
      },
      CLEAR_ERROR(state) {
        state.error = null
      },
      SET_SELECTED_AREA_BY_PATH(state, route) {
        // Extract area ID from route params if available
        if (route && route.params && route.params.areaId) {
          state.selectedArea = route.params.areaId
        }
      },
      SET_PAGES(state, pages) {
        state.pages.all = pages
      },
      SET_CURRENT_PAGE(state, page) {
        state.pages.current = page
      }
    },
    actions: {
      /**
       * Helper function to get cycle ID, setting selectedCycle if needed
       * @param {object} context - Vuex action context
       * @returns {Promise<string|null>} Cycle ID or null
       */
      async _ensureSelectedCycle({ commit, state }) {
        let cycleId = state.selectedCycle?.id
        
        // If no cycle selected, get active cycle and set it
        if (!cycleId) {
          const activeCycle = await cycleDataService.getActiveCycle()
          if (activeCycle) {
            cycleId = activeCycle.id
            commit('SET_SELECTED_CYCLE', activeCycle)
          }
        }
        
        return cycleId
      },

      async fetchRoadmap({ commit }) {
        try {
          commit('SET_LOADING', true)
          commit('SET_ERROR', null)
          
          // Fetch unified data from API service
          const cycleData = await cycleDataService.getCycleData()
          
          // Store the cycle data directly
          commit('SET_ROADMAP_DATA', cycleData)
          
          // Extract and set data directly from simplified structure
          if (cycleData.cycles) {
            commit('SET_CYCLES', cycleData.cycles)
          }
          
          if (cycleData.stages) {
            commit('SET_STAGES', cycleData.stages)
          }
          
          if (cycleData.areas) {
            commit('SET_AREAS', cycleData.areas.map(area => ({ 
              id: area.id,
              name: area.name || area.id,
              teams: area.teams || []
            })))
          }
          
          if (cycleData.assignees) {
            commit('SET_ASSIGNEES', cycleData.assignees.map(assignee => ({
              id: assignee.accountId,
              name: assignee.displayName
            })))
          }
          
          if (cycleData.initiatives) {
            const initiativesArray = cycleData.initiatives.map(init => ({
              id: init.initiativeId,
              name: init.initiative
            }))
            const allInitiatives = [{ name: 'All Initiatives', id: 'all' }].concat(initiativesArray)
            commit('SET_INITIATIVES', allInitiatives)
          }
          
        } catch (error) {
          const errorMessage = error?.message || error?.toString() || 'Unknown error'
          logger.error.errorSafe('Failed to fetch release overview', error)
          commit('SET_ERROR', errorMessage)
        } finally {
          commit('SET_LOADING', false)
        }
      },
      
      // Selector actions
      async fetchInitiatives({ commit, dispatch }) {
        try {
          const cycleId = await dispatch('_ensureSelectedCycle')
          const initiatives = await cycleDataService.getAllInitiatives(cycleId)
          
          // Add "All Initiatives" option
          const allInitiatives = [{ name: 'All Initiatives', id: 'all' }].concat(initiatives)
          commit('SET_INITIATIVES', allInitiatives)
        } catch (error) {
          const errorMessage = error?.message || error?.toString() || 'Unknown error'
          commit('SET_ERROR', errorMessage)
        }
      },
      
      async fetchAssignees({ commit }) {
        try {
          const assignees = await cycleDataService.getAllAssignees()
          commit('SET_ASSIGNEES', assignees)
        } catch (error) {
          const errorMessage = error?.message || error?.toString() || 'Unknown error'
          commit('SET_ERROR', errorMessage)
        }
      },
      
      async fetchAreas({ commit, dispatch }) {
        try {
          const cycleId = await dispatch('_ensureSelectedCycle')
          const areas = await cycleDataService.getAllAreas(cycleId)
          commit('SET_AREAS', areas)
        } catch (error) {
          console.error('Error fetching areas:', error);
          const errorMessage = error?.message || error?.toString() || 'Unknown error'
          commit('SET_ERROR', errorMessage)
        }
      },
      
      setSelectedInitiatives({ commit }, initiatives) {
        commit('SET_SELECTED_INITIATIVES', initiatives)
      },
      
      setSelectedAssignees({ commit }, assignees) {
        commit('SET_SELECTED_ASSIGNEES', assignees)
      },
      
      
      setSelectedStages({ commit }, stages) {
        commit('SET_SELECTED_STAGES', stages)
      },
      
      setSelectedArea({ commit }, areaId) {
        commit('SET_SELECTED_AREA', areaId)
      },
      
      // Cycle overview data actions
      async fetchCycleOverviewData({ state, commit }) {
        commit('CLEAR_ERROR')
        try {
          // Use unified data service
          const cycleData = await cycleDataService.getOverviewForCycle();
          
          // Extract data from simplified cycle structure
          const cycles = cycleData.cycles || [];
          const stages = cycleData.stages || [];
          const assignees = cycleData.assignees || [];
          
          // Use the full initiatives data directly - don't map to simplified structure
          const initiativesArray = cycleData.initiatives || [];

          // Get areas from simplified structure
          const areas = (cycleData.areas || []).map(area => ({ 
            id: area.id,
            name: area.name || area.id,
            teams: area.teams || []
          }));

          // Find active cycle
          const activeCycle = cycles.find(cycle => cycle.state === 'active') || cycles[0];

          // For Cycle Overview, we need the initiatives directly, not area data
          // The Cycle Overview component expects: { cycle, initiatives: [...] }
          const cycleOverviewData = {
            cycle: activeCycle,
            initiatives: cycleData.initiatives || []
          };
          
          console.log('🔍 DEBUG: Setting cycle overview data:', cycleOverviewData);
          commit('SET_CYCLE_OVERVIEW_DATA', cycleOverviewData);
          commit('SET_SELECTED_AREA_BY_PATH', router?.currentRoute);
          commit('SET_CYCLES', cycles);
          commit('SET_SELECTED_CYCLE', activeCycle);

          const allInitiatives = [{ name: 'All Initiatives', id: 'all' }].concat(initiativesArray.map(init => ({
            id: init.initiativeId,
            name: init.initiative
          })));
          const allAssignees = [{ name: 'All Assignees', id: 'all' }].concat(assignees.map(assignee => ({
            id: assignee.accountId,
            name: assignee.displayName
          })));
          const allStages = [{ name: 'All Stages', id: 'all' }].concat(stages);

          commit('SET_INITIATIVES', allInitiatives);
          commit('SET_ASSIGNEES', allAssignees);
          commit('SET_AREAS', areas);
          commit('SET_STAGES', allStages);

          if (!state.selectedInitiatives || state.selectedInitiatives.length === 0) {
            commit('SET_SELECTED_INITIATIVES', [allInitiatives[0]]);
          }

          if (!state.selectedAssignees || state.selectedAssignees.length === 0) {
            commit('SET_SELECTED_ASSIGNEES', [allAssignees[0]]);
          }

          if (!state.selectedStages || state.selectedStages.length === 0) {
            commit('SET_SELECTED_STAGES', [allStages[0]]);
          }


          // Set current cycle overview data for display
          const currentAreaId = state.selectedArea || 'overview';
          const currentCycleOverviewData = {
            cycle: activeCycle,
            initiatives: initiativesArray
          };
          commit('SET_CURRENT_CYCLE_OVERVIEW_DATA', currentCycleOverviewData);

        } catch (e) {
          const errorMessage = e?.message || e?.toString() || 'Unknown error'
          logger.error.errorSafe('Error on loading Cycle Overview data', e)
          commit('SET_ERROR', errorMessage)
        }
      },
      
      // Additional selector actions
      async fetchCycles({ commit }) {
        try {
          const data = await cycleDataService.getAllCycles()
          commit('SET_CYCLES', data)
          if (data.length > 0) {
            commit('SET_SELECTED_CYCLE', data[0])
          }
        } catch (error) {
          const errorMessage = error?.message || error?.toString() || 'Unknown error'
          commit('SET_ERROR', errorMessage)
        }
      },
      
      fetchCycle({ commit }, cycle) {
        commit('SET_SELECTED_CYCLE', cycle)
      },
      
      async fetchStages({ commit }) {
        try {
          const data = await cycleDataService.getAllStages()
          commit('SET_STAGES', data)
        } catch (error) {
          const errorMessage = error?.message || error?.toString() || 'Unknown error'
          commit('SET_ERROR', errorMessage)
        }
      },
      
      
      // Change page
      changePage({ commit, state }, pageId) {
        const targetPage = state.pages.all.find(page => page.id === pageId)
        if (targetPage) {
          commit('SET_CURRENT_PAGE', targetPage)
          router?.push(targetPage.path)
        }
      },
      
      // Validation
      toggleValidation({ commit }) {
        commit('TOGGLE_VALIDATION')
      }
    }
  })

  // Initialize pages from configuration
  if (omegaConfig) {
    const pages = omegaConfig.getFrontendConfig().getAllPages()
    store.commit('SET_PAGES', pages)
    
    // Set current page based on initial route
    const currentPath = router?.currentRoute?.value?.path || '/'
    const currentPage = pages.find(page => page.path === currentPath)
    if (currentPage) {
      store.commit('SET_CURRENT_PAGE', currentPage)
    }
  }

  return store
}