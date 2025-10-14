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
import { useDataStore, useFilterStore } from "../../stores";
import { ALL_STAGES_FILTER } from "@/lib/utils/filter-constants";

export default {
  name: "StageSelector",
  setup() {
    const dataStore = useDataStore();
    const filterStore = useFilterStore();

    // Use store getters for global state
    const stages = computed(() => {
      const data = dataStore.stages;
      return Array.isArray(data) ? data : [];
    });

    const activeFilters = computed(() => filterStore.activeFilters);

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

    const handleStageChange = async (stageIds) => {
      selectedStages.value = stageIds;
      try {
        await filterStore.updateArrayFilter("stages", stageIds, "all");
      } catch (error) {
        console.error("Failed to update stages filter:", error);
      }
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
