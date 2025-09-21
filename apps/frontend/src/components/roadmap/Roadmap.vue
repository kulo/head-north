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
        
        <div class="roadmap-table">
          <template v-for="(row, index) in filteredRoadmapData" :key="row?.initiativeId || index">
            <template v-if="row && row.initiativeId">
              <!-- Initiative header row -->
              <a-row class="roadmap-initiative-header-row">
                <a-col :span="6">
                  <div class="roadmap-initiative-header-name">
                    {{ initiativeName(row.initiativeId) || `Initiative: ${row.initiativeId}` }}
                  </div>
                </a-col>
                <a-col :span="4" v-for="cycle in orderedCycles" :key="cycle.id">
                  <div class="roadmap-initiative-header-cycle">{{ cycle.name }}</div>
                </a-col>
              </a-row>
              
              <!-- Roadmap items for this initiative -->
              <roadmap-item-overview 
                :orderedCycles="orderedCycles" 
                :roadmapItem="roadmapItem" 
                :itemIndex="itemIndex" 
                v-for="(roadmapItem, itemIndex) in (row.roadmapItems || [])" 
                :key="roadmapItem.id"
              ></roadmap-item-overview>
            </template>
          </template>
        </div>
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
    const areas = computed(() => store.state.areas || [])
    
    // Use the unified filtering getter from the store
    const filteredRoadmapData = computed(() => store.getters.filteredRoadmapData)
    
    // Extract cycles from store
    const orderedCycles = computed(() => {
      const cycles = store.getters.cycles
      if (!cycles || cycles.length === 0) return []
      return [...cycles].sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    })
    
    const activeCycle = computed(() => {
      if (!roadmapData.value?.cycles) return null
      const activeCycles = roadmapData.value.cycles.filter(cycle => cycle.state === 'active')
      if (activeCycles.length === 0) return null
      return activeCycles.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0]
    })
    
    const initiativeIds = computed(() => {
      return initiatives.value.map(x => x.id);
    })
    

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
      areas,
      orderedCycles,
      activeCycle,
      fetchRoadmap
    }
  }
}
</script>

