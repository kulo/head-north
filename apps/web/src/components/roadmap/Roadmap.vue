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
      <div
        v-else-if="
          !roadmapData ||
          !roadmapData.initiatives ||
          roadmapData.initiatives.length === 0
        "
        class="no-data"
      >
        No roadmap data available
      </div>
      <div v-else>
        <div class="roadmap-table">
          <template
            v-for="(row, index) in roadmapData.initiatives"
            :key="row?.id || index"
          >
            <template v-if="row && row.id">
              <!-- Initiative header row -->
              <a-row class="roadmap-initiative-header-row">
                <a-col :span="6">
                  <div class="roadmap-initiative-header-name">
                    {{ row.name || `Initiative: ${row.id}` }}
                  </div>
                </a-col>
                <a-col v-for="cycle in orderedCycles" :key="cycle.id" :span="4">
                  <div class="roadmap-initiative-header-cycle">
                    {{ cycle.name }}
                  </div>
                </a-col>
              </a-row>

              <!-- Roadmap items for this initiative -->
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
import { useStore } from "vuex";
import RoadmapItemOverview from "./RoadmapItemOverview.vue";
import Logo from "../ui/Logo.vue";
import PageSelector from "../ui/PageSelector.vue";
import AreaSelector from "../ui/AreaSelector.vue";
import InitiativeSelector from "../ui/InitiativeSelector.vue";

export default {
  name: "Roadmap",
  components: {
    RoadmapItemOverview,
    Logo,
    PageSelector,
    AreaSelector,
    InitiativeSelector,
  },
  setup() {
    const store = useStore();

    // Use filtered data for proper filtering functionality
    const roadmapData = computed(() => store.getters.filteredRoadmapData);
    const loading = computed(() => store.state.loading);
    const error = computed(() => store.state.error);
    const cycles = computed(() => store.getters.cycles);

    // Extract cycles from store
    const orderedCycles = computed(() => {
      if (!cycles.value || cycles.value.length === 0) return [];
      return [...cycles.value].sort(
        (a, b) =>
          new Date(a.start || a.delivery || 0) -
          new Date(b.start || b.delivery || 0),
      );
    });

    onMounted(async () => {
      // Switch to roadmap view and reset view-specific filters
      await store.dispatch("switchView", "roadmap");
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
