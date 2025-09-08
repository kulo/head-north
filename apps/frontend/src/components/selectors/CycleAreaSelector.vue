<!-- TODO: Restore or remove CycleAreaSelector functionality later -->
<!-- This component was commented out due to undefined pages.current.name error -->
<!-- 
<template>
  <a-dropdown class="external-selector" @command="changePage">
    <div class="project-filter">{{ pages.current.name }}<DownOutlined /></div>
    <template #overlay>
      <a-menu>
        <a-menu-item v-for="page in pages.all" :key="page.id" :command="page.id">{{ page.name }}</a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { DownOutlined } from '@ant-design/icons-vue'

export default {
  name: 'cycleAreaSelector',
  components: {
    DownOutlined
  },
  setup() {
    const store = useStore()
    
    const pages = computed(() => store.state.pages)
    
    const changePage = (pageId) => {
      store.dispatch('changePage', pageId)
    }

    return {
      pages,
      changePage
    }
  }
};
</script>
-->

<template>
  <!-- CycleAreaSelector temporarily disabled -->
  <div class="cycle-area-selector-disabled">
    <!-- TODO: Restore or remove this component -->
  </div>
</template>

<script>
export default {
  name: 'cycleAreaSelector'
}
</script>
