<template>
  <div class="release-item-container-column__roadmap-item">
    <div class="roadmap-item">
      <div class="roadmap-item-name">
        <a :href="roadmapItem.url" class="jira-link" target="_blank">
          {{ roadmapItem.name }}
          <a-icon type="link" />
        </a>
      </div>
      <div class="roadmap-item-owner">{{ roadmapItem.owner }}</div>
      <div class="roadmap-item-progress">{{ roadmapItem.progress }}%</div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'RoadmapItemListItem',
  props: {
    roadmapItem: {
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
    
    const showValidation = (roadmapItem) => {
      emit('showValidation', roadmapItem)
    }

    return {
      validationEnabled,
      showValidation
    }
  }
}
</script>

<style scoped>
.roadmap-item {
  padding: 10px;
  border: 1px solid var(--color-gray-300);
  margin: 5px 0;
  border-radius: 4px;
}

.roadmap-item-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.roadmap-item-owner {
  color: var(--color-gray-500);
  font-size: 0.9em;
}

.roadmap-item-progress {
  color: var(--color-info);
  font-size: 0.9em;
}
</style>