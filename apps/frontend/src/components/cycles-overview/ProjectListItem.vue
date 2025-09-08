<template>
  <div class="epic-container-column__project">
    <div class="project-item">
      <div class="project-name">
        <a :href="project.url" class="jira-link" target="_blank">
          {{ project.name }}
          <a-icon type="link" />
        </a>
      </div>
      <div class="project-owner">{{ project.owner }}</div>
      <div class="project-progress">{{ project.progress }}%</div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'ProjectListItem',
  props: {
    project: {
      type: Object,
      required: true
    },
    showArea: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const store = useStore()
    
    const validationEnabled = computed(() => store.state.validationEnabled)
    
    const showValidation = (project) => {
      emit('showValidation', project)
    }

    return {
      validationEnabled,
      showValidation
    }
  }
}
</script>

<style scoped>
.project-item {
  padding: 10px;
  border: 1px solid var(--color-gray-300);
  margin: 5px 0;
  border-radius: 4px;
}

.project-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.project-owner {
  color: var(--color-gray-500);
  font-size: 0.9em;
}

.project-progress {
  color: var(--color-info);
  font-size: 0.9em;
}
</style>