import { createStore, Store } from 'vuex'
import { CycleDataService } from '@/services/index.js'
import { logger } from '@omega-one/shared-utils'
import { filterByArea } from '@/filters/area-filter.js'
import { filterByInitiatives } from '@/filters/initiatives-filter.js'
import { filterByStages } from '@/filters/stages-filter.js'
import { filterByAssignees } from '@/filters/assignee-filter.js'
import { filterByCycle } from '@/filters/cycle-filter.js'
import { 
  transformForCycleOverview, 
  transformForRoadmap, 
  calculateCycleProgress,
  calculateCycleData
} from '@/lib/transformers/data-transformations.js'
import type { OmegaConfig } from '@omega/shared-config'
import type { Router } from 'vue-router'
import type { Cycle, RoadmapItem, ReleaseItem, Area, Initiative, Assignee } from '@omega/shared-types'

interface State {
  // Raw data from backend
  cycles: Cycle[]
  roadmapItems: RoadmapItem[]
  releaseItems: ReleaseItem[]
  areas: Area[]
  initiatives: Initiative[]
  assignees: Assignee[]
  stages: any[]
  
  // UI state
  selectedArea: string | null
  selectedInitiative: string | null
  selectedStage: string | null
  selectedAssignee: string | null
  selectedCycle: string | null
  currentPage: string
  
  // Loading states
  isLoading: boolean
  error: string | null
  
  // Transformed data
  cycleOverviewData: any
  roadmapData: any
}

/**
 * Determines the best cycle to select based on availability and priority
 * Priority: active cycles (oldest first) -> future cycles (oldest first) -> closed cycles (oldest first)
 * @param cycles - Array of available cycles
 * @returns Selected cycle or null if no cycles available
 */
const selectBestCycle = (cycles: Cycle[]): Cycle | null => {
  if (!cycles || !Array.isArray(cycles) || cycles.length === 0) {
    return null
  }

  // Sort cycles by start date (oldest first)
  const sortedCycles = [...cycles].sort((a, b) => {
    const dateA = new Date(a.start || a.delivery || 0)
    const dateB = new Date(b.start || b.delivery || 0)
    return dateA.getTime() - dateB.getTime()
  })

  // 1. Try to find active cycles (oldest first)
  const activeCycles = sortedCycles.filter(cycle => cycle.state === 'active')
  if (activeCycles.length > 0) {
    return activeCycles[0] || null // Oldest active cycle
  }

  // 2. Try to find future cycles (oldest first)
  const futureCycles = sortedCycles.filter(cycle => {
    const cycleDate = new Date(cycle.start || cycle.delivery || 0)
    const now = new Date()
    return cycleDate > now && cycle.state !== 'closed' && cycle.state !== 'completed'
  })
  if (futureCycles.length > 0) {
    return futureCycles[0] || null // Oldest future cycle
  }

  // 3. Fall back to closed cycles (oldest first)
  const closedCycles = sortedCycles.filter(cycle => 
    cycle.state === 'closed' || cycle.state === 'completed'
  )
  if (closedCycles.length > 0) {
    return closedCycles[0] || null // Oldest closed cycle
  }

  // 4. Last resort: return the first cycle (oldest by our sort)
  return sortedCycles[0] || null
}

/**
 * Store factory function that accepts dependencies
 * @param cycleDataService - Service for fetching cycle data
 * @param omegaConfig - Configuration instance
 * @param router - Vue Router instance
 * @returns Vuex store instance
 */
