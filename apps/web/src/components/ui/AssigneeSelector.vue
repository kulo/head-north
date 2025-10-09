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
import { useStore } from "vuex";
import { ALL_ASSIGNEES_FILTER } from "@/filters/filter-constants";

export default {
  name: "AssigneeSelector",
  setup() {
    const store = useStore();

    const selectedAssignees = ref([]);
    const assignees = computed(() => store.getters.assignees || []);
    const activeFilters = computed(() => store.getters.activeFilters);

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

    const handleAssigneeChange = (assigneeIds) => {
      // If "all" is selected, clear all selections
      if (assigneeIds && assigneeIds.includes(ALL_ASSIGNEES_FILTER.id)) {
        selectedAssignees.value = [];
        store.dispatch("updateFilter", { key: "assignees", value: [] });
        return;
      }

      selectedAssignees.value = assigneeIds;

      // If no assignees selected, clear the store (equivalent to "All Assignees" selection)
      if (!assigneeIds || assigneeIds.length === 0) {
        store.dispatch("updateFilter", { key: "assignees", value: [] });
        return;
      }

      // Update store with new assignee IDs
      store.dispatch("updateFilter", { key: "assignees", value: assigneeIds });
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
