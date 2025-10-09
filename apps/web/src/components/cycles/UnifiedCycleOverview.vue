<template>
  <div class="cycle-overview-container">
    <div class="cycle-overview-header">
      <div class="cycle-overview-header__left">
        <logo></logo>
        <page-selector></page-selector>
        <unified-cycle-selector></unified-cycle-selector>
      </div>
      <div class="cycle-overview-header__right">
        <unified-initiative-selector></unified-initiative-selector>
        <unified-area-selector></unified-area-selector>
        <unified-assignee-selector></unified-assignee-selector>
        <unified-stage-selector></unified-stage-selector>
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

    <div
      v-else-if="
        cycleOverviewData &&
        cycleOverviewData.cycle &&
        cycleOverviewData.initiatives
      "
      class="cycle-overview-content"
    >
      <!-- Global Initiative Progress -->
      <div class="global-initiatives__container">
        <initiative-chart
          v-if="
            cycleOverviewData.initiatives &&
            cycleOverviewData.initiatives.length > 0
          "
          :initiatives="cycleOverviewData.initiatives"
        >
        </initiative-chart>
      </div>
      <div class="global-initiatives__progress">
        <global-initiative-progress
          :cycle="cycleOverviewData.cycle"
          :initiatives="cycleOverviewData.initiatives"
        >
        </global-initiative-progress>
      </div>

      <!-- Initiative and Roadmap Items Listing -->
      <div class="release-item-container">
        <div class="release-item-container-column">
          <template
            v-for="initiative in cycleOverviewData.initiatives"
            :key="initiative.name"
          >
            <initiative-list-item
              :initiative="initiative"
            ></initiative-list-item>
            <roadmap-item-list-item
              v-for="roadmapItem in initiative.roadmapItems"
              :key="initiative.name + roadmapItem.name"
              :roadmap-item="roadmapItem"
              :show-area="isOverviewPage"
              @show-validation="showValidation"
            >
            </roadmap-item-list-item>
          </template>
        </div>
      </div>
    </div>

    <div v-else class="no-data-container">
      <a-empty
        description="No cycle overview data available. Please ensure the backend is running and providing data."
      />
    </div>

    <!-- Validation Dialog -->
    <a-modal
      v-model:open="dialogOpen"
      title="Validation Details"
      :footer="null"
      class="validation-dialog"
    >
      <div v-if="selectedIssue">
        <h3>{{ selectedIssue.name }}</h3>
        <div v-if="selectedIssue.validations">
          <div
            v-for="(validation, key) in selectedIssue.validations"
            :key="key"
            class="validation-item"
          >
            <strong>{{ key }}:</strong> {{ validation }}
          </div>
        </div>
        <div v-else>No validation details available.</div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { computed, onMounted, ref } from "vue";
import { useStore } from "vuex";
import Logo from "../ui/Logo.vue";
import PageSelector from "../ui/PageSelector.vue";
import ValidationSelector from "../ui/ValidationSelector.vue";
import UnifiedCycleSelector from "../ui/UnifiedCycleSelector.vue";
import UnifiedAreaSelector from "../ui/UnifiedAreaSelector.vue";
import UnifiedInitiativeSelector from "../ui/UnifiedInitiativeSelector.vue";
import UnifiedStageSelector from "../ui/UnifiedStageSelector.vue";
import UnifiedAssigneeSelector from "../ui/UnifiedAssigneeSelector.vue";
import GlobalInitiativeProgress from "./GlobalInitiativeProgress.vue";
import InitiativeChart from "./InitiativeChart.vue";
import InitiativeListItem from "./InitiativeListItem.vue";
import RoadmapItemListItem from "./RoadmapItemListItem.vue";

export default {
  name: "UnifiedCycleOverview",
  components: {
    Logo,
    PageSelector,
    ValidationSelector,
    UnifiedCycleSelector,
    UnifiedAreaSelector,
    UnifiedInitiativeSelector,
    UnifiedStageSelector,
    UnifiedAssigneeSelector,
    GlobalInitiativeProgress,
    InitiativeChart,
    InitiativeListItem,
    RoadmapItemListItem,
  },
  setup() {
    const store = useStore();

    // Use filtered data for proper filtering functionality
    const loading = computed(() => store.state.loading);
    const error = computed(() => store.state.error);
    const cycleOverviewData = computed(
      () => store.getters.filteredCycleOverviewData,
    );
    const isOverviewPage = computed(
      () => store.getters.selectedPageName === "Cycle Overview",
    );

    // Dialog state
    const dialogOpen = ref(false);
    const selectedIssue = ref(null);

    const showValidation = (roadmapItem) => {
      dialogOpen.value = true;
      selectedIssue.value = roadmapItem;
    };

    onMounted(async () => {
      // Switch to cycle overview view
      await store.dispatch("switchView", "cycle-overview");
    });

    return {
      loading,
      error,
      cycleOverviewData,
      isOverviewPage,
      dialogOpen,
      selectedIssue,
      showValidation,
    };
  },
};
</script>
