<template>
  <div class="page-selector-container">
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

    <!-- Debug info in development -->
    <div v-if="isDev" class="debug-info">
      <small>Store: {{ usePinia ? "Pinia" : "Vuex" }}</small>
      <button class="switch-btn" @click="switchStore">Switch Store</button>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch } from "vue";
import { useStore } from "vuex";
import { useAppStore } from "../../stores/app";
import { useFilterStore } from "../../stores/filters";

export default {
  name: "PageSelector",
  setup() {
    const vuexStore = useStore();
    const appStore = useAppStore();
    const filterStore = useFilterStore();

    // Toggle between stores for testing
    const usePinia = ref(false);
    const isDev = import.meta.env.DEV;

    const pages = computed(() => {
      return usePinia.value ? appStore.allPages : vuexStore.getters.pages;
    });

    const currentPage = computed(() => {
      return usePinia.value
        ? appStore.currentPageId
        : vuexStore.getters.currentPage;
    });

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

      if (usePinia.value) {
        try {
          await filterStore.switchView(pageId, appStore);
        } catch (error) {
          console.error("Failed to switch view (Pinia):", error);
        }
      } else {
        vuexStore.dispatch("switchView", pageId);
      }
    };

    const switchStore = () => {
      usePinia.value = !usePinia.value;
      console.log(
        `PageSelector switched to ${usePinia.value ? "Pinia" : "Vuex"} store`,
      );
    };

    return {
      pages,
      currentPage,
      selectedPageValue,
      allPages,
      handlePageChange,
      usePinia,
      isDev,
      switchStore,
    };
  },
};
</script>

<style scoped>
.page-selector-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.debug-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  color: #666;
}

.switch-btn {
  padding: 2px 6px;
  font-size: 10px;
  border: 1px solid #ccc;
  border-radius: 3px;
  background: white;
  cursor: pointer;
}

.switch-btn:hover {
  background: #f0f0f0;
}
</style>
