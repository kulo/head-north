<template>
  <div class="area-container">
    <div class="area-header">
      <div class="area-header__left">
        <logo></logo>
        <page-selector></page-selector>
      </div>
      <div class="area-header__right">
        <initiative-selector></initiative-selector>
        <assignee-selector></assignee-selector>
        <release-selector></release-selector>
        <stage-selector></stage-selector>
        <sprint-selector></sprint-selector>
        <validation-selector></validation-selector>
        <!--<cycle-area-selector></cycle-area-selector>-->
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <a-spin size="large" />
      <p>Loading area data...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <a-alert type="error" :message="error" show-icon />
    </div>
    
    <div v-else-if="areaData && areaData.cycle && areaData.initiatives" class="area-content">
      <div class="global-initiatives">
        <div class="global-initiatives__container">
          <initiative-chart 
            :initiatives="areaData.initiatives">
          </initiative-chart>
        </div>
        <div class="global-initiatives__progress">
          <global-initiative-progress 
            :cycle="areaData.cycle" 
            :initiatives="areaData.initiatives">
          </global-initiative-progress>
        </div>
      </div>
      
      <!-- Initiative and Roadmap Items Listing -->
      <div class="release-item-container">
        <div class="release-item-container-column">
          <template v-for="initiative in areaData.initiatives" :key="initiative.name">
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
      <a-empty description="No area data available. Please ensure the backend is running and providing data." />
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
import SprintSelector from "../selectors/SprintSelector.vue"
import StageSelector from "../selectors/StageSelector.vue"
import InitiativeSelector from "../selectors/InitiativeSelector.vue"
import ReleaseSelector from "../selectors/ReleaseSelector.vue"
import AssigneeSelector from "../selectors/AssigneeSelector.vue"
// TODO: Remove this import if CycleAreaSelector is permanently removed
// import CycleAreaSelector from "../selectors/CycleAreaSelector.vue"
import GlobalInitiativeProgress from "./GlobalInitiativeProgress.vue"
import InitiativeChart from "./InitiativeChart.vue"
import InitiativeListItem from "./InitiativeListItem.vue"
import RoadmapItemListItem from "./RoadmapItemListItem.vue"

export default {
  name: "Area",
  components: {
    Logo,
    PageSelector,
    ValidationSelector,
    SprintSelector,
    StageSelector,
    InitiativeSelector,
    ReleaseSelector,
    AssigneeSelector,
    // TODO: Remove this component if CycleAreaSelector is permanently removed
    // CycleAreaSelector,
    GlobalInitiativeProgress,
    InitiativeChart,
    InitiativeListItem,
    RoadmapItemListItem
  },
  setup() {
    const store = useStore()
    
    const loading = computed(() => store.state.loading)
    const error = computed(() => store.state.error)
    const areaData = computed(() => store.getters.currentAreaData)
    const isOverviewPage = computed(() => store.getters.selectedPageName === 'Cycle Overview')
    
    // Dialog state
    const dialogOpen = ref(false)
    const selectedIssue = ref(null)

    const showValidation = (roadmapItem) => {
      dialogOpen.value = true
      selectedIssue.value = roadmapItem
    }

    onMounted(async () => {
      // Load initial data
      await Promise.all([
        store.dispatch('fetchAreaData'),
        store.dispatch('fetchInitiatives'),
        store.dispatch('fetchAssignees'),
        store.dispatch('fetchAreas'),
        store.dispatch('fetchSprints'),
        store.dispatch('fetchStages'),
        store.dispatch('fetchReleaseFilters')
      ])
    })

    return {
      loading,
      error,
      areaData,
      isOverviewPage,
      dialogOpen,
      selectedIssue,
      showValidation
    }
  }
}
</script>
