<template>
  <a-select
    v-model:value="selectedCycle"
    class="external-selector cycle-selector"
    placeholder="Select Cycle"
    @change="handleCycleChange"
  >
    <a-select-option v-for="cycle in cycles" :key="cycle.id" :value="cycle.id">
      {{ cycle.name }}
    </a-select-option>
  </a-select>
</template>

<script>
import { computed, watch, ref } from "vue";
import { logger } from "@headnorth/utils";
import { useDataStore, useFilterStore } from "../../stores";

export default {
  name: "CycleSelector",
  setup() {
    const dataStore = useDataStore();
    const filterStore = useFilterStore();

    const cycles = computed(() => {
      const data = dataStore.cycles;
      return Array.isArray(data) ? data : [];
    });

    const activeFilters = computed(() => filterStore.activeFilters);

    // Create a reactive ref for the selected cycle
    const selectedCycle = ref(null);

    // Watch for changes in activeFilters and update selectedCycle accordingly
    watch(
      () => activeFilters.value.cycle,
      (newCycleId) => {
        selectedCycle.value = newCycleId || null;
      },
      { immediate: true },
    );

    // Watch for cycles to be loaded and initialize default filters
    watch(
      () => cycles.value,
      async (newCycles) => {
        if (newCycles && newCycles.length > 0) {
          // initializeDefaultFilters handles errors internally
          await filterStore.initializeDefaultFilters(newCycles);
        }
      },
      { immediate: true },
    );

    const handleCycleChange = async (cycleId) => {
      const result = await filterStore.updateFilter("cycle", cycleId);
      result.caseOf({
        Left: (error) => {
          logger.service.errorSafe("Failed to update cycle filter", error, {
            cycleId,
          });
        },
        Right: () => {
          // Success - filter updated
        },
      });
    };

    return {
      selectedCycle,
      cycles,
      handleCycleChange,
    };
  },
};
</script>
