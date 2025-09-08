<template>
  <a-dropdown class="page-selector" @command="changePage">
    <a-button>{{ selectedPageName }}<DownOutlined /></a-button>
    <template #overlay>
      <a-menu @click="handleMenuClick">
        <a-menu-item v-for="page in allPages" :key="page.id" :command="page.id">
          {{ page.name }}
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import { DownOutlined } from '@ant-design/icons-vue'

export default {
  name: 'PageSelector',
  components: {
    DownOutlined
  },
  computed: {
    ...mapState(['pages']),
    ...mapGetters(['selectedPageName']),
    allPages() {
      return this.pages.all
    }
  },
  methods: {
    ...mapActions(['changePage']),
    handleMenuClick({ key }) {
      this.changePage(key)
    }
  }
}
</script>

<style scoped>
.page-selector {
  display: inline-block;
  margin-left: 10px;
}
</style>