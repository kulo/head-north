<template>
  <div class="cycle-overview-container">
    <div class="cycle-overview-header">
      <div class="cycle-overview-header__left">
        <logo></logo>
        <page-selector></page-selector>
      </div>
      <div class="cycle-overview-header__right">
        <initiative-selector></initiative-selector>
        <area-selector></area-selector>
      </div>
    </div>
    <a-layout-content id="roadmaps">
      <div v-if="loading" class="loading">Loading roadmap data...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="!filteredRoadmapData || filteredRoadmapData.length === 0" class="no-data">
        No roadmap data available
      </div>
      <div v-else>
        <a-row :gutter="20">
          <a-col :span="4" :offset="index === 0 ? 6 : 0" :class="{ active: cycle.id === activeCycle?.id}" v-for="(cycle, index) in orderedCycles" :key="cycle.id">
            <p style="text-align: center">{{ cycle.name }}</p>
          </a-col>
        </a-row>
        <a-collapse 
          v-model:activeKey="activeInitiativeIds" 
          class="initiative-collapse"
          :expandIconPosition="'right'"
        >
          <template v-for="(row, index) in filteredRoadmapData" :key="row?.initiativeId || index">
            <a-collapse-panel 
              v-if="row && row.initiativeId"
              :key="row.initiativeId" 
              class="initiative-panel"
            >
              <template #header>
                <span>{{ initiativeName(row.initiativeId) || `Initiative: ${row.initiativeId}` }}</span>
              </template>
              <roadmap-item-overview 
                :orderedCycles="orderedCycles" 
                :roadmapItem="roadmapItem" 
                :itemIndex="itemIndex" 
                v-for="(roadmapItem, itemIndex) in (row.roadmapItems || [])" 
                :key="roadmapItem.id"
              ></roadmap-item-overview>
            </a-collapse-panel>
          </template>
        </a-collapse>
      </div>
    </a-layout-content>
  </div>
</template>

<script>
import { computed, nextTick, onMounted, ref, watch } from "vue"
import { useStore } from "vuex"
import RoadmapItemOverview from "./RoadmapItemOverview.vue";
import Logo from "../Logo.vue";
import PageSelector from "../selectors/PageSelector.vue";
import AreaSelector from "../selectors/AreaSelector.vue";
import InitiativeSelector from "../selectors/InitiativeSelector.vue";
import AssigneeSelector from "../selectors/AssigneeSelector.vue";

export default {
  name: "Roadmap",
  components: {
    RoadmapItemOverview, 
    Logo, 
    PageSelector,
    AreaSelector, 
    AssigneeSelector, 
    InitiativeSelector
  },
  setup() {
    const store = useStore()
    
    const roadmapData = computed(() => store.getters.roadmapData)
    const initiativeName = computed(() => store.getters.initiativeName)
    const loading = computed(() => store.state.loading)
    const error = computed(() => store.state.error)
    const initiatives = computed(() => store.state.initiatives)
    const selectedInitiatives = computed(() => store.state.selectedInitiatives)
    const selectedArea = computed(() => store.state.selectedArea)
    const areas = computed(() => {
      const areasData = store.state.areas || []
      console.log('Areas data:', areasData)
      return areasData
    })
    
    // Use the unified filtering getter from the store
    const filteredRoadmapData = computed(() => store.getters.filteredRoadmapData)
    
    // Extract cycles from unified data structure using new transformation methods
    const orderedCycles = computed(() => {
      if (!roadmapData.value?.metadata?.cycles) return []
      return [...roadmapData.value.metadata.cycles].sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    })
    
    const activeCycle = computed(() => {
      if (!roadmapData.value?.metadata?.cycles) return null
      const activeCycles = roadmapData.value.metadata.cycles.filter(cycle => cycle.state === 'active')
      if (activeCycles.length === 0) return null
      return activeCycles.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0]
    })
    
    const initiativeIds = computed(() => {
      return initiatives.value.map(x => x.id);
    })
    
    // Create a reactive reference for the active initiative IDs (for v-model)
    const activeInitiativeIds = ref([])
    
    // Watch for changes in filtered roadmap data to auto-expand all panels
    // Only expand on initial load, not on every filter change
    let isInitialLoad = true
    let hasExpandedInitially = false
    
    watch(filteredRoadmapData, (newData) => {
      if (newData && newData.length > 0) {
        const initiativeIds = newData
          .filter(row => row && row.initiativeId)
          .map(row => row.initiativeId)
        
        // Only auto-expand on initial load, not on filter changes
        if (isInitialLoad && !hasExpandedInitially) {
          // Use a longer delay to ensure DOM is fully ready
          setTimeout(() => {
            activeInitiativeIds.value = [...initiativeIds]
            isInitialLoad = false
            hasExpandedInitially = true
          }, 500)
        }
        // On filter changes, preserve current expanded state
      } else {
        activeInitiativeIds.value = []
      }
    }, { immediate: true })

    const fetchRoadmap = async () => {
      await store.dispatch('fetchRoadmap')
    }
    

    const fetchAreas = async () => {
      await store.dispatch('fetchAreas')
    }
    

    onMounted(async () => {
      await Promise.all([
        fetchRoadmap(),
        fetchAreas()
      ]);
    })

    // Watch for changes in initiatives
    watch(initiatives, (newInitiatives) => {
      // Initiatives changed - no action needed as filtering is handled by store
    }, { immediate: true })

    return {
      roadmapData,
      filteredRoadmapData,
      initiativeName,
      loading,
      error,
      initiatives,
      initiativeIds,
      activeInitiativeIds,
      areas,
      orderedCycles,
      activeCycle,
      fetchRoadmap
    }
  }
}
</script>

