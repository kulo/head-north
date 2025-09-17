<template>
  <div class="release-item-container-column__roadmap-item">
    <!-- Backdrop overlay for blur effect -->
    <div 
      v-if="popoverVisible" 
      class="popover-backdrop" 
      @click="closePopover">
    </div>
    
    <a-popover 
      v-model:open="popoverVisible"
      placement="topLeft" 
      :title="roadmapItem.name"
      overlay-class-name="roadmap-popover"
      trigger="click"
      :mouse-enter-delay="0"
      :mouse-leave-delay="0">
      <template #content>
        <div class="roadmap-popover__header">
          <div class="roadmap-popover__header__name">{{ roadmapItem.name }}</div>
          <div class="roadmap-popover__header__owner">{{ roadmapItem.owner }}</div>
          <div class="roadmap-popover__header__weeks">{{ roadmapItem.weeks || 0 }} weeks</div>
          <div class="roadmap-popover__header__progress">{{ roadmapItem.progress || 0 }}%</div>
        </div>
        
        <div class="roadmap-popover__progress">
          <div class="progress-line" :style="{ '--percentage': (roadmapItem.progress || 0) + '%' }">
            <div class="progress-percentage">{{ roadmapItem.progress || 0 }}%</div>
          </div>
        </div>
        
        <div class="roadmap-popover__release-items" v-if="roadmapItem.releaseItems && roadmapItem.releaseItems.length > 0">
          <div 
            v-for="releaseItem in roadmapItem.releaseItems" 
            :key="releaseItem.name"
            class="roadmap-popover__release-item">
            <div class="roadmap-popover__release-item__name">{{ releaseItem.name }}</div>
            <div class="roadmap-popover__release-item__effort">{{ releaseItem.effort || 0 }}w</div>
            <div class="roadmap-popover__release-item__stage" :class="getStageClass(releaseItem.stage)">{{ releaseItem.stage || 'Unknown' }}</div>
            <div class="roadmap-popover__release-item__status" :class="getStatusClass(releaseItem.status)">{{ releaseItem.status || 'Unknown' }}</div>
            <div v-if="releaseItem.validations && releaseItem.validations.length > 0" class="roadmap-popover__release-item__validation">
              {{ releaseItem.validations.length }} validation{{ releaseItem.validations.length > 1 ? 's' : '' }}
            </div>
          </div>
        </div>
      </template>
      
      <div class="roadmap-item" @click="togglePopover">
        <div class="roadmap-item-name">
          <a :href="roadmapItem.url" class="jira-link" target="_blank" @click.stop>
            {{ roadmapItem.name }}
            <a-icon type="link" />
          </a>
        </div>
        <div class="roadmap-item-owner">{{ roadmapItem.owner }}</div>
        <div class="roadmap-item-progress">{{ roadmapItem.progress || 0 }}%</div>
        <div v-if="roadmapItem.validations && roadmapItem.validations.length > 0" class="roadmap-item-validations">
          <a-button 
            type="primary" 
            size="small" 
            @click.stop="showValidation(roadmapItem)"
            class="validation-button">
            {{ roadmapItem.validations.length }} validation{{ roadmapItem.validations.length > 1 ? 's' : '' }}
          </a-button>
        </div>
      </div>
    </a-popover>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
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
    
    // DEBUG: Log the roadmap item data
    console.log('🔍 DEBUG: RoadmapItemListItem received roadmapItem:', props.roadmapItem)
    console.log('🔍 DEBUG: roadmapItem keys:', props.roadmapItem ? Object.keys(props.roadmapItem) : 'no roadmapItem')
    console.log('🔍 DEBUG: roadmapItem.releaseItems:', props.roadmapItem.releaseItems)
    console.log('🔍 DEBUG: releaseItems length:', props.roadmapItem.releaseItems?.length)
    console.log('🔍 DEBUG: roadmapItem.name:', props.roadmapItem.name)
    console.log('🔍 DEBUG: roadmapItem.owner:', props.roadmapItem.owner)
    console.log('🔍 DEBUG: roadmapItem.progress:', props.roadmapItem.progress)
    
    const validationEnabled = computed(() => store.state.validationEnabled)
    const popoverVisible = ref(false)
    
    const showValidation = (roadmapItem) => {
      emit('showValidation', roadmapItem)
    }

    const togglePopover = () => {
      popoverVisible.value = !popoverVisible.value
    }

    const closePopover = () => {
      popoverVisible.value = false
    }

    const getStatusClass = (status) => {
      if (!status) return ''
      const normalizedStatus = status.toLowerCase().replace(/[^a-z0-9]/g, '-')
      return `status-${normalizedStatus}`
    }

    const getStageClass = (stage) => {
      if (!stage) return ''
      const normalizedStage = stage.toLowerCase().replace(/[^a-z0-9]/g, '-')
      return `stage-${normalizedStage}`
    }

    return {
      validationEnabled,
      popoverVisible,
      showValidation,
      togglePopover,
      closePopover,
      getStatusClass,
      getStageClass
    }
  }
}
</script>
