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
import { selectDefaultCycle } from "../../lib/selectors/cycle-selector";

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
        if (newCycleId) {
          selectedCycle.value = newCycleId;
        } else {
          // If no cycle filter is set, use the best cycle
          const defaultCycle = selectDefaultCycle(cycles.value);
          selectedCycle.value = defaultCycle ? defaultCycle.id : null;
        }
      },
      { immediate: true },
    );

    // Watch for changes in cycles and update selectedCycle if no filter is set
    watch(
      () => cycles.value,
      (newCycles) => {
        if (newCycles && newCycles.length > 0 && !activeFilters.value.cycle) {
          const bestCycle = selectDefaultCycle(newCycles);
          selectedCycle.value = bestCycle ? bestCycle.id : null;
        }
      },
      { immediate: true },
    );

    // Watch for cycles to be loaded and set default selection if no filter exists
    watch(
      () => cycles.value,
      async (newCycles) => {
        if (newCycles && newCycles.length > 0 && !activeFilters.value.cycle) {
          // Select the best cycle using the same logic as data transformer
          const bestCycle = selectDefaultCycle(newCycles);
          if (bestCycle) {
            try {
              await filterStore.updateFilter("cycle", bestCycle.id);
            } catch (error) {
              console.error("Failed to set default cycle:", error);
            }
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
