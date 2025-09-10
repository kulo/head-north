<template>
  <a-select
    v-model:value="selectedReleaseFilters"
    class="external-selector release-selector"
    mode="multiple"
    size="small"
    placeholder="All Releases"
    style="width: 150px; margin-right: 10px"
    @change="setSelectedReleaseFilters"
  >
    <a-select-option
      v-for="releaseFilter in releaseFilters"
      :key="releaseFilter.value"
      :value="releaseFilter"
    >
      {{ releaseFilter.name }}
      <i v-if="releaseFilter.style" v-bind:class="releaseFilter.style"></i>
    </a-select-option>
  </a-select>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'ReleaseSelector',
  setup() {
    const store = useStore()
    
    const selectedReleaseFilters = ref(store.state.selectedReleaseFilters || [])
    const releaseFilters = computed(() => store.state.releaseFilters)
    
    // Watch for changes in store and update local ref
    watch(() => store.state.selectedReleaseFilters, (newValue) => {
      selectedReleaseFilters.value = newValue || []
    }, { immediate: true })
    
    const setSelectedReleaseFilters = (filters) => {
      selectedReleaseFilters.value = filters
      store.dispatch('setSelectedReleaseFilters', filters)
    }

    return {
      selectedReleaseFilters,
      releaseFilters,
      setSelectedReleaseFilters
    }
  }
}
</script>
