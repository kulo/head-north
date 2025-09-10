<template>
  <div class="initiative-selector">
    <a-select
      v-model:value="selectedInitiative"
      placeholder="Select Initiative"
      style="width: 200px; margin-right: 10px"
      @change="handleInitiativeChange"
    >
      <a-select-option
        v-for="initiative in initiatives"
        :key="initiative?.id || initiative"
        :value="initiative?.name || initiative"
      >
        {{ initiative?.name || initiative }}
      </a-select-option>
    </a-select>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'InitiativeSelector',
  setup() {
    const store = useStore()
    const selectedInitiative = ref(null)
    
    const initiatives = computed(() => store.state.initiatives || [])
    
    const handleInitiativeChange = (value) => {
      selectedInitiative.value = value
      // Dispatch action to filter by initiative
      store.dispatch('setSelectedInitiative', value)
    }
    
    onMounted(() => {
      // Load initiatives if not already loaded
      if (initiatives.value.length === 0) {
        store.dispatch('fetchInitiatives')
      }
    })
    
    return {
      selectedInitiative,
      initiatives,
      handleInitiativeChange
    }
  }
}
</script>
