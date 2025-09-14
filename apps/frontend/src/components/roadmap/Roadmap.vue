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
      <div v-if="error" class="error">{{ error }}</div>
      <a-row :gutter="20">
        <a-col :span="4" :offset="index === 0 ? 6 : 0" :class="{ active: sprint.id === roadmapData.activeSprint.id}" v-for="(sprint, index) in roadmapData.orderedSprints" :key="sprint.id">
          <p style="text-align: center">{{ sprint.name }}</p>
        </a-col>
      </a-row>
      <a-collapse v-model:activeKey="activeInitiativeIds" class="initiative-collapse">
        <a-collapse-panel 
          v-for="row in filteredRoadmapData" 
          :key="row.initiativeId || 'unknown'" 
          :name="row.initiativeId || 'unknown'" 
          class="initiative-panel"
        >
          <template #header>
            <span>{{ initiativeName(row.initiativeId) || `Initiative: ${row.initiativeId}` }}</span>
          </template>
          <roadmap-item-overview 
            :orderedSprints="roadmapData.orderedSprints" 
            :roadmapItem="roadmapItem" 
            :itemIndex="index" 
            v-for="(roadmapItem, index) in row.roadmapItems" 
            :key="roadmapItem.id"
          ></roadmap-item-overview>
        </a-collapse-panel>
      </a-collapse>
    </a-layout-content>
  </div>
</template>

<script>
import { computed, onMounted, ref, watch } from "vue"
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
    
    // Filter roadmap data based on selected initiatives and area
    const filteredRoadmapData = computed(() => {
      if (!roadmapData.value || !roadmapData.value.roadmapItems) {
        return []
      }
      
      let filteredItems = roadmapData.value.roadmapItems
      
      // Filter by selected initiatives
      if (selectedInitiatives.value && selectedInitiatives.value.length > 0) {
        // Check if "All" is selected
        const isAllSelected = selectedInitiatives.value.some(init => 
          init && (init.id === 'all' || init.value === 'all')
        )
        
        if (!isAllSelected) {
          // Filter by selected initiative IDs
          const selectedInitiativeIds = selectedInitiatives.value
            .filter(init => init && init.id)
            .map(init => String(init.id)) // Convert to string for comparison
            .filter(id => id !== 'all')
          
          filteredItems = filteredItems.filter(row => 
            selectedInitiativeIds.includes(String(row.initiativeId)) // Convert to string for comparison
          )
        }
      }
      
      // Filter by selected area
      if (selectedArea.value && selectedArea.value !== 'all') {
        filteredItems = filteredItems.filter(row => {
          // Check if any roadmap item in this row matches the selected area
          return row.roadmapItems.some(roadmapItem => 
            roadmapItem.area === selectedArea.value
          )
        })
      }
      
      return filteredItems
    })
    
    const initiativeIds = computed(() => {
      return initiatives.value.map(x => x.id);
    })
    
    // Create a reactive reference for the active initiative IDs (for v-model)
    const activeInitiativeIds = ref([])
    
    // Watch for changes in filtered roadmap data to auto-expand all panels
    watch(filteredRoadmapData, (newData) => {
      if (newData && newData.length > 0) {
        activeInitiativeIds.value = newData.map(row => row.initiativeId || 'unknown')
      }
    }, { immediate: true })

    const fetchRoadmap = async () => {
      await store.dispatch('fetchRoadmap')
    }

    onMounted(async () => {
      await fetchRoadmap();
      console.log('🔍 Roadmap mounted - Initiatives:', initiatives.value);
      console.log('🔍 Roadmap mounted - Filtered data:', filteredRoadmapData.value);
      if (filteredRoadmapData.value.length > 0) {
        console.log('🔍 First row initiativeId:', filteredRoadmapData.value[0].initiativeId);
        console.log('🔍 Initiative name for first row:', initiativeName.value(filteredRoadmapData.value[0].initiativeId));
      }
    })

    // Watch for changes in initiatives
    watch(initiatives, (newInitiatives) => {
      console.log('🔍 Initiatives changed:', newInitiatives);
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
      fetchRoadmap
    }
  }
}
</script>

