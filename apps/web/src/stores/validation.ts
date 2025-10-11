/**
 * Validation Store - Validation state management
 *
 * Manages validation-related state and operations.
 * This is the simplest store and can be migrated first.
 *
 * Uses factory function pattern for immutable service injection.
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { OmegaConfig } from "@omega/config";

export function createValidationStore(omegaConfig: OmegaConfig) {
  return defineStore("validation", () => {
    // ✅ Services are immutable constants
    const config = omegaConfig;

    // State
    const validationEnabled = ref(false);
    const validationSummary = ref<Record<string, unknown>[]>([]);

    // Getters
    const isValidationEnabled = computed(() => validationEnabled.value);
    const summary = computed(() => validationSummary.value);
    const hasValidationSummary = computed(
      () => validationSummary.value.length > 0,
    );

    // Actions
    function setValidation(validation: {
      enabled: boolean;
      summary: Record<string, unknown>[];
    }) {
      validationEnabled.value = validation.enabled;
      validationSummary.value = validation.summary;
    }

    function enableValidation() {
      validationEnabled.value = true;
    }

    function disableValidation() {
      validationEnabled.value = false;
    }

    function setValidationSummary(summary: Record<string, unknown>[]) {
      validationSummary.value = summary;
    }

    function clearValidationSummary() {
      validationSummary.value = [];
    }

    function toggleValidation() {
      validationEnabled.value = !validationEnabled.value;
    }

    // Initialize validation from config
    function initializeValidation() {
      try {
        validationEnabled.value = config?.getValidationEnabled?.() || false;
      } catch (error) {
        console.warn(
          "Failed to get validation enabled from config, defaulting to false:",
          error,
        );
        validationEnabled.value = false;
      }
    }

    return {
      // State
      validationEnabled,
      validationSummary,

      // Getters
      isValidationEnabled,
      summary,
      hasValidationSummary,

      // Actions
      setValidation,
      enableValidation,
      disableValidation,
      setValidationSummary,
      clearValidationSummary,
      toggleValidation,
      initializeValidation,
    };
  });
}
