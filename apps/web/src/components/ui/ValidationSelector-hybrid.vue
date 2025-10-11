<template>
  <div class="validation-selector-container">
    <a-tooltip title="Toggle validation!" placement="bottom">
      <div class="validation-selector" @click="toggleValidation">
        <FlagOutlined v-if="validationEnabled" />
        <FlagOutlined v-if="!validationEnabled" style="opacity: 0.3" />
      </div>
    </a-tooltip>

    <!-- Debug info in development -->
    <div v-if="isDev" class="debug-info">
      <small>Store: {{ usePinia ? "Pinia" : "Vuex" }}</small>
      <button class="switch-btn" @click="switchStore">Switch Store</button>
    </div>
  </div>
</template>
<script>
import { computed, ref } from "vue";
import { useStore } from "vuex";
import { useValidationStore } from "../../stores/validation";
import { FlagOutlined } from "@ant-design/icons-vue";

export default {
  name: "validationSelector",
  components: {
    FlagOutlined,
  },
  setup() {
    const vuexStore = useStore();
    const piniaStore = useValidationStore();

    // Toggle between stores for testing
    const usePinia = ref(false);
    const isDev = import.meta.env.DEV;

    const validationEnabled = computed(() => {
      return usePinia.value
        ? piniaStore.isValidationEnabled
        : vuexStore.state.validationEnabled;
    });

    const toggleValidation = () => {
      if (usePinia.value) {
        piniaStore.toggleValidation();
      } else {
        vuexStore.commit("SET_VALIDATION", {
          enabled: !vuexStore.state.validationEnabled,
          summary: vuexStore.state.validationSummary,
        });
      }
    };

    const switchStore = () => {
      usePinia.value = !usePinia.value;
      console.log(`Switched to ${usePinia.value ? "Pinia" : "Vuex"} store`);
    };

    return {
      validationEnabled,
      toggleValidation,
      usePinia,
      isDev,
      switchStore,
    };
  },
};
</script>

<style scoped>
.validation-selector-container {
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
