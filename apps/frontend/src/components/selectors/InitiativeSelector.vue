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
      v-for="initiative in initiatives"
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
    
    // Watch for changes in store and update local ref
    watch(() => store.state.selectedInitiatives, (newValue) => {
      if (newValue && newValue.length > 0 && newValue[0] !== undefined) {
        // Convert initiative objects to IDs for the select component
        const initiativeIds = newValue.map(init => init.id || init).filter(id => id !== undefined)
        selectedInitiatives.value = initiativeIds
      }
    }, { immediate: true })
    
    // Watch for initiatives to be loaded and set default selection
    watch(() => store.state.initiatives, (newInitiatives) => {
      if (newInitiatives && newInitiatives.length > 0 && (!store.state.selectedInitiatives || store.state.selectedInitiatives.length === 0)) {
        const defaultSelection = [newInitiatives[0]] // "All Initiatives"
        selectedInitiatives.value = [newInitiatives[0].id] // Use ID for select component
        store.dispatch('setSelectedInitiatives', defaultSelection)
      }
    }, { immediate: true })
    
    const setSelectedInitiatives = (initiativeIds) => {
      selectedInitiatives.value = initiativeIds
      
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
      setSelectedInitiatives
    }
  }
}
</script>
