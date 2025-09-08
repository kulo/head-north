<template>
  <div class="area-container">
    <div class="area-header">
      <logo></logo>
      <page-selector></page-selector>
      <validation-selector></validation-selector>
      <sprint-selector></sprint-selector>
      <stage-selector></stage-selector>
      <initiative-selector></initiative-selector>
      <release-selector></release-selector>
      <assignee-selector></assignee-selector>
      <!--<cycle-area-selector></cycle-area-selector>-->
    </div>
    
    <div v-if="loading" class="loading-container">
      <a-spin size="large" />
      <p>Loading area data...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <a-alert type="error" :message="error" show-icon />
    </div>
    
    <div v-else-if="areaData && areaData.cycle && areaData.objectives" class="area-content">
      <global-objective-progress 
        :cycle="areaData.cycle" 
        :objectives="areaData.objectives">
      </global-objective-progress>
      
      <objective-chart 
        :objectives="areaData.objectives">
      </objective-chart>
    </div>
    
    <div v-else class="no-data-container">
      <a-empty description="No area data available. Please ensure the backend is running and providing data." />
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from "vue"
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
import GlobalObjectiveProgress from "./GlobalObjectiveProgress.vue"
import ObjectiveChart from "./ObjectiveChart.vue"

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
    GlobalObjectiveProgress,
    ObjectiveChart
  },
  setup() {
    const store = useStore()
    
    const loading = computed(() => store.state.loading)
    const error = computed(() => store.state.error)
    const areaData = computed(() => store.getters.currentAreaData)

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
      areaData
    }
  }
}
</script>

<style scoped>
.area-container {
  padding: 20px;
  min-height: 100vh;
  background: var(--color-background);
  color: var(--color-text-primary);
}

.area-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 10px;
  background: var(--color-background);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex-wrap: wrap;
}

.area-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.loading-container,
.error-container,
.no-data-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: var(--color-background);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.loading-container p {
  margin-top: 16px;
  color: var(--color-text-primary);
}
</style>