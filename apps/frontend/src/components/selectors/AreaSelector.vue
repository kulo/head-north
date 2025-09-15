<template>
  <a-select
    v-model:value="selectedArea"
    class="external-selector area-selector"
    placeholder="All Areas"
    style="width: 160px; margin-right: 10px"
    @change="handleAreaChange"
  >
    <a-select-option
      key="all"
      value="all"
      style="font-weight: bold; color: var(--color-info);"
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
    const selectedArea = ref('all')
    
    const areas = computed(() => store.state.areas)
    
    const handleAreaChange = (value) => {
      selectedArea.value = value
      // Dispatch action to filter by area
      store.dispatch('setSelectedArea', value === 'all' ? null : value)
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
