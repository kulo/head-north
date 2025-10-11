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
import { computed, watch } from "vue";
import { useDataStore, useFilterStore } from "../../stores/registry";

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

    const selectedCycle = computed({
      get: () => activeFilters.value.cycle || "all",
      set: async (value) => {
        try {
          await filterStore.updateFilter("cycle", value);
        } catch (error) {
          console.error("Failed to update cycle filter:", error);
        }
      },
    });

    // Watch for cycles to be loaded and set default selection
    watch(
      () => cycles.value,
      async (newCycles) => {
        if (newCycles && newCycles.length > 0 && !activeFilters.value.cycle) {
          // Select the first cycle by default
          const firstCycle = newCycles[0];
          if (firstCycle) {
            try {
              await filterStore.updateFilter("cycle", firstCycle.id);
            } catch (error) {
              console.error("Failed to set default cycle:", error);
            }
          }
        }
      },
      { immediate: true },
    );

    const handleCycleChange = (cycleId) => {
      selectedCycle.value = cycleId;
    };

    return {
      selectedCycle,
      cycles,
      handleCycleChange,
    };
  },
};
</script>
