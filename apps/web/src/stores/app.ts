/**
 * App Store - Core application state
 *
 * Manages basic application state like loading, errors, pages, and current page.
 * This is the simplest store to migrate first.
 *
 * Uses factory function pattern for immutable service injection.
 */

import { defineStore, type StoreDefinition } from "pinia";
import { ref, computed } from "vue";
import type { Page } from "../types/ui-types";
import type { OmegaConfig } from "@omega/config";

export function createAppStore(omegaConfig: OmegaConfig) {
  return defineStore("app", () => {
    // ✅ Services are immutable constants
    const config = omegaConfig;

    // State
    const loading = ref(false);
    const error = ref<string | null>(null);
    const pages = ref<Page[]>([]);
    const currentPage = ref<string>("");

    // Getters
    const isLoading = computed(() => loading.value);
    const hasError = computed(() => error.value !== null);
    const errorMessage = computed(() => error.value);
    const allPages = computed(() => pages.value);
    const currentPageId = computed(() => currentPage.value);

    // Actions
    function setLoading(value: boolean) {
      loading.value = value;
    }

    function setError(message: string | null) {
      error.value = message;
    }

    function setPages(pagesList: Page[]) {
      pages.value = pagesList;
    }

    function setCurrentPage(pageId: string) {
      currentPage.value = pageId;
    }

    function initializeApp() {
      const frontendConfig = config.getFrontendConfig();
      pages.value = frontendConfig.getAllPages();
      currentPage.value = frontendConfig.pages.ROOT.id;
    }

    function clearError() {
      error.value = null;
    }

    return {
      // State
      loading,
      error,
      pages,
      currentPage,

      // Getters
      isLoading,
      hasError,
      errorMessage,
      allPages,
      currentPageId,

      // Actions
      setLoading,
      setError,
      setPages,
      setCurrentPage,
      initializeApp,
      clearError,
    };
  });
}
