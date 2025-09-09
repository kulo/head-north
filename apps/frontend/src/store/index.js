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
      // Release overview data
      releaseOverviewData: {
        orderedSprints: [],
        roadmapItems: [],
        activeSprint: null
      },
      // Area data
      areaData: null,
      currentAreaData: null,
      // Selector data
      initiatives: [],
      assignees: [],
      areas: [],
      sprints: [],
      stages: [],
      releaseFilters: [],
      pages: {
        all: [],
        current: {}
      },
      // Selected filters
      selectedInitiative: null,
      selectedAssignee: null,
      selectedArea: null,
      selectedSprint: null,
      selectedStages: [],
      selectedReleaseFilter: { value: 'all', name: 'All Releases' },
      // Validation
      validationEnabled: false,
      validationSummary: []
    },
    getters: {
      releaseOverviewData: (state) => state.releaseOverviewData,
      areaData: (state) => state.areaData,
      currentAreaData: (state) => state.currentAreaData,
      validationSummary: (state) => state.validationSummary,
      initiativeName: (state) => (initiativeId) => {
        const initiative = state.initiatives.find(i => i.id === initiativeId)
        return initiative ? initiative.name : 'Unknown Initiative'
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
      SET_RELEASE_OVERVIEW_DATA(state, data) {
        state.releaseOverviewData = data
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
      SET_SELECTED_INITIATIVE(state, initiativeId) {
        state.selectedInitiative = initiativeId
      },
      SET_SELECTED_ASSIGNEE(state, assigneeId) {
        state.selectedAssignee = assigneeId
      },
      SET_SELECTED_AREA(state, areaId) {
        state.selectedArea = areaId
      },
      SET_AREA_DATA(state, data) {
        state.areaData = data
      },
      SET_CURRENT_AREA_DATA(state, data) {
        state.currentAreaData = data
      },
      SET_SPRINTS(state, sprints) {
        state.sprints = sprints
      },
      SET_STAGES(state, stages) {
        state.stages = stages
      },
      SET_RELEASE_FILTERS(state, filters) {
        state.releaseFilters = filters
      },
      SET_SELECTED_SPRINT(state, sprint) {
        state.selectedSprint = sprint
      },
      SET_SELECTED_STAGES(state, stages) {
        state.selectedStages = stages
      },
      setSelectedStages(state, stages) {
        state.selectedStages = stages
      },
      SET_SELECTED_RELEASE_FILTER(state, filter) {
        state.selectedReleaseFilter = filter
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
      SET_SELECTED_INITIATIVES(state, initiatives) {
        state.selectedInitiatives = initiatives
      },
      SET_PAGES(state, pages) {
        state.pages.all = pages
      },
      SET_CURRENT_PAGE(state, page) {
        state.pages.current = page
      }
    },
    actions: {
      async fetchReleaseOverview({ commit }) {
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
                  initiativeId: parseInt(initiativeId),
                  roadmapItems: roadmapItems || []
                }))
              : [],
            activeSprint: data.sprint || null
          }
          
          commit('SET_RELEASE_OVERVIEW_DATA', transformedData)
          
          // Also set initiatives and assignees from the API response
          if (data.initiatives) {
            commit('SET_INITIATIVES', data.initiatives)
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
      
      setSelectedInitiative({ commit }, initiativeId) {
        commit('SET_SELECTED_INITIATIVE', initiativeId)
      },
      
      setSelectedAssignee({ commit }, assigneeId) {
        commit('SET_SELECTED_ASSIGNEE', assigneeId)
      },
      
      setSelectedArea({ commit }, areaId) {
        commit('SET_SELECTED_AREA', areaId)
      },
      
      // Area data actions
      async fetchAreaData({ state, commit }) {
        commit('CLEAR_ERROR')
        try {
          // Use API service with cycle/sprint ID parameter
          const cycleId = state.selectedSprint ? state.selectedSprint.id : null
          const areaDataset = await cycleDataService.getOverviewForCycle(cycleId);
          const sprints = areaDataset.sprints;
          const stages = areaDataset.stages;
          const cycleData = areaDataset.devCycleData;
          const assignees = cycleData.assignees;
          const areaData = calculateAreaData(cycleData);

          commit('SET_AREA_DATA', areaData);
          // TODO: Restore this when CycleAreaSelector is fixed or removed
          // commit('SET_ALL_PAGES', cycleData.area);
          commit('SET_SELECTED_AREA_BY_PATH', router?.currentRoute);
          commit('SET_SPRINTS', sprints);
          commit('SET_SELECTED_SPRINT', cycleData.cycle);
          commit('SET_STAGES', stages);

          if (!state.selectedStages || state.selectedStages.length === 0) {
            commit('SET_SELECTED_STAGES', [stages[0]]);
          }

          const allInitiatives = [{ name: 'All Initiatives', id: 'all' }].concat(cycleData.initiatives);

          commit('SET_INITIATIVES', allInitiatives);

          if (!state.selectedInitiatives || state.selectedInitiatives.length === 0) {
            commit('SET_SELECTED_INITIATIVES', [allInitiatives[0]]);
          }

          commit('SET_ASSIGNEES', assignees);

          if (!state.selectedAssignee) {
            commit('SET_SELECTED_ASSIGNEE', assignees[0]);
          }

          // Set current area data for display
          const currentAreaId = state.selectedArea || 'overview';
          const currentAreaData = areaData[currentAreaId] || {
            cycle: cycleData.cycle,
            initiatives: cycleData.initiatives
          };
          commit('SET_CURRENT_AREA_DATA', currentAreaData);

        } catch (e) {
          const errorMessage = e?.message || e?.toString() || 'Unknown error'
          logger.error.errorSafe('Error on loading Area data', e)
          commit('SET_ERROR', errorMessage)
        }
      },
      
      // Additional selector actions
      async fetchSprints({ commit }) {
        try {
          const data = await cycleDataService.getAllSprints()
          commit('SET_SPRINTS', data)
          if (data.length > 0) {
            commit('SET_SELECTED_SPRINT', data[0])
          }
        } catch (error) {
          const errorMessage = error?.message || error?.toString() || 'Unknown error'
          commit('SET_ERROR', errorMessage)
        }
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