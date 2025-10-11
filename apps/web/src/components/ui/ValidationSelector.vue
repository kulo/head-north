<template>
  <a-tooltip title="Toggle validation!" placement="bottom">
    <div class="validation-selector" @click="toggleValidation">
      <FlagOutlined v-if="validationEnabled" />
      <FlagOutlined v-if="!validationEnabled" style="opacity: 0.3" />
    </div>
  </a-tooltip>
</template>
<script>
import { computed } from "vue";
import { useValidationStore } from "../../stores/registry";
import { FlagOutlined } from "@ant-design/icons-vue";

export default {
  name: "validationSelector",
  components: {
    FlagOutlined,
  },
  setup() {
    const validationStore = useValidationStore();

    const validationEnabled = computed(
      () => validationStore.isValidationEnabled,
    );

    const toggleValidation = () => {
      validationStore.toggleValidation();
    };

    return {
      validationEnabled,
      toggleValidation,
    };
  },
};
</script>
