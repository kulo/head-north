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
import { useAppStore, useFilterStore } from "../../stores";

export default {
  name: "PageSelector",
  setup() {
    const appStore = useAppStore();
    const filterStore = useFilterStore();

    const pages = computed(() => appStore.allPages);
    const currentPage = computed(() => appStore.currentPageId);
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

    const handlePageChange = async (pageId) => {
      selectedPageValue.value = pageId;
      try {
        await filterStore.switchView(pageId);
      } catch (error) {
        console.error("Failed to switch view:", error);
      }
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
