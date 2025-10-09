<template>
  <a-select
    v-model:value="selectedStages"
    class="external-selector stage-selector"
    mode="multiple"
    :placeholder="ALL_STAGES_FILTER.name"
    @change="handleStageChange"
  >
    <a-select-option key="all" value="all">
      {{ ALL_STAGES_FILTER.name }}
    </a-select-option>
    <a-select-option
      v-for="stage in filteredStages"
      :key="stage.id"
      :value="stage.id"
      :class="{
        'stage-option-selected': isStageSelected(stage.id),
      }"
    >
      {{ stage.name }}
    </a-select-option>
  </a-select>
</template>

<script>
import { computed, ref, watch } from "vue";
import { useStore } from "vuex";
import { ALL_STAGES_FILTER } from "@/lib/utils/filter-constants";

export default {
  name: "StageSelector",
  setup() {
    const store = useStore();

    // Use store getters for global state
    const stages = computed(() => {
      const data = store.getters.stages;
      return Array.isArray(data) ? data : [];
    });
    const activeFilters = computed(() => store.getters.activeFilters);

    // Filter out "All Stages" from the dropdown options
    const filteredStages = computed(() => {
      return stages.value.filter((stage) => stage.id !== "all");
    });

    // Check if a stage is selected
    const isStageSelected = (stageId) => {
      const selectedStages = activeFilters.value.stages || [];
      return selectedStages.includes(stageId);
    };

    // Create writable ref for v-model
    const selectedStages = ref([]);

    // Watch store changes and update local ref
    watch(
      () => activeFilters.value.stages,
      (newValue) => {
        selectedStages.value = newValue || [];
      },
      { immediate: true },
    );

    const handleStageChange = (stageIds) => {
      // If "all" is selected, clear all selections
      if (stageIds && stageIds.includes("all")) {
        selectedStages.value = [];
        store.dispatch("updateFilter", { key: "stages", value: [] });
        return;
      }

      selectedStages.value = stageIds;

      // If no stages selected, clear the store (equivalent to "All Stages" selection)
      if (!stageIds || stageIds.length === 0) {
        store.dispatch("updateFilter", { key: "stages", value: [] });
        return;
      }

      // Update store with new stage IDs
      store.dispatch("updateFilter", { key: "stages", value: stageIds });
    };

    return {
      selectedStages,
      stages,
      filteredStages,
      isStageSelected,
      handleStageChange,
      ALL_STAGES_FILTER,
    };
  },
};
</script>
