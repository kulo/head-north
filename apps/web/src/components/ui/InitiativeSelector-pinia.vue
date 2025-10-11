<template>
  <a-select
    v-model:value="selectedInitiatives"
    class="external-selector initiative-selector"
    mode="multiple"
    :placeholder="ALL_INITIATIVES_FILTER.name"
    @change="handleInitiativeChange"
  >
    <a-select-option key="all" value="all">
      {{ ALL_INITIATIVES_FILTER.name }}
    </a-select-option>
    <a-select-option
      v-for="initiative in filteredInitiatives"
      :key="initiative.id"
      :value="initiative.id"
    >
      {{ initiative.name }}
    </a-select-option>
  </a-select>
</template>

<script>
import { ref, computed, watch } from "vue";
import { useDataStore, useFilterStore } from "../../stores/registry";
import { ALL_INITIATIVES_FILTER } from "@/lib/utils/filter-constants";

export default {
  name: "InitiativeSelector",
  setup() {
    const dataStore = useDataStore();
    const filterStore = useFilterStore();

    const selectedInitiatives = ref([]);
    const initiatives = computed(() => {
      const data = dataStore.initiatives;
      return Array.isArray(data) ? data : [];
    });

    const activeFilters = computed(() => filterStore.activeFilters);

    // Filter out "All Initiatives" from the dropdown options
    const filteredInitiatives = computed(() => {
      return initiatives.value.filter((init) => init.id !== "all");
    });

    // Watch for changes in store and update local ref
    watch(
      () => activeFilters.value.initiatives,
      (newValue) => {
        if (newValue && newValue.length > 0) {
          selectedInitiatives.value = newValue;
        } else {
          selectedInitiatives.value = [];
        }
      },
      { immediate: true },
    );

    const handleInitiativeChange = async (initiativeIds) => {
      // If "all" is selected, clear all selections
      if (initiativeIds && initiativeIds.includes("all")) {
        selectedInitiatives.value = [];
        try {
          await filterStore.updateFilter("initiatives", []);
        } catch (error) {
          console.error("Failed to clear initiatives filter:", error);
        }
        return;
      }

      selectedInitiatives.value = initiativeIds;

      // If no initiatives selected, clear the store (equivalent to "All Initiatives" selection)
      if (!initiativeIds || initiativeIds.length === 0) {
        try {
          await filterStore.updateFilter("initiatives", []);
        } catch (error) {
          console.error("Failed to clear initiatives filter:", error);
        }
        return;
      }

      // Update store with new initiative IDs
      try {
        await filterStore.updateFilter("initiatives", initiativeIds);
      } catch (error) {
        console.error("Failed to update initiatives filter:", error);
      }
    };

    return {
      selectedInitiatives,
      initiatives,
      filteredInitiatives,
      handleInitiativeChange,
      ALL_INITIATIVES_FILTER,
    };
  },
};
</script>
