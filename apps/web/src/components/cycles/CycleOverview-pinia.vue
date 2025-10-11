<template>
  <div class="cycle-overview-container">
    <div class="cycle-overview-header">
      <div class="cycle-overview-header__left">
        <logo></logo>
        <page-selector-pinia></page-selector-pinia>
        <cycle-selector-pinia></cycle-selector-pinia>
      </div>
      <div class="cycle-overview-header__right">
        <initiative-selector-pinia></initiative-selector-pinia>
        <area-selector-pinia></area-selector-pinia>
        <assignee-selector-pinia></assignee-selector-pinia>
        <stage-selector-pinia></stage-selector-pinia>
        <validation-selector-pinia></validation-selector-pinia>
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
            <roadmap-item-list-item-pinia
              v-for="roadmapItem in initiative.roadmapItems"
              :key="initiative.name + roadmapItem.name"
              :roadmap-item="roadmapItem"
              :show-area="isOverviewPage"
              @show-validation="showValidation"
            >
            </roadmap-item-list-item-pinia>
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
import {
  useAppStore,
  useDataStore,
  useFilterStore,
} from "../../stores/registry";
import Logo from "../ui/Logo.vue";
import PageSelectorPinia from "../ui/PageSelector-pinia.vue";
import ValidationSelectorPinia from "../ui/ValidationSelector-pinia.vue";
import CycleSelectorPinia from "../ui/CycleSelector-pinia.vue";
import AreaSelectorPinia from "../ui/AreaSelector-pinia.vue";
import InitiativeSelectorPinia from "../ui/InitiativeSelector-pinia.vue";
import StageSelectorPinia from "../ui/StageSelector-pinia.vue";
import AssigneeSelectorPinia from "../ui/AssigneeSelector-pinia.vue";
import GlobalInitiativeProgress from "./GlobalInitiativeProgress.vue";
import InitiativeChart from "./InitiativeChart.vue";
import InitiativeListItem from "./InitiativeListItem.vue";
import RoadmapItemListItemPinia from "./RoadmapItemListItem-pinia.vue";

export default {
  name: "CycleOverview",
  components: {
    Logo,
    PageSelectorPinia,
    ValidationSelectorPinia,
    CycleSelectorPinia,
    AreaSelectorPinia,
    InitiativeSelectorPinia,
    StageSelectorPinia,
    AssigneeSelectorPinia,
    GlobalInitiativeProgress,
    InitiativeChart,
    InitiativeListItem,
    RoadmapItemListItemPinia,
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
        await filterStore.switchView("cycle-overview", appStore);
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
