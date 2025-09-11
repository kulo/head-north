import { createStore } from 'vuex'
import { CycleDataService } from '@/services/index.js'
import { calculateAreaData } from '@/libraries/calculateAreaData.js'
import { logger } from '@omega-one/shared-utils'

// Store factory function that accepts dependencies
export default function createAppStore(cycleDataService, omegaConfig, router) {
  const store = createStore({
    state: {
      loading: false,
      error: null,
      // Roadmap data
      roadmapData: {
        orderedSprints: [],
        roadmapItems: [],
        activeSprint: null
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
      releaseFilters: [],
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
      selectedReleaseFilters: [],
      // Validation
      validationEnabled: false,
      validationSummary: []
    },
    getters: {
      roadmapData: (state) => state.roadmapData,
      cycleOverviewData: (state) => state.cycleOverviewData,
      currentCycleOverviewData: (state) => state.currentCycleOverviewData,
      validationSummary: (state) => state.validationSummary,
      initiativeName: (state) => (initiativeId) => {
        console.log('🔍 initiativeName getter called with:', initiativeId);
        console.log('🔍 Available initiatives:', state.initiatives);
        const initiative = state.initiatives.find(i => i.id === initiativeId)
        console.log('🔍 Found initiative:', initiative);
        return initiative ? initiative.name : `Unknown Initiative (${initiativeId})`
      },
      selectedPageName: (state) => {
        return state.pages.current?.name || omegaConfig.getPage('CYCLE_OVERVIEW').name
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
      SET_RELEASE_FILTERS(state, filters) {
        state.releaseFilters = filters
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
      SET_SELECTED_RELEASE_FILTERS(state, filters) {
        state.selectedReleaseFilters = filters
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
      // TODO: Remove this mutation if CycleAreaSelector is permanently removed
      // SET_ALL_PAGES(state, pages) {
      //   state.pages = pages
      // },
      SET_PAGES(state, pages) {
        state.pages.all = pages
      },
      SET_CURRENT_PAGE(state, page) {
        state.pages.current = page
      }
    },
    actions: {
      async fetchRoadmap({ commit }) {
        try {
          commit('SET_LOADING', true)
          commit('SET_ERROR', null)
          
          // Fetch data from API service
          const data = await cycleDataService.getCyclesRoadmap()
          
          // Transform API data to match our store structure
          const transformedData = {
            orderedSprints: data.sprints || [],
            roadmapItems: data.groupedRoadmapItems && Object.keys(data.groupedRoadmapItems).length > 0 
              ? Object.entries(data.groupedRoadmapItems).map(([initiativeId, roadmapItems]) => ({
                  initiativeId: initiativeId, // Keep as string to match initiative IDs
                  roadmapItems: roadmapItems || []
                }))
              : [],
            activeSprint: data.sprint || null
          }
          
          commit('SET_ROADMAP_DATA', transformedData)
          
          // Also set initiatives and assignees from the API response
          if (data.initiatives) {
            const allInitiatives = [{ name: 'All Initiatives', id: 'all' }].concat(data.initiatives)
            commit('SET_INITIATIVES', allInitiatives)
          }
          if (data.assignees) {
            commit('SET_ASSIGNEES', data.assignees.map(assignee => ({
              id: assignee.accountId,
              name: assignee.displayName
            })))
          }
          if (data.area) {
            commit('SET_AREAS', Object.entries(data.area).map(([id, name]) => ({ id, name })))
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
      async fetchInitiatives({ commit }) {
        try {
          const initiatives = await cycleDataService.getAllInitiatives()
          commit('SET_INITIATIVES', initiatives)
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
      
      async fetchAreas({ commit }) {
        try {
          const areas = await cycleDataService.getAllAreas()
          commit('SET_AREAS', areas)
        } catch (error) {
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
      
      setSelectedReleaseFilters({ commit }, filters) {
        commit('SET_SELECTED_RELEASE_FILTERS', filters)
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
          // Use API service with cycle ID parameter
          const cycleId = state.selectedCycle ? state.selectedCycle.id : null
          const areaDataset = await cycleDataService.getOverviewForCycle(cycleId);
          const sprints = areaDataset.sprints;
          const stages = areaDataset.stages;
          const cycleData = areaDataset.devCycleData;
          const assignees = cycleData.assignees;
          const areaData = calculateAreaData(cycleData);

          commit('SET_CYCLE_OVERVIEW_DATA', areaData);
          // TODO: Restore this when CycleAreaSelector is fixed or removed
          // commit('SET_ALL_PAGES', cycleData.area);
          commit('SET_SELECTED_AREA_BY_PATH', router?.currentRoute);
          commit('SET_CYCLES', sprints);
          commit('SET_SELECTED_CYCLE', cycleData.cycle);
          commit('SET_STAGES', stages);

          if (!state.selectedStages || state.selectedStages.length === 0) {
            commit('SET_SELECTED_STAGES', [stages[0]]);
          }

          const allInitiatives = [{ name: 'All Initiatives', id: 'all' }].concat(cycleData.initiatives);
          const allAssignees = [{ name: 'All Assignees', id: 'all' }].concat(assignees);
          const allStages = [{ name: 'All Stages', id: 'all' }].concat(stages);
          const allReleaseFilters = [{ name: 'All Releases', value: 'all' }].concat(state.releaseFilters || []);

          commit('SET_INITIATIVES', allInitiatives);
          commit('SET_ASSIGNEES', allAssignees);
          commit('SET_STAGES', allStages);
          commit('SET_RELEASE_FILTERS', allReleaseFilters);

          if (!state.selectedInitiatives || state.selectedInitiatives.length === 0) {
            commit('SET_SELECTED_INITIATIVES', [allInitiatives[0]]);
          }

          if (!state.selectedAssignees || state.selectedAssignees.length === 0) {
            commit('SET_SELECTED_ASSIGNEES', [allAssignees[0]]);
          }

          if (!state.selectedStages || state.selectedStages.length === 0) {
            commit('SET_SELECTED_STAGES', [allStages[0]]);
          }

          if (!state.selectedReleaseFilters || state.selectedReleaseFilters.length === 0) {
            commit('SET_SELECTED_RELEASE_FILTERS', [allReleaseFilters[0]]);
          }

          // Set current cycle overview data for display
          const currentAreaId = state.selectedArea || 'overview';
          const currentCycleOverviewData = areaData[currentAreaId] || {
            cycle: cycleData.cycle,
            initiatives: cycleData.initiatives
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
      
      async fetchReleaseFilters({ commit }) {
        try {
          // Import release filters from local library instead of API call
          const { releaseFilters } = await import('@/filters/release-filters.js')
          commit('SET_RELEASE_FILTERS', releaseFilters)
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