<template>
  <div class="cycle-overview-container">
    <div class="cycle-overview-header">
      <div class="cycle-overview-header__left">
        <logo></logo>
        <page-selector></page-selector>
        <cycle-selector></cycle-selector>
      </div>
      <div class="cycle-overview-header__right">
        <objective-selector></objective-selector>
        <area-selector></area-selector>
        <assignee-selector></assignee-selector>
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

    <div
      v-else-if="
        cycleOverviewData &&
        cycleOverviewData.cycle &&
        cycleOverviewData.objectives
      "
      class="cycle-overview-content"
    >
      <!-- Global Objective Progress -->
      <div class="global-objectives__container">
        <objective-chart
          v-if="
            cycleOverviewData.objectives &&
            cycleOverviewData.objectives.length > 0
          "
          :objectives="cycleOverviewData.objectives"
        >
        </objective-chart>
      </div>
      <div class="global-objectives__progress">
        <global-objective-progress
          :cycle="cycleOverviewData.cycle"
          :objectives="cycleOverviewData.objectives"
        >
        </global-objective-progress>
      </div>

      <!-- Objective and Roadmap Items Listing -->
      <div class="cycle-item-container">
        <div class="cycle-item-container-column">
          <template
            v-for="objective in cycleOverviewData.objectives"
            :key="objective.name"
          >
            <objective-list-item :objective="objective"></objective-list-item>
            <roadmap-item-list-item
              v-for="roadmapItem in objective.roadmapItems"
              :key="objective.name + roadmapItem.name"
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
import { useAppStore, useDataStore, useFilterStore } from "../../stores";
import Logo from "../ui/Logo.vue";
import PageSelector from "../ui/PageSelector.vue";
import ValidationSelector from "../ui/ValidationSelector.vue";
import CycleSelector from "../ui/CycleSelector.vue";
import AreaSelector from "../ui/AreaSelector.vue";
import ObjectiveSelector from "../ui/ObjectiveSelector.vue";
import StageSelector from "../ui/StageSelector.vue";
import AssigneeSelector from "../ui/AssigneeSelector.vue";
import GlobalObjectiveProgress from "./GlobalObjectiveProgress.vue";
import ObjectiveChart from "./ObjectiveChart.vue";
import ObjectiveListItem from "./ObjectiveListItem.vue";
import RoadmapItemListItem from "./RoadmapItemListItem.vue";

export default {
  name: "CycleOverview",
  components: {
    Logo,
    PageSelector,
    ValidationSelector,
    CycleSelector,
    AreaSelector,
    ObjectiveSelector,
    StageSelector,
    AssigneeSelector,
    GlobalObjectiveProgress,
    ObjectiveChart,
    ObjectiveListItem,
    RoadmapItemListItem,
  },
  setup() {
    const appStore = useAppStore();
    const dataStore = useDataStore();
    const filterStore = useFilterStore();

    // Use filtered data for proper filtering functionality
    const loading = computed(() => appStore.loading);
    const error = computed(() => appStore.error);
    const cycleOverviewData = computed(
      () => dataStore.filteredCycleOverviewData,
    );
    const isOverviewPage = computed(
      () => appStore.selectedPageName === "Cycle Overview",
    );

    // Dialog state
    const dialogOpen = ref(false);
    const selectedIssue = ref(null);

    const showValidation = (roadmapItem) => {
      dialogOpen.value = true;
      selectedIssue.value = roadmapItem;
    };

    onMounted(async () => {
      try {
        // Switch to cycle overview view
        await filterStore.switchView("cycle-overview");
      } catch (error) {
        console.error("Failed to switch to cycle overview view:", error);
      }
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
