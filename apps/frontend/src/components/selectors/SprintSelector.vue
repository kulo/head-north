<template>
  <a-dropdown v-if="selectedSprint" class="external-selector" @command="fetchSprint">
    <div class="project-filter">{{ selectedSprint.name }}<DownOutlined /></div>
    <template #overlay>
      <a-menu>
        <a-menu-item v-for="sprint in sprints" :key="sprint.name" :command="sprint">{{ sprint.name }} - {{ sprint.state }}</a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { DownOutlined } from '@ant-design/icons-vue'

export default {
  name: 'sprintSelector',
  components: {
    DownOutlined
  },
  setup() {
    const store = useStore()
    
    const selectedSprint = computed(() => store.state.selectedSprint)
    const sprints = computed(() => store.state.sprints)
    
    const fetchSprint = (sprint) => {
      store.dispatch('fetchSprint', sprint)
    }

    return {
      selectedSprint,
      sprints,
      fetchSprint
    }
  }
};
</script>
