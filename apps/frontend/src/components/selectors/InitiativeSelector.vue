<template>
  <a-select
    v-model:value="selectedInitiatives"
    class="external-selector initiative-selector"
    mode="multiple"
    size="small"
    placeholder="All Initiatives"
    style="width: 150px; margin-right: 10px"
    @change="setSelectedInitiatives"
  >
    <a-select-option
      v-for="initiative in initiatives"
      :key="initiative?.id || initiative"
      :value="initiative"
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
    
    const selectedInitiatives = ref(store.state.selectedInitiatives || [])
    const initiatives = computed(() => store.state.initiatives || [])
    
    // Watch for changes in store and update local ref
    watch(() => store.state.selectedInitiatives, (newValue) => {
      selectedInitiatives.value = newValue || []
    }, { immediate: true })
    
    const setSelectedInitiatives = (initiatives) => {
      selectedInitiatives.value = initiatives
      store.dispatch('setSelectedInitiatives', initiatives)
    }
    
    return {
      selectedInitiatives,
      initiatives,
      setSelectedInitiatives
    }
  }
}
</script>
