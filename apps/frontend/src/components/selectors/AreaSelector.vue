<template>
  <a-select
    v-model:value="selectedArea"
    class="external-selector area-selector"
    placeholder="All Areas"
    @change="handleAreaChange"
  >
    <a-select-option
      key="all"
      value="all"
    >
      All Areas
    </a-select-option>
    <a-select-option
      v-for="area in areas"
      :key="area.id"
      :value="area.id"
    >
      {{ area.name }}
    </a-select-option>
  </a-select>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'AreaSelector',
  setup() {
    const store = useStore()
    const selectedArea = computed({
      get: () => store.state.selectedArea || 'all',
      set: (value) => {
        // Dispatch action to filter by area
        store.dispatch('setSelectedArea', value === 'all' ? null : value)
      }
    })
    
    const areas = computed(() => store.state.areas)
    
    const handleAreaChange = (value) => {
      // The computed setter will handle the store update
      selectedArea.value = value
    }
    
    onMounted(() => {
      // Load areas if not already loaded
      if (areas.value.length === 0) {
        store.dispatch('fetchAreas')
      }
    })
    
    return {
      selectedArea,
      areas,
      handleAreaChange
    }
  }
}
</script>
