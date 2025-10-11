<template>
  <div class="cycle-selector-container">
    <a-select
      v-model:value="selectedCycle"
      class="external-selector cycle-selector"
      placeholder="Select Cycle"
      @change="handleCycleChange"
    >
      <a-select-option
        v-for="cycle in cycles"
        :key="cycle.id"
        :value="cycle.id"
      >
        {{ cycle.name }}
      </a-select-option>
    </a-select>

    <!-- Debug info in development -->
    <div v-if="isDev" class="debug-info">
      <small>Store: {{ usePinia ? "Pinia" : "Vuex" }}</small>
      <button class="switch-btn" @click="switchStore">Switch Store</button>
    </div>
  </div>
</template>

<script>
import { computed, watch, ref } from "vue";
import { useStore } from "vuex";
import { useDataStore } from "../../stores/data";
import { useFilterStore } from "../../stores/filters";

export default {
  name: "CycleSelector",
  setup() {
    const vuexStore = useStore();
    const dataStore = useDataStore();
    const filterStore = useFilterStore();

    // Toggle between stores for testing
    const usePinia = ref(false);
    const isDev = import.meta.env.DEV;

    const cycles = computed(() => {
      const data = usePinia.value ? dataStore.cycles : vuexStore.getters.cycles;
      return Array.isArray(data) ? data : [];
    });

    const activeFilters = computed(() => {
      return usePinia.value
        ? filterStore.activeFilters
        : vuexStore.getters.activeFilters;
    });

    const selectedCycle = computed({
      get: () => activeFilters.value.cycle || "all",
      set: async (value) => {
        if (usePinia.value) {
          try {
            await filterStore.updateFilter("cycle", value);
          } catch (error) {
            console.error("Failed to update cycle filter (Pinia):", error);
          }
        } else {
          vuexStore.dispatch("updateFilter", { key: "cycle", value: value });
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
            if (usePinia.value) {
              try {
                await filterStore.updateFilter("cycle", firstCycle.id);
              } catch (error) {
                console.error("Failed to set default cycle (Pinia):", error);
              }
            } else {
              vuexStore.dispatch("updateFilter", {
                key: "cycle",
                value: firstCycle.id,
              });
            }
          }
        }
      },
      { immediate: true },
    );

    const handleCycleChange = (cycleId) => {
      selectedCycle.value = cycleId;
    };

    const switchStore = () => {
      usePinia.value = !usePinia.value;
      console.log(
        `CycleSelector switched to ${usePinia.value ? "Pinia" : "Vuex"} store`,
      );
    };

    return {
      selectedCycle,
      cycles,
      handleCycleChange,
      usePinia,
      isDev,
      switchStore,
    };
  },
};
</script>

<style scoped>
.cycle-selector-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.debug-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  color: #666;
}

.switch-btn {
  padding: 2px 6px;
  font-size: 10px;
  border: 1px solid #ccc;
  border-radius: 3px;
  background: white;
  cursor: pointer;
}

.switch-btn:hover {
  background: #f0f0f0;
}
</style>
