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
          try {
            await filterStore.initializeDefaultFilters(newCycles);
          } catch (error) {
            console.error("Failed to initialize default cycle filter:", error);
          }
        }
      },
      { immediate: true },
    );

    const handleCycleChange = async (cycleId) => {
      try {
        await filterStore.updateFilter("cycle", cycleId);
      } catch (error) {
        console.error("Failed to update cycle filter:", error);
      }
    };

    return {
      selectedCycle,
      cycles,
      handleCycleChange,
    };
  },
};
</script>
