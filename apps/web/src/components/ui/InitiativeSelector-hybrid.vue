<template>
  <div class="initiative-selector-container">
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

    <!-- Debug info in development -->
    <div v-if="isDev" class="debug-info">
      <small>Store: {{ usePinia ? "Pinia" : "Vuex" }}</small>
      <button class="switch-btn" @click="switchStore">Switch Store</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";
import { useDataStore } from "../../stores/data";
import { useFilterStore } from "../../stores/filters";
import { ALL_INITIATIVES_FILTER } from "@/lib/utils/filter-constants";

export default {
  name: "InitiativeSelector",
  setup() {
    const vuexStore = useStore();
    const dataStore = useDataStore();
    const filterStore = useFilterStore();

    // Toggle between stores for testing
    const usePinia = ref(false);
    const isDev = import.meta.env.DEV;

    const selectedInitiatives = ref([]);
    const initiatives = computed(() => {
      const data = usePinia.value
        ? dataStore.initiatives
        : vuexStore.getters.initiatives;
      return Array.isArray(data) ? data : [];
    });

    const activeFilters = computed(() => {
      return usePinia.value
        ? filterStore.activeFilters
        : vuexStore.getters.activeFilters;
    });

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
        if (usePinia.value) {
          try {
            await filterStore.updateFilter("initiatives", []);
          } catch (error) {
            console.error("Failed to clear initiatives filter (Pinia):", error);
          }
        } else {
          vuexStore.dispatch("updateFilter", { key: "initiatives", value: [] });
        }
        return;
      }

      selectedInitiatives.value = initiativeIds;

      // If no initiatives selected, clear the store (equivalent to "All Initiatives" selection)
      if (!initiativeIds || initiativeIds.length === 0) {
        if (usePinia.value) {
          try {
            await filterStore.updateFilter("initiatives", []);
          } catch (error) {
            console.error("Failed to clear initiatives filter (Pinia):", error);
          }
        } else {
          vuexStore.dispatch("updateFilter", { key: "initiatives", value: [] });
        }
        return;
      }

      // Update store with new initiative IDs
      if (usePinia.value) {
        try {
          await filterStore.updateFilter("initiatives", initiativeIds);
        } catch (error) {
          console.error("Failed to update initiatives filter (Pinia):", error);
        }
      } else {
        vuexStore.dispatch("updateFilter", {
          key: "initiatives",
          value: initiativeIds,
        });
      }
    };

    const switchStore = () => {
      usePinia.value = !usePinia.value;
      console.log(
        `InitiativeSelector switched to ${usePinia.value ? "Pinia" : "Vuex"} store`,
      );
    };

    return {
      selectedInitiatives,
      initiatives,
      filteredInitiatives,
      handleInitiativeChange,
      ALL_INITIATIVES_FILTER,
      usePinia,
      isDev,
      switchStore,
    };
  },
};
</script>

<style scoped>
.initiative-selector-container {
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
