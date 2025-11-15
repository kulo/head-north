<template>
  <a-select
    v-model:value="selectedArea"
    class="external-selector area-selector"
    placeholder="All Product Areas"
    @change="handleAreaChange"
  >
    <a-select-option key="all" value="all"> All Product Areas </a-select-option>
    <a-select-option v-for="area in areas" :key="area.id" :value="area.id">
      {{ area.name }}
    </a-select-option>
  </a-select>
</template>

<script>
import { computed, onMounted } from "vue";
import { useDataStore, useFilterStore } from "../../stores";

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
          await filterStore.updateSingleFilter("area", value, "all");
        } catch (error) {
          console.error("Failed to update product area filter:", error);
        }
      },
    });

    const handleAreaChange = (value) => {
      selectedArea.value = value;
    };

    onMounted(() => {
      // Product areas will be loaded automatically when data is fetched
      // No need to manually trigger data fetching here
      console.log(
        "AreaSelector mounted, product areas available:",
        areas.value.length,
      );
    });

    return {
      selectedArea,
      areas,
      handleAreaChange,
    };
  },
};
</script>
