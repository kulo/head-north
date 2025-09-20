<template>
  <a-select
    v-model:value="selectedAssignees"
    class="external-selector assignee-selector"
    mode="multiple"
    placeholder="All Assignees"
    @change="setSelectedAssignees"
  >
    <a-select-option
      key="all"
      value="all"
    >
      All Assignees
    </a-select-option>
    <a-select-option
      v-for="assignee in filteredAssignees"
      :key="assignee.id"
      :value="assignee.id"
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
    
    const selectedAssignees = ref([])
    const assignees = computed(() => store.state.assignees || [])
    
    // Filter out "All Assignees" from the dropdown options
    const filteredAssignees = computed(() => {
      return assignees.value.filter(assignee => assignee.id !== 'all')
    })
    
    // Watch for changes in store and update local ref
    watch(() => store.state.selectedAssignees, (newValue) => {
      if (newValue && newValue.length > 0 && newValue[0] !== undefined) {
        // Convert assignee objects to IDs for the select component, excluding 'all'
        const assigneeIds = newValue
          .map(assignee => assignee.id || assignee)
          .filter(id => id !== undefined && id !== 'all')
        selectedAssignees.value = assigneeIds
      } else {
        selectedAssignees.value = []
      }
    }, { immediate: true })
    
    // Watch for assignees to be loaded and set default selection
    watch(() => store.state.assignees, (newAssignees) => {
      if (newAssignees && newAssignees.length > 0 && (!store.state.selectedAssignees || store.state.selectedAssignees.length === 0)) {
        // Don't set any default selection - let it show "All Assignees" placeholder
        selectedAssignees.value = []
      }
    }, { immediate: true })
    
    const setSelectedAssignees = (assigneeIds) => {
      // If "all" is selected, clear all selections
      if (assigneeIds && assigneeIds.includes('all')) {
        selectedAssignees.value = []
        store.dispatch('setSelectedAssignees', [])
        return
      }
      
      selectedAssignees.value = assigneeIds
      
      // If no assignees selected, clear the store (equivalent to "All Assignees")
      if (!assigneeIds || assigneeIds.length === 0) {
        store.dispatch('setSelectedAssignees', [])
        return
      }
      
      // Convert IDs back to assignee objects for the store
      const assigneeObjects = assigneeIds.map(id => {
        const assignee = assignees.value.find(assignee => assignee.id === id)
        return assignee || { id, name: 'Unknown Assignee' }
      })
      
      store.dispatch('setSelectedAssignees', assigneeObjects)
    }
    
    return {
      selectedAssignees,
      assignees,
      filteredAssignees,
      setSelectedAssignees
    }
  }
}
</script>
