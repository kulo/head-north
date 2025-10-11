<template>
  <div class="store-comparison-demo">
    <h2>Vuex vs Pinia Component Comparison</h2>
    <p>
      This demo shows the same components implemented with both Vuex and Pinia
      stores.
    </p>

    <div class="demo-section">
      <h3>Page Selector</h3>
      <div class="component-row">
        <div class="component-column">
          <h4>Vuex Version</h4>
          <PageSelector />
        </div>
        <div class="component-column">
          <h4>Pinia Version</h4>
          <PageSelectorPinia />
        </div>
        <div class="component-column">
          <h4>Hybrid (Switchable)</h4>
          <PageSelectorHybrid />
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>Area Selector</h3>
      <div class="component-row">
        <div class="component-column">
          <h4>Vuex Version</h4>
          <AreaSelector />
        </div>
        <div class="component-column">
          <h4>Pinia Version</h4>
          <AreaSelectorPinia />
        </div>
        <div class="component-column">
          <h4>Hybrid (Switchable)</h4>
          <AreaSelectorHybrid />
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>Cycle Selector</h3>
      <div class="component-row">
        <div class="component-column">
          <h4>Vuex Version</h4>
          <CycleSelector />
        </div>
        <div class="component-column">
          <h4>Pinia Version</h4>
          <CycleSelectorPinia />
        </div>
        <div class="component-column">
          <h4>Hybrid (Switchable)</h4>
          <CycleSelectorHybrid />
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>Initiative Selector</h3>
      <div class="component-row">
        <div class="component-column">
          <h4>Vuex Version</h4>
          <InitiativeSelector />
        </div>
        <div class="component-column">
          <h4>Pinia Version</h4>
          <InitiativeSelectorPinia />
        </div>
        <div class="component-column">
          <h4>Hybrid (Switchable)</h4>
          <InitiativeSelectorHybrid />
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>Stage Selector</h3>
      <div class="component-row">
        <div class="component-column">
          <h4>Vuex Version</h4>
          <StageSelector />
        </div>
        <div class="component-column">
          <h4>Pinia Version</h4>
          <StageSelectorPinia />
        </div>
        <div class="component-column">
          <h4>Hybrid (Switchable)</h4>
          <StageSelectorHybrid />
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>Assignee Selector</h3>
      <div class="component-row">
        <div class="component-column">
          <h4>Vuex Version</h4>
          <AssigneeSelector />
        </div>
        <div class="component-column">
          <h4>Pinia Version</h4>
          <AssigneeSelectorPinia />
        </div>
        <div class="component-column">
          <h4>Hybrid (Switchable)</h4>
          <AssigneeSelectorHybrid />
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>Validation Selector</h3>
      <div class="component-row">
        <div class="component-column">
          <h4>Vuex Version</h4>
          <ValidationSelector />
        </div>
        <div class="component-column">
          <h4>Pinia Version</h4>
          <ValidationSelectorPinia />
        </div>
        <div class="component-column">
          <h4>Hybrid (Switchable)</h4>
          <ValidationSelectorHybrid />
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>Complex Components</h3>
      <div class="component-row">
        <div class="component-column">
          <h4>RoadmapItemListItem</h4>
          <p><em>Complex component with popover and validation</em></p>
        </div>
        <div class="component-column">
          <h4>CycleOverview</h4>
          <p><em>Main page component with multiple sub-components</em></p>
        </div>
        <div class="component-column">
          <h4>Roadmap</h4>
          <p><em>Complex table layout with filtering</em></p>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>Store State Comparison</h3>
      <div class="state-comparison">
        <div class="state-column">
          <h4>Vuex Store State</h4>
          <pre>{{ vuexState }}</pre>
        </div>
        <div class="state-column">
          <h4>Pinia Store State</h4>
          <pre>{{ piniaState }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from "vue";
import { useStore } from "vuex";
import { useAppStore } from "../../stores/app";
import { useDataStore } from "../../stores/data";
import { useFilterStore } from "../../stores/filters";
import { useValidationStore } from "../../stores/validation";

// Import components
import PageSelector from "../ui/PageSelector.vue";
import PageSelectorPinia from "../ui/PageSelector-pinia.vue";
import PageSelectorHybrid from "../ui/PageSelector-hybrid.vue";
import AreaSelector from "../ui/AreaSelector.vue";
import AreaSelectorPinia from "../ui/AreaSelector-pinia.vue";
import AreaSelectorHybrid from "../ui/AreaSelector-hybrid.vue";
import CycleSelector from "../ui/CycleSelector.vue";
import CycleSelectorPinia from "../ui/CycleSelector-pinia.vue";
import CycleSelectorHybrid from "../ui/CycleSelector-hybrid.vue";
import InitiativeSelector from "../ui/InitiativeSelector.vue";
import InitiativeSelectorPinia from "../ui/InitiativeSelector-pinia.vue";
import InitiativeSelectorHybrid from "../ui/InitiativeSelector-hybrid.vue";
import StageSelector from "../ui/StageSelector.vue";
import StageSelectorPinia from "../ui/StageSelector-pinia.vue";
import StageSelectorHybrid from "../ui/StageSelector-hybrid.vue";
import AssigneeSelector from "../ui/AssigneeSelector.vue";
import AssigneeSelectorPinia from "../ui/AssigneeSelector-pinia.vue";
import AssigneeSelectorHybrid from "../ui/AssigneeSelector-hybrid.vue";
import ValidationSelector from "../ui/ValidationSelector.vue";
import ValidationSelectorPinia from "../ui/ValidationSelector-pinia.vue";
import ValidationSelectorHybrid from "../ui/ValidationSelector-hybrid.vue";
import RoadmapItemListItem from "../cycles/RoadmapItemListItem.vue";
import RoadmapItemListItemPinia from "../cycles/RoadmapItemListItem-pinia.vue";
import RoadmapItemListItemHybrid from "../cycles/RoadmapItemListItem-hybrid.vue";
import CycleOverview from "../cycles/CycleOverview.vue";
import CycleOverviewPinia from "../cycles/CycleOverview-pinia.vue";
import Roadmap from "../roadmap/Roadmap.vue";
import RoadmapPinia from "../roadmap/Roadmap-pinia.vue";

export default {
  name: "StoreComparisonDemo",
  components: {
    PageSelector,
    PageSelectorPinia,
    PageSelectorHybrid,
    AreaSelector,
    AreaSelectorPinia,
    AreaSelectorHybrid,
    CycleSelector,
    CycleSelectorPinia,
    CycleSelectorHybrid,
    InitiativeSelector,
    InitiativeSelectorPinia,
    InitiativeSelectorHybrid,
    StageSelector,
    StageSelectorPinia,
    StageSelectorHybrid,
    AssigneeSelector,
    AssigneeSelectorPinia,
    AssigneeSelectorHybrid,
    ValidationSelector,
    ValidationSelectorPinia,
    ValidationSelectorHybrid,
    RoadmapItemListItem,
    RoadmapItemListItemPinia,
    RoadmapItemListItemHybrid,
    CycleOverview,
    CycleOverviewPinia,
    Roadmap,
    RoadmapPinia,
  },
  setup() {
    const vuexStore = useStore();
    const appStore = useAppStore();
    const dataStore = useDataStore();
    const filterStore = useFilterStore();
    const validationStore = useValidationStore();

    const vuexState = computed(() => ({
      loading: vuexStore.state.loading,
      error: vuexStore.state.error,
      currentPage: vuexStore.state.currentPage,
      validationEnabled: vuexStore.state.validationEnabled,
      filters: vuexStore.state.filters,
      areas: vuexStore.getters.areas?.length || 0,
      pages: vuexStore.getters.pages?.length || 0,
    }));

    const piniaState = computed(() => ({
      loading: appStore.isLoading,
      error: appStore.errorMessage,
      currentPage: appStore.currentPageId,
      validationEnabled: validationStore.isValidationEnabled,
      filters: filterStore.currentFilters,
      areas: dataStore.areas?.length || 0,
      pages: appStore.allPages?.length || 0,
    }));

    return {
      vuexState,
      piniaState,
    };
  },
};
</script>

<style scoped>
.store-comparison-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;
}

.component-row {
  display: flex;
  gap: 20px;
  margin-top: 15px;
}

.component-column {
  flex: 1;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

.component-column h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 14px;
}

.state-comparison {
  display: flex;
  gap: 20px;
  margin-top: 15px;
}

.state-column {
  flex: 1;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

.state-column h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 14px;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  margin: 0;
}

h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

h3 {
  color: #34495e;
  margin-bottom: 10px;
}

p {
  color: #666;
  margin-bottom: 20px;
}
</style>
