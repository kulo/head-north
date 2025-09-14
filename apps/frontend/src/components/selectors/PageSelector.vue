<template>
  <a-dropdown class="external-selector page-selector" @command="changePage" style="margin-right: 10px">
    <a-button style="width: 200px; text-align: left;">{{ selectedPageName }}<DownOutlined /></a-button>
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
