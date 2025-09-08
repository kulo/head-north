<template>
  <div class="area-container">
    <a-layout-header :style="{ height: '50px', lineHeight: '50px' }" class="area-header" v-if="!loading">
      <div class="area-header">
        <logo></logo>
        <page-selector></page-selector>
        <!-- TODO: Remove this if CycleAreaSelector is permanently removed -->
        <!-- <cycle-area-selector></cycle-area-selector> -->
        <initiative-selector></initiative-selector>
      </div>  
    </a-layout-header>
    <a-layout-content id="roadmaps">
      <div v-if="error" class="error">{{ error }}</div>
      <a-row :gutter="20">
        <a-col :span="4" :offset="index === 0 ? 6 : 0" :class="{ active: sprint.id === releaseOverviewData.activeSprint.id}" v-for="(sprint, index) in releaseOverviewData.orderedSprints" :key="sprint.id">
          <p style="text-align: center">{{ sprint.name }}</p>
        </a-col>
      </a-row>
      <a-collapse v-model:activeKey="activeInitiativeIds">
        <a-collapse-panel v-for="row in releaseOverviewData.roadmapItems" :key="row.initiativeId" :name="row.initiativeId" :title="initiativeName(row)">
          <roadmap-item-overview :orderedSprints="releaseOverviewData.orderedSprints" :roadmapItem="roadmapItem" :itemIndex="index" v-for="(roadmapItem, index) in row.roadmapItems" :key="roadmapItem.id"></roadmap-item-overview>
        </a-collapse-panel>
      </a-collapse>
    </a-layout-content>
  </div>
</template>

<script>
import { computed, onMounted, ref } from "vue"
import { useStore } from "vuex"
import RoadmapItemOverview from "./RoadmapItemOverview.vue";
import Logo from "../Logo.vue";
import PageSelector from "../selectors/PageSelector.vue";
import AreaSelector from "../selectors/AreaSelector.vue";
import InitiativeSelector from "../selectors/InitiativeSelector.vue";
import AssigneeSelector from "../selectors/AssigneeSelector.vue";

export default {
  name: "ReleaseOverview",
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
    
    const releaseOverviewData = computed(() => store.getters.releaseOverviewData)
    const initiativeName = computed(() => store.getters.initiativeName)
    const loading = computed(() => store.state.loading)
    const error = computed(() => store.state.error)
    const initiatives = computed(() => store.state.initiatives)
    
    const initiativeIds = computed(() => {
      return initiatives.value.map(x => x.id);
    })
    
    // Create a reactive reference for the active initiative IDs (for v-model)
    const activeInitiativeIds = ref([])

    const fetchReleaseOverview = async () => {
      await store.dispatch('fetchReleaseOverview')
    }

    onMounted(async () => {
      await fetchReleaseOverview();
    })

    return {
      releaseOverviewData,
      initiativeName,
      loading,
      error,
      initiatives,
      initiativeIds,
      activeInitiativeIds,
      fetchReleaseOverview
    }
  }
}
</script>

<style scoped>
.release-title {
  font-size: 24px;
  color: var(--color-text-primary);
  outline: 0;
  font-weight: normal;
  margin: 0;
  padding-top: 5px;
}

#roadmaps {
  position: relative;
  padding: 0;
  z-index: 1;
  background: var(--color-background);
  color: var(--color-text-primary);
}

.sprint {
  float: left;
  width: 250px;
  height: 50px;
  color: var(--color-text-primary);
  background: var(--color-gray-800);
  border: 1px solid var(--color-gray-700);
  margin: 2px;
  padding: 10px;
  text-align: center;
  border-radius: 4px;
}

.active {
  color: var(--color-success);
  background: var(--color-gray-700);
  border-color: var(--color-success);
}
</style>
