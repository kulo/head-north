<template>
  <a-select
    v-model:value="selectedStages"
    class="external-selector stage-selector"
    mode="multiple"
    size="small"
    placeholder="All Stages"
    style="width: 150px; margin-right: 10px"
    @change="setSelectedStages"
  >
    <a-select-option
      v-for="stage in stages"
      :key="stage.id || stage.name"
      :value="stage"
    >
      {{ stage.name }}
    </a-select-option>
  </a-select>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'StageSelector',
  setup() {
    const store = useStore()
    
    const selectedStages = ref(store.state.selectedStages || [])
    const stages = computed(() => store.state.stages)
    
    // Watch for changes in store and update local ref
    watch(() => store.state.selectedStages, (newValue) => {
      selectedStages.value = newValue || []
    }, { immediate: true })
    
    const setSelectedStages = (stages) => {
      selectedStages.value = stages
      store.dispatch('setSelectedStages', stages)
    }

    return {
      selectedStages,
      stages,
      setSelectedStages
    }
  }
}
</script>
