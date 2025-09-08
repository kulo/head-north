<template>
  <a-select
    v-if="selectedStages"
    class="external-selector stage-selector"
    :value="selectedStages"
    mode="multiple"
    size="small"
    placeholder="All Stages"
    @change="setSelectedStages">
    <a-select-option
      v-for="stage in stages"
      :key="stage.name"
      :value="stage">
      {{ stage.name }}
    </a-select-option>
  </a-select>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'stageSelector',
  setup() {
    const store = useStore()
    
    const selectedStages = computed(() => store.state.selectedStages)
    const stages = computed(() => store.state.stages)
    
    const setSelectedStages = (stages) => {
      store.commit('setSelectedStages', stages)
    }

    return {
      selectedStages,
      stages,
      setSelectedStages
    }
  }
};
</script>
