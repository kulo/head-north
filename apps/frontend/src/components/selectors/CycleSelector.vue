<template>
  <a-dropdown v-if="selectedCycle" class="external-selector" @command="fetchCycle">
    <div class="project-filter">{{ selectedCycle.name }}<DownOutlined /></div>
    <template #overlay>
      <a-menu>
        <a-menu-item v-for="cycle in cycles" :key="cycle.name" :command="cycle">{{ cycle.name }} - {{ cycle.state }}</a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { DownOutlined } from '@ant-design/icons-vue'

export default {
  name: 'CycleSelector',
  components: {
    DownOutlined
  },
  setup() {
    const store = useStore()
    
    const selectedCycle = computed(() => store.state.selectedCycle)
    const cycles = computed(() => store.state.cycles)
    
    const fetchCycle = (cycle) => {
      store.dispatch('fetchCycle', cycle)
    }

    return {
      selectedCycle,
      cycles,
      fetchCycle
    }
  }
}
</script>
