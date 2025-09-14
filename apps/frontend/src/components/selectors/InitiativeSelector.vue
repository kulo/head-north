<template>
  <a-select
    v-model:value="selectedInitiatives"
    class="external-selector initiative-selector"
    mode="multiple"
    size="small"
    placeholder="All Initiatives"
    style="width: 200px; margin-right: 10px"
    @change="setSelectedInitiatives"
  >
    <a-select-option
      key="all"
      value="all"
      style="font-weight: bold; color: var(--color-info);"
    >
      All Initiatives
    </a-select-option>
    <a-select-option
      v-for="initiative in filteredInitiatives"
      :key="initiative?.id || initiative"
      :value="initiative.id"
    >
      {{ initiative?.name || initiative }}
    </a-select-option>
  </a-select>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'InitiativeSelector',
  setup() {
    const store = useStore()
    
    const selectedInitiatives = ref([])
    const initiatives = computed(() => store.state.initiatives || [])
    
    // Filter out "All Initiatives" from the dropdown options
    const filteredInitiatives = computed(() => {
      return initiatives.value.filter(init => init.id !== 'all')
    })
    
    // Watch for changes in store and update local ref
    watch(() => store.state.selectedInitiatives, (newValue) => {
      if (newValue && newValue.length > 0 && newValue[0] !== undefined) {
        // Convert initiative objects to IDs for the select component, excluding 'all'
        const initiativeIds = newValue
          .map(init => init.id || init)
          .filter(id => id !== undefined && id !== 'all')
        selectedInitiatives.value = initiativeIds
      } else {
        selectedInitiatives.value = []
      }
    }, { immediate: true })
    
    // Watch for initiatives to be loaded and set default selection
    watch(() => store.state.initiatives, (newInitiatives) => {
      if (newInitiatives && newInitiatives.length > 0 && (!store.state.selectedInitiatives || store.state.selectedInitiatives.length === 0)) {
        // Don't set any default selection - let it show "All Initiatives" placeholder
        selectedInitiatives.value = []
      }
    }, { immediate: true })
    
    const setSelectedInitiatives = (initiativeIds) => {
      // If "all" is selected, clear all selections
      if (initiativeIds && initiativeIds.includes('all')) {
        selectedInitiatives.value = []
        store.dispatch('setSelectedInitiatives', [])
        return
      }
      
      selectedInitiatives.value = initiativeIds
      
      // If no initiatives selected, clear the store (equivalent to "All Initiatives")
      if (!initiativeIds || initiativeIds.length === 0) {
        store.dispatch('setSelectedInitiatives', [])
        return
      }
      
      // Convert IDs back to initiative objects for the store
      const initiativeObjects = initiativeIds.map(id => {
        const initiative = initiatives.value.find(init => init.id === id)
        return initiative || { id, name: 'Unknown Initiative' }
      })
      
      store.dispatch('setSelectedInitiatives', initiativeObjects)
    }
    
    return {
      selectedInitiatives,
      initiatives,
      filteredInitiatives,
      setSelectedInitiatives
    }
  }
}
</script>
