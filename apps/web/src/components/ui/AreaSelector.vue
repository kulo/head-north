<template>
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
</template>

<script>
import { computed, onMounted } from "vue";
import { useDataStore, useFilterStore } from "../../stores/registry";

export default {
  name: "AreaSelector",
  setup() {
    const dataStore = useDataStore();
    const filterStore = useFilterStore();

    const areas = computed(() => {
      const data = dataStore.areas;
      return Array.isArray(data) ? data : [];
    });

    const activeFilters = computed(() => filterStore.activeFilters);

    const selectedArea = computed({
      get: () => activeFilters.value.area || "all",
      set: async (value) => {
        try {
          // If "all" is selected, remove the area filter (set to undefined)
          await filterStore.updateFilter(
            "area",
            value === "all" ? undefined : value,
          );
        } catch (error) {
          console.error("Failed to update area filter:", error);
        }
      },
    });

    const handleAreaChange = (value) => {
      selectedArea.value = value;
    };

    onMounted(() => {
      // Areas will be loaded automatically when data is fetched
      // No need to manually trigger data fetching here
      console.log("AreaSelector mounted, areas available:", areas.value.length);
    });

    return {
      selectedArea,
      areas,
      handleAreaChange,
    };
  },
};
</script>
