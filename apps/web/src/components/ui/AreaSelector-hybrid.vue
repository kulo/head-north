<template>
  <div class="area-selector-container">
    <a-select
      v-model:value="selectedArea"
      class="external-selector area-selector"
      placeholder="All Areas"
      @change="handleAreaChange"
    >
      <a-select-option key="all" value="all"> All Areas </a-select-option>
      <a-select-option v-for="area in areas" :key="area.id" :value="area.id">
        {{ area.name }}
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
import { computed, onMounted, ref } from "vue";
import { useStore } from "vuex";
import { useDataStore } from "../../stores/data";
import { useFilterStore } from "../../stores/filters";

export default {
  name: "AreaSelector",
  setup() {
    const vuexStore = useStore();
    const dataStore = useDataStore();
    const filterStore = useFilterStore();

    // Toggle between stores for testing
    const usePinia = ref(false);
    const isDev = import.meta.env.DEV;

    const areas = computed(() => {
      const data = usePinia.value ? dataStore.areas : vuexStore.getters.areas;
      return Array.isArray(data) ? data : [];
    });

    const activeFilters = computed(() => {
      return usePinia.value
        ? filterStore.activeFilters
        : vuexStore.getters.activeFilters;
    });

    const selectedArea = computed({
      get: () => activeFilters.value.area || "all",
      set: async (value) => {
        if (usePinia.value) {
          try {
            await filterStore.updateFilter(
              "area",
              value === "all" ? undefined : value,
            );
          } catch (error) {
            console.error("Failed to update area filter (Pinia):", error);
          }
        } else {
          vuexStore.dispatch("updateFilter", {
            key: "area",
            value: value === "all" ? undefined : value,
          });
        }
      },
    });

    const handleAreaChange = (value) => {
      selectedArea.value = value;
    };

    const switchStore = () => {
      usePinia.value = !usePinia.value;
      console.log(
        `AreaSelector switched to ${usePinia.value ? "Pinia" : "Vuex"} store`,
      );
    };

    onMounted(() => {
      // Load areas if not already loaded
      if (areas.value.length === 0) {
        if (usePinia.value) {
          console.warn(
            "AreaSelector: Data fetching not yet implemented in Pinia stores",
          );
        } else {
          vuexStore.dispatch("fetchAndProcessData");
        }
      }
    });

    return {
      selectedArea,
      areas,
      handleAreaChange,
      usePinia,
      isDev,
      switchStore,
    };
  },
};
</script>

<style scoped>
.area-selector-container {
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
