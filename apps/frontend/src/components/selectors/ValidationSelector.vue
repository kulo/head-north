<template>
  <a-tooltip :title="tooltipContent" placement="bottom">
    <div class="external-selector validation-selector" @click="toggleValidation">
      <FlagOutlined v-if="validationEnabled" />
      <FlagOutlined v-if="!validationEnabled" style="opacity: 0.3" />
    </div>
  </a-tooltip>
</template>
<script>
import { computed } from "vue"
import { useStore } from "vuex"
import { FlagOutlined } from '@ant-design/icons-vue'

export default {
  name: "validationSelector",
  components: {
    FlagOutlined
  },
  setup() {
    const store = useStore()
    
    const validationEnabled = computed(() => store.state.validationEnabled)
    const validationSummary = computed(() => store.getters.validationSummary)
    
    const tooltipContent = computed(() => {
      const issueText = `(${validationSummary.value.length} issue)`;
      return validationEnabled.value ? `Hide validation ${issueText}` : 'Show validation';
    })

    const toggleValidation = () => {
      store.commit('TOGGLE_VALIDATION')
    }

    return {
      validationEnabled,
      validationSummary,
      tooltipContent,
      toggleValidation
    }
  }
}
</script>

