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
import { useStore } from "vuex";

export default {
  name: "UnifiedCycleSelector",
  setup() {
    const store = useStore();

    const cycles = computed(() => {
      const data = store.getters.cycles;
      return Array.isArray(data) ? data : [];
    });
    const activeFilters = computed(() => store.getters.activeFilters);

    const selectedCycle = computed({
      get: () => activeFilters.value.cycle || "all",
      set: (value) => {
        store.dispatch("updateFilter", { key: "cycle", value: value });
      },
    });

    // Watch for cycles to be loaded and set default selection
    watch(
      () => cycles.value,
      (newCycles) => {
        if (newCycles && newCycles.length > 0 && !activeFilters.value.cycle) {
          // Select the first cycle by default
          const firstCycle = newCycles[0];
          if (firstCycle) {
            store.dispatch("updateFilter", {
              key: "cycle",
              value: firstCycle.id,
            });
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
