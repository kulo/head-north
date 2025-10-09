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
import { useStore } from "vuex";

export default {
  name: "UnifiedAreaSelector",
  setup() {
    const store = useStore();

    const areas = computed(() => {
      const data = store.getters.areas;
      return Array.isArray(data) ? data : [];
    });
    const activeFilters = computed(() => store.getters.activeFilters);

    const selectedArea = computed({
      get: () => activeFilters.value.area || "all",
      set: (value) => {
        // If "all" is selected, remove the area filter (set to undefined)
        store.dispatch("updateFilter", {
          key: "area",
          value: value === "all" ? undefined : value,
        });
      },
    });

    const handleAreaChange = (value) => {
      selectedArea.value = value;
    };

    onMounted(() => {
      // Load areas if not already loaded
      if (areas.value.length === 0) {
        store.dispatch("fetchAndProcessData");
      }
    });

    return {
      selectedArea,
      areas,
      handleAreaChange,
    };
  },
};
</script>
