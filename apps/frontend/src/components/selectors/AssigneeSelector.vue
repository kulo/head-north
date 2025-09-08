<template>
  <div class="assignee-selector">
    <a-select
      v-model:value="selectedAssignee"
      placeholder="Select Assignee"
      style="width: 180px; margin-right: 10px"
      @change="handleAssigneeChange"
      allow-clear
    >
      <a-select-option
        v-for="assignee in assignees"
        :key="assignee.id"
        :value="assignee.id"
      >
        {{ assignee.name }}
      </a-select-option>
    </a-select>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'AssigneeSelector',
  setup() {
    const store = useStore()
    const selectedAssignee = ref(null)
    
    const assignees = computed(() => store.state.assignees)
    
    const handleAssigneeChange = (value) => {
      selectedAssignee.value = value
      // Dispatch action to filter by assignee
      store.dispatch('setSelectedAssignee', value)
    }
    
    onMounted(() => {
      // Load assignees if not already loaded
      if (assignees.value.length === 0) {
        store.dispatch('fetchAssignees')
      }
    })
    
    return {
      selectedAssignee,
      assignees,
      handleAssigneeChange
    }
  }
}
</script>

<style scoped>
.assignee-selector {
  display: inline-block;
}
</style>