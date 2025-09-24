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

    const pages = computed(() => store.state.pages);
    const selectedPageName = computed(() => store.getters.selectedPageName);
    const selectedPageValue = ref(null);

    const allPages = computed(() => pages.value.all);

    // Watch for changes in store and update local ref
    watch(
      () => store.state.pages,
      (newPages) => {
        if (newPages && newPages.current) {
          selectedPageValue.value = newPages.current.id;
        }
      },
      { immediate: true },
    );

    const handlePageChange = (pageId) => {
      selectedPageValue.value = pageId;
      store.dispatch("changePage", pageId);
    };

    return {
      pages,
      selectedPageName,
      selectedPageValue,
      allPages,
      handlePageChange,
    };
  },
};
</script>