export default function createAppStore(
  cycleDataService: CycleDataService, 
  omegaConfig: OmegaConfig, 
  router: Router
): Store<State> {
  return createStore<State>({
    state: {
      // Raw data from backend
      cycles: [],
      roadmapItems: [],
      releaseItems: [],
      areas: [],
      initiatives: [],
      assignees: [],
      stages: [],
      
      // UI state
      selectedArea: null,
      selectedInitiative: null,
      selectedStage: null,
      selectedAssignee: null,
      selectedCycle: null,
      currentPage: 'cycle-overview',
      
      // Loading states
      isLoading: false,
      error: null,
      
      // Transformed data
      cycleOverviewData: null,
      roadmapData: null
    },

    mutations: {
      SET_LOADING(state: State, loading: boolean) {
        state.isLoading = loading
      },

      SET_ERROR(state: State, error: string | null) {
        state.error = error
      },

      SET_RAW_DATA(state: State, data: {
        cycles: Cycle[]
        roadmapItems: RoadmapItem[]
        releaseItems: ReleaseItem[]
        areas: Area[]
        initiatives: Initiative[]
        assignees: Assignee[]
        stages: any[]
      }) {
        state.cycles = data.cycles
        state.roadmapItems = data.roadmapItems
        state.releaseItems = data.releaseItems
        state.areas = data.areas
        state.initiatives = data.initiatives
        state.assignees = data.assignees
        state.stages = data.stages
      },

      SET_SELECTED_AREA(state: State, area: string | null) {
        state.selectedArea = area
      },

      SET_SELECTED_INITIATIVE(state: State, initiative: string | null) {
        state.selectedInitiative = initiative
      },

      SET_SELECTED_STAGE(state: State, stage: string | null) {
        state.selectedStage = stage
      },

      SET_SELECTED_ASSIGNEE(state: State, assignee: string | null) {
        state.selectedAssignee = assignee
      },

      SET_SELECTED_CYCLE(state: State, cycle: string | null) {
        state.selectedCycle = cycle
      },

      SET_CURRENT_PAGE(state: State, page: string) {
        state.currentPage = page
      },

      SET_CYCLE_OVERVIEW_DATA(state: State, data: any) {
        state.cycleOverviewData = data
      },

      SET_ROADMAP_DATA(state: State, data: any) {
        state.roadmapData = data
      }
    },

    actions: {
      async fetchCycleData({ commit, state }: any) {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)

        try {
          logger.default.info('Fetching cycle data from backend')
          const data = await cycleDataService.getCycleData()
          
          commit('SET_RAW_DATA', data)
          
          // Auto-select best cycle if none selected
          if (!state.selectedCycle && data.cycles.length > 0) {
            const bestCycle = selectBestCycle(data.cycles)
            if (bestCycle) {
              commit('SET_SELECTED_CYCLE', bestCycle.id)
            }
          }

          // Transform data based on current page
          await this.dispatch('transformData')
          
          logger.default.info('Cycle data fetched and transformed successfully')
        } catch (error) {
          const errorMessage = (error as Error)?.message || 'Failed to fetch cycle data'
          logger.error.errorSafe('Error fetching cycle data', error)
          commit('SET_ERROR', errorMessage)
        } finally {
          commit('SET_LOADING', false)
        }
      },

      async transformData({ commit, state }: any) {
        try {
          if (state.currentPage === 'cycle-overview') {
            const transformedData = transformForCycleOverview({
              cycles: state.cycles,
              roadmapItems: state.roadmapItems,
              releaseItems: state.releaseItems,
              areas: state.areas,
              initiatives: state.initiatives,
              assignees: state.assignees,
              stages: state.stages
            })
            commit('SET_CYCLE_OVERVIEW_DATA', transformedData)
          } else if (state.currentPage === 'roadmap') {
            const transformedData = transformForRoadmap({
              cycles: state.cycles,
              roadmapItems: state.roadmapItems,
              releaseItems: state.releaseItems,
              areas: state.areas,
              initiatives: state.initiatives,
              assignees: state.assignees,
              stages: state.stages
            })
            commit('SET_ROADMAP_DATA', transformedData)
          }
        } catch (error) {
          logger.error.errorSafe('Error transforming data', error)
          commit('SET_ERROR', 'Failed to transform data')
        }
      },

      setSelectedArea({ commit }: any, area: string | null) {
        commit('SET_SELECTED_AREA', area)
      },

      setSelectedInitiative({ commit }: any, initiative: string | null) {
        commit('SET_SELECTED_INITIATIVE', initiative)
      },

      setSelectedStage({ commit }: any, stage: string | null) {
        commit('SET_SELECTED_STAGE', stage)
      },

      setSelectedAssignee({ commit }: any, assignee: string | null) {
        commit('SET_SELECTED_ASSIGNEE', assignee)
      },

      setSelectedCycle({ commit }: any, cycle: string | null) {
        commit('SET_SELECTED_CYCLE', cycle)
      },

      setCurrentPage({ commit }: any, page: string) {
        commit('SET_CURRENT_PAGE', page)
        // Transform data for the new page
        this.dispatch('transformData')
      }
    },

    getters: {
      // Filtered data based on current selections
      filteredReleaseItems: (state: State) => {
        let items = state.releaseItems

        if (state.selectedArea) {
          items = filterByArea(items, state.selectedArea)
        }
        if (state.selectedInitiative) {
          items = filterByInitiatives(items, [state.selectedInitiative])
        }
        if (state.selectedStage) {
          items = filterByStages(items, [state.selectedStage])
        }
        if (state.selectedAssignee) {
          items = filterByAssignees(items, [state.selectedAssignee])
        }
        if (state.selectedCycle) {
          items = filterByCycle(items, state.selectedCycle)
        }

        return items
      },

      // Current cycle data
      currentCycle: (state: State) => {
        return state.cycles.find(cycle => cycle.id === state.selectedCycle)
      },

      // Available cycles for selection
      availableCycles: (state: State) => {
        return state.cycles.sort((a, b) => {
          const dateA = new Date(a.start || a.delivery || 0)
          const dateB = new Date(b.start || b.delivery || 0)
          return dateB.getTime() - dateA.getTime() // Most recent first
        })
      },

      // Available areas for selection
      availableAreas: (state: State) => {
        return state.areas.map(area => ({
          id: area.id,
          name: area.name
        }))
      },

      // Available initiatives for selection
      availableInitiatives: (state: State) => {
        return state.initiatives.map(initiative => ({
          id: initiative.id || initiative.initiativeId,
          name: initiative.name || initiative.initiative
        }))
      },

      // Available stages for selection
      availableStages: (state: State) => {
        return state.stages.map(stage => ({
          id: stage.value,
          name: stage.name
        }))
      },

      // Available assignees for selection
      availableAssignees: (state: State) => {
        return state.assignees.map(assignee => ({
          id: assignee.accountId,
          name: assignee.displayName
        }))
      }
    }
  })
}
