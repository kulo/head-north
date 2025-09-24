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
import { useStore } from "vuex";
import { FlagOutlined } from "@ant-design/icons-vue";

export default {
  name: "validationSelector",
  components: {
    FlagOutlined,
  },
  setup() {
    const store = useStore();

    const validationEnabled = computed(() => store.state.validationEnabled);

    const toggleValidation = () => {
      store.commit("TOGGLE_VALIDATION");
    };

    return {
      validationEnabled,
      toggleValidation,
    };
  },
};
</script>
