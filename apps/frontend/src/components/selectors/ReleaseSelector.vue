<template>
  <a-dropdown 
    class="external-selector"  
    @command="setSelectedReleaseFilter">
    <div class="project-filter">
      {{ selectedReleaseFilter.name }}
      <DownOutlined />
    </div>
    <template #overlay>
      <a-menu>
        <a-menu-item 
          v-for="releaseFilter in releaseFilters" 
          :key="releaseFilter.value" 
          :command="releaseFilter">
          {{ releaseFilter.name }}
          <i v-bind:class="releaseFilter.style"></i>
        </a-menu-item>      
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { DownOutlined } from '@ant-design/icons-vue'

export default {
  name: 'releaseSelector',
  components: {
    DownOutlined
  },
  setup() {
    const store = useStore()
    
    const selectedReleaseFilter = computed(() => store.state.selectedReleaseFilter)
    const releaseFilters = computed(() => store.state.releaseFilters)
    
    const setSelectedReleaseFilter = (filter) => {
      store.commit('setSelectedReleaseFilter', filter)
    }

    return {
      selectedReleaseFilter,
      releaseFilters,
      setSelectedReleaseFilter
    }
  }
};
</script>
