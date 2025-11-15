<template>
  <div class="cycle-overview-container">
    <div class="cycle-overview-header">
      <div class="cycle-overview-header__left">
        <logo></logo>
        <page-selector></page-selector>
      </div>
      <div class="cycle-overview-header__right">
        <objective-selector></objective-selector>
        <area-selector></area-selector>
      </div>
    </div>
    <a-layout-content id="roadmaps">
      <div v-if="loading" class="loading">Loading roadmap data...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div
        v-else-if="
          !roadmapData ||
          !roadmapData.objectives ||
          roadmapData.objectives.length === 0
        "
        class="no-data"
      >
        No roadmap data available
      </div>
      <div v-else>
        <div class="roadmap-table">
          <template
            v-for="(row, index) in roadmapData.objectives"
            :key="row?.id || index"
          >
            <template v-if="row && row.id">
              <!-- Objective header row -->
              <a-row class="roadmap-objective-header-row">
                <a-col :span="6">
                  <div class="roadmap-objective-header-name">
                    {{ row.name || `Objective: ${row.id}` }}
                  </div>
                </a-col>
                <a-col v-for="cycle in orderedCycles" :key="cycle.id" :span="4">
                  <div class="roadmap-objective-header-cycle">
                    {{ cycle.name }}
                  </div>
                </a-col>
              </a-row>

              <!-- Roadmap items for this objective -->
              <roadmap-item-overview
                v-for="(roadmapItem, itemIndex) in row.roadmapItems || []"
                :key="roadmapItem.id"
                :orderedCycles="orderedCycles"
                :roadmapItem="roadmapItem"
                :itemIndex="itemIndex"
              ></roadmap-item-overview>
            </template>
          </template>
        </div>
      </div>
    </a-layout-content>
  </div>
</template>

<script>
import { computed, onMounted } from "vue";
import { useAppStore, useDataStore, useFilterStore } from "../../stores";
import RoadmapItemOverview from "./RoadmapItemOverview.vue";
import Logo from "../ui/Logo.vue";
import PageSelector from "../ui/PageSelector.vue";
import AreaSelector from "../ui/AreaSelector.vue";
import ObjectiveSelector from "../ui/ObjectiveSelector.vue";

export default {
  name: "Roadmap",
  components: {
    RoadmapItemOverview,
    Logo,
    PageSelector,
    AreaSelector,
    ObjectiveSelector,
  },
  setup() {
    const appStore = useAppStore();
    const dataStore = useDataStore();
    const filterStore = useFilterStore();

    // Use filtered data for proper filtering functionality
    const roadmapData = computed(() => dataStore.filteredRoadmapData);

    const loading = computed(() => appStore.loading);
    const error = computed(() => appStore.error);
    const orderedCycles = computed(() => dataStore.orderedCycles);

    onMounted(async () => {
      try {
        // Switch to roadmap view and reset view-specific filters
        await filterStore.switchView("roadmap");
      } catch (error) {
        console.error("Failed to switch to roadmap view:", error);
      }
    });

    return {
      loading,
      error,
      roadmapData,
      orderedCycles,
    };
  },
};
</script>
