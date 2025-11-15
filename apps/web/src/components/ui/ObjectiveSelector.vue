<template>
  <a-select
    v-model:value="selectedObjectives"
    class="external-selector objective-selector"
    mode="multiple"
    :placeholder="ALL_OBJECTIVES_FILTER.name"
    @change="handleObjectiveChange"
  >
    <a-select-option key="all" value="all">
      {{ ALL_OBJECTIVES_FILTER.name }}
    </a-select-option>
    <a-select-option
      v-for="objective in filteredObjectives"
      :key="objective.id"
      :value="objective.id"
    >
      {{ objective.name }}
    </a-select-option>
  </a-select>
</template>

<script>
import { ref, computed, watch } from "vue";
import { useDataStore, useFilterStore } from "../../stores";
import { ALL_OBJECTIVES_FILTER } from "@/lib/utils/filter-constants";

export default {
  name: "ObjectiveSelector",
  setup() {
    const dataStore = useDataStore();
    const filterStore = useFilterStore();

    const selectedObjectives = ref([]);
    const objectives = computed(() => {
      const data = dataStore.objectives;
      return Array.isArray(data) ? data : [];
    });

    const activeFilters = computed(() => filterStore.activeFilters);

    // Filter out "All Objectives" from the dropdown options
    const filteredObjectives = computed(() => {
      return objectives.value.filter((obj) => obj.id !== "all");
    });

    // Watch for changes in store and update local ref
    watch(
      () => activeFilters.value.objectives,
      (newValue) => {
        if (newValue && newValue.length > 0) {
          selectedObjectives.value = newValue;
        } else {
          selectedObjectives.value = [];
        }
      },
      { immediate: true },
    );

    const handleObjectiveChange = async (objectiveIds) => {
      selectedObjectives.value = objectiveIds;
      try {
        await filterStore.updateArrayFilter("objectives", objectiveIds, "all");
      } catch (error) {
        console.error("Failed to update objectives filter:", error);
      }
    };

    return {
      selectedObjectives,
      objectives,
      filteredObjectives,
      handleObjectiveChange,
      ALL_OBJECTIVES_FILTER,
    };
  },
};
</script>
