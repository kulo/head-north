<template>
  <div class="cycle-overview-container">
    <div class="cycle-overview-header">
      <div class="cycle-overview-header__left">
        <logo></logo>
        <page-selector></page-selector>
        <cycle-selector></cycle-selector>
      </div>
      <div class="cycle-overview-header__right">
        <initiative-selector></initiative-selector>
        <area-selector></area-selector>
        <assignee-selector></assignee-selector>
        <release-selector></release-selector>
        <stage-selector></stage-selector>
        <validation-selector></validation-selector>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <a-spin size="large" />
      <p>Loading data...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <a-alert type="error" :message="error" show-icon />
    </div>
    
    <div v-else-if="cycleOverviewData && cycleOverviewData.cycle && cycleOverviewData.initiatives" class="cycle-overview-content">
      <div class="global-initiatives">
        <div class="global-initiatives__container">
          <initiative-chart 
            :initiatives="cycleOverviewData.initiatives">
          </initiative-chart>
        </div>
        <div class="global-initiatives__progress">
          <global-initiative-progress 
            :cycle="cycleOverviewData.cycle" 
            :initiatives="cycleOverviewData.initiatives">
          </global-initiative-progress>
        </div>
      </div>
      
      <!-- Initiative and Roadmap Items Listing -->
      <div class="release-item-container">
        <div class="release-item-container-column">
          <template v-for="initiative in cycleOverviewData.initiatives" :key="initiative.name">
            <initiative-list-item :initiative="initiative"></initiative-list-item>
            <roadmap-item-list-item 
              v-for="roadmapItem in initiative.roadmapItems" 
              :key="initiative.name + roadmapItem.name" 
              :roadmap-item="roadmapItem" 
              :show-area="isOverviewPage" 
              @show-validation="showValidation">
            </roadmap-item-list-item>
          </template>
        </div>
      </div>
    </div>
    
    <div v-else class="no-data-container">
      <a-empty description="No cycle overview data available. Please ensure the backend is running and providing data." />
    </div>
    
    <!-- Validation Dialog -->
    <a-modal 
      v-model:open="dialogOpen" 
      title="Validation Details"
      :footer="null"
      class="validation-dialog">
      <div v-if="selectedIssue">
        <h3>
          <a :href="selectedIssue.url" class="jira-link" target="_blank">
            {{ selectedIssue.ticketId + ': ' + selectedIssue.name }}
            <a-icon type="link" />
          </a>
        </h3>
        <a-divider />
        <p>Found issues:</p>
        <ul>
          <li v-for="validation in selectedIssue.validations" :key="validation.label">
            <a :href="validation.reference" target="_blank">
              {{ validation.label }}
              <a-icon type="link" />
            </a>
          </li>
        </ul>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { computed, onMounted, ref } from "vue"
import { useStore } from "vuex"
import Logo from "../Logo.vue"
import PageSelector from "../selectors/PageSelector.vue"
import ValidationSelector from "../selectors/ValidationSelector.vue"
import CycleSelector from "../selectors/CycleSelector.vue"
import AreaSelector from "../selectors/AreaSelector.vue"
import StageSelector from "../selectors/StageSelector.vue"
import InitiativeSelector from "../selectors/InitiativeSelector.vue"
import ReleaseSelector from "../selectors/ReleaseSelector.vue"
import AssigneeSelector from "../selectors/AssigneeSelector.vue"
import GlobalInitiativeProgress from "./GlobalInitiativeProgress.vue"
import InitiativeChart from "./InitiativeChart.vue"
import InitiativeListItem from "./InitiativeListItem.vue"
import RoadmapItemListItem from "./RoadmapItemListItem.vue"

export default {
  name: "CycleOverview",
  components: {
    Logo,
    PageSelector,
    ValidationSelector,
    CycleSelector,
    AreaSelector,
    InitiativeSelector,
    StageSelector,
    ReleaseSelector,
    AssigneeSelector,
    GlobalInitiativeProgress,
    InitiativeChart,
    InitiativeListItem,
    RoadmapItemListItem
  },
  setup() {
    const store = useStore()
    
    const loading = computed(() => store.state.loading)
    const error = computed(() => store.state.error)
const cycleOverviewData = computed(() => {
  return store.getters.currentCycleOverviewData
})
    const isOverviewPage = computed(() => store.getters.selectedPageName === 'Cycle Overview')
    
    
    // Dialog state
    const dialogOpen = ref(false)
    const selectedIssue = ref(null)

    const showValidation = (roadmapItem) => {
      dialogOpen.value = true
      selectedIssue.value = roadmapItem
    }

    onMounted(async () => {
      // Ensure we have a selected cycle before loading data
      await store.dispatch('_ensureSelectedCycle')
      
      // Load initial data
      await Promise.all([
        store.dispatch('fetchCycleOverviewData'),
        store.dispatch('fetchInitiatives'),
        store.dispatch('fetchAssignees'),
        store.dispatch('fetchAreas'),
        store.dispatch('fetchCycles'),
        store.dispatch('fetchStages'),
        store.dispatch('fetchReleaseFilters')
      ])
    })

    return {
      loading,
      error,
      cycleOverviewData,
      isOverviewPage,
      dialogOpen,
      selectedIssue,
      showValidation
    }
  }
}
</script>
