<template>
  <a-select
    v-model:value="selectedAssignees"
    class="external-selector assignee-selector"
    mode="multiple"
    size="small"
    placeholder="All Assignees"
    style="width: 150px; margin-right: 10px"
    @change="setSelectedAssignees"
  >
    <a-select-option
      v-for="assignee in assignees"
      :key="assignee.id"
      :value="assignee"
    >
      {{ assignee.name }}
    </a-select-option>
  </a-select>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'AssigneeSelector',
  setup() {
    const store = useStore()
    
    const selectedAssignees = ref(store.state.selectedAssignees || [])
    const assignees = computed(() => store.state.assignees)
    
    // Watch for changes in store and update local ref
    watch(() => store.state.selectedAssignees, (newValue) => {
      selectedAssignees.value = newValue || []
    }, { immediate: true })
    
    const setSelectedAssignees = (assignees) => {
      selectedAssignees.value = assignees
      store.dispatch('setSelectedAssignees', assignees)
    }
    
    return {
      selectedAssignees,
      assignees,
      setSelectedAssignees
    }
  }
}
</script>
