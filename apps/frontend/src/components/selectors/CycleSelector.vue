<template>
  <a-select
    v-model:value="selectedCycleId"
    class="external-selector cycle-selector"
    placeholder="Select Cycle"
    @change="handleCycleChange"
  >
    <a-select-option
      v-for="cycle in cycles"
      :key="cycle.id || cycle.name"
      :value="cycle.id || cycle.name"
    >
      {{ cycle.name }} - {{ cycle.state }}
    </a-select-option>
  </a-select>
</template>

<script>
import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'CycleSelector',
  setup() {
    const store = useStore()
    
    const selectedCycle = computed(() => store.state.selectedCycle)
    const cycles = computed(() => store.state.cycles)
    const selectedCycleId = ref(null)
    
    // Initialize with current selected cycle
    const initializeSelectedCycle = () => {
      if (selectedCycle.value) {
        selectedCycleId.value = selectedCycle.value.id || selectedCycle.value.name
      }
    }
    
    // Initialize on setup
    initializeSelectedCycle()
    
    // Watch for changes in store and update local ref
    watch(() => store.state.selectedCycle, (newValue) => {
      selectedCycleId.value = newValue?.id || newValue?.name || null
    }, { immediate: true })
    
    // Watch for cycles to be loaded and set default if no cycle is selected
    watch(() => store.state.cycles, (newCycles) => {
      if (newCycles && newCycles.length > 0 && !selectedCycle.value) {
        // If no cycle is selected but cycles are available, select the first one
        const firstCycle = newCycles[0]
        const firstCycleId = firstCycle.id || firstCycle.name
        selectedCycleId.value = firstCycleId
        store.dispatch('fetchCycle', firstCycle)
      }
    }, { immediate: true })
    
    const handleCycleChange = (cycleId) => {
      console.log('Cycle changed to ID:', cycleId) // Debug log
      selectedCycleId.value = cycleId
      
      // Find the cycle object by ID
      const cycle = cycles.value.find(c => (c.id || c.name) === cycleId)
      if (cycle) {
        store.dispatch('fetchCycle', cycle)
      }
    }

    return {
      selectedCycle,
      cycles,
      selectedCycleId,
      handleCycleChange
    }
  }
}
</script>
