<template>
  <a-select
    v-model:value="selectedAssignees"
    class="external-selector assignee-selector"
    mode="multiple"
    :placeholder="ALL_ASSIGNEES_FILTER.name"
    @change="handleAssigneeChange"
  >
    <a-select-option
      :key="ALL_ASSIGNEES_FILTER.id"
      :value="ALL_ASSIGNEES_FILTER.id"
    >
      {{ ALL_ASSIGNEES_FILTER.name }}
    </a-select-option>
    <a-select-option
      v-for="assignee in assignees"
      :key="assignee.id"
      :value="assignee.id"
    >
      {{ assignee.name }}
    </a-select-option>
  </a-select>
</template>

<script>
import { ref, computed, watch } from "vue";
import { useDataStore, useFilterStore } from "../../stores/registry";
import { ALL_ASSIGNEES_FILTER } from "@/lib/utils/filter-constants";

export default {
  name: "AssigneeSelector",
  setup() {
    const dataStore = useDataStore();
    const filterStore = useFilterStore();

    const selectedAssignees = ref([]);
    const assignees = computed(() => dataStore.assignees || []);
    const activeFilters = computed(() => filterStore.activeFilters);

    // Watch for changes in store and update local ref
    watch(
      () => activeFilters.value.assignees,
      (newValue) => {
        if (newValue && newValue.length > 0) {
          selectedAssignees.value = newValue;
        } else {
          selectedAssignees.value = [];
        }
      },
      { immediate: true },
    );

    const handleAssigneeChange = async (assigneeIds) => {
      // If "all" is selected, clear all selections
      if (assigneeIds && assigneeIds.includes(ALL_ASSIGNEES_FILTER.id)) {
        selectedAssignees.value = [];
        try {
          await filterStore.updateFilter("assignees", []);
        } catch (error) {
          console.error("Failed to clear assignees filter:", error);
        }
        return;
      }

      selectedAssignees.value = assigneeIds;

      // If no assignees selected, clear the store (equivalent to "All Assignees" selection)
      if (!assigneeIds || assigneeIds.length === 0) {
        try {
          await filterStore.updateFilter("assignees", []);
        } catch (error) {
          console.error("Failed to clear assignees filter:", error);
        }
        return;
      }

      // Update store with new assignee IDs
      try {
        await filterStore.updateFilter("assignees", assigneeIds);
      } catch (error) {
        console.error("Failed to update assignees filter:", error);
      }
    };

    return {
      selectedAssignees,
      assignees,
      handleAssigneeChange,
      ALL_ASSIGNEES_FILTER,
    };
  },
};
</script>
