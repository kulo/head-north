<template>
  <a-select
    v-model:value="selectedPageValue"
    class="external-selector page-selector"
    placeholder="Select Page"
    @change="handlePageChange"
  >
    <a-select-option v-for="page in allPages" :key="page.id" :value="page.id">
      {{ page.name }}
    </a-select-option>
  </a-select>
</template>

<script>
import { computed, ref, watch } from "vue";
import { useStore } from "vuex";

export default {
  name: "PageSelector",
  setup() {
    const store = useStore();

    const pages = computed(() => store.getters.pages);
    const currentPage = computed(() => store.getters.currentPage);
    const selectedPageValue = ref(null);

    const allPages = computed(() => pages.value || []);

    // Watch for changes in store and update local ref
    watch(
      () => currentPage.value,
      (newPage) => {
        if (newPage) {
          selectedPageValue.value = newPage;
        }
      },
      { immediate: true },
    );

    const handlePageChange = (pageId) => {
      selectedPageValue.value = pageId;
      store.dispatch("switchView", pageId);
    };

    return {
      pages,
      currentPage,
      selectedPageValue,
      allPages,
      handlePageChange,
    };
  },
};
</script>
