/**
 * App Store - Core application state
 *
 * Manages basic application state like loading, errors, pages, and current page.
 */

import { defineStore } from "pinia";
import { ref, computed, inject } from "vue";
import type { Page } from "../types/ui-types";
import type { HeadNorthConfig } from "@headnorth/config";

export const useAppStore = defineStore("app", () => {
  // Inject services
  const config = inject<HeadNorthConfig>("config")!;

  // State
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pages = ref<Page[]>([]);
  const currentPage = ref<string>("");

  // Getters
  const isLoading = computed(() => loading.value);
  const hasError = computed(() => error.value !== null);

  /**
   * Error message - returns null if no error
   */
  const errorMessage = computed(() => error.value);

  /**
   * All pages
   */
  const allPages = computed(() => pages.value);

  /**
   * Current page ID
   */
  const currentPageId = computed(() => currentPage.value);

  // Actions - All state updates are immutable (Vue refs track changes)

  /**
   * Set loading state - immutable update
   */
  function setLoading(value: boolean) {
    loading.value = value; // Vue ref assignment - reactive update
  }

  /**
   * Set error message - immutable update
   */
  function setError(message: string | null) {
    error.value = message;
  }

  /**
   * Set pages - immutable update (creates new array)
   */
  function setPages(pagesList: Page[]) {
    pages.value = [...pagesList]; // Create new array for immutability
  }

  /**
   * Set current page - immutable update
   */
  function setCurrentPage(pageId: string) {
    currentPage.value = pageId;
  }

  /**
   * Initialize app - immutable updates
   */
  function initializeApp() {
    const frontendConfig = config.getFrontendConfig();
    pages.value = [...frontendConfig.getAllPages()]; // Create new array
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
