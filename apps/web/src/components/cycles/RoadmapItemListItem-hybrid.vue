<template>
  <div class="release-item-container-column__roadmap-item">
    <!-- Backdrop overlay for blur effect -->
    <div
      v-if="popoverVisible"
      class="popover-backdrop"
      @click="closePopover"
    ></div>

    <a-popover
      v-model:open="popoverVisible"
      placement="topLeft"
      overlay-class-name="roadmap-popover"
      trigger="click"
      :mouse-enter-delay="0"
      :mouse-leave-delay="0"
    >
      <template #content>
        <div class="roadmap-popover__header">
          <div class="roadmap-popover__header__name">
            {{ roadmapItem.name }}
          </div>
          <div class="roadmap-popover__header__owner">
            {{ roadmapItem.owner }}
          </div>
          <div class="roadmap-popover__header__weeks">
            {{ roadmapItem.weeks || 0 }} weeks
          </div>
          <div class="roadmap-popover__header__progress">
            {{ roadmapItem.progress || 0 }}%
          </div>
        </div>

        <div class="roadmap-popover__progress">
          <div
            class="progress-line"
            :style="{ '--percentage': (roadmapItem.progress || 0) + '%' }"
          >
            <div class="progress-percentage">
              {{ roadmapItem.progress || 0 }}%
            </div>
          </div>
        </div>

        <div
          v-if="roadmapItem.releaseItems && roadmapItem.releaseItems.length > 0"
          class="roadmap-popover__release-items"
        >
          <div
            v-for="releaseItem in roadmapItem.releaseItems"
            :key="releaseItem.name"
            class="roadmap-popover__release-item"
          >
            <div class="roadmap-popover__release-item__name">
              {{ releaseItem.name }}
            </div>
            <div class="roadmap-popover__release-item__effort">
              {{ releaseItem.effort || 0 }}w
            </div>
            <div
              class="roadmap-popover__release-item__stage"
              :class="getStageClass(releaseItem.stage)"
            >
              {{ releaseItem.stage || DEFAULT_UNKNOWN.NAME }}
            </div>
            <div
              class="roadmap-popover__release-item__status"
              :class="getStatusClass(releaseItem.status)"
            >
              {{ releaseItem.status || DEFAULT_UNKNOWN.NAME }}
            </div>
            <div
              v-if="
                releaseItem.validations && releaseItem.validations.length > 0
              "
              class="roadmap-popover__release-item__validation"
            >
              {{ releaseItem.validations.length }} validation{{
                releaseItem.validations.length > 1 ? "s" : ""
              }}
            </div>
          </div>
        </div>
      </template>

      <div class="roadmap-item" @click="togglePopover">
        <div class="roadmap-item-name">
          <a
            :href="roadmapItem.url"
            class="jira-link"
            target="_blank"
            @click.stop
          >
            {{ roadmapItem.name }}
          </a>
        </div>
        <div class="roadmap-item-owner">{{ roadmapItem.owner }}</div>
        <div class="roadmap-item-progress">
          {{ roadmapItem.progress || 0 }}%
        </div>
        <div
          v-if="roadmapItem.validations && roadmapItem.validations.length > 0"
          class="roadmap-item-validations"
        >
          <a-button
            type="primary"
            size="small"
            class="validation-button"
            @click.stop="showValidation(roadmapItem)"
          >
            {{ roadmapItem.validations.length }} validation{{
              roadmapItem.validations.length > 1 ? "s" : ""
            }}
          </a-button>
        </div>
      </div>
    </a-popover>

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
import { DEFAULT_UNKNOWN } from "../../lib/constants/default-values";

export default {
  name: "RoadmapItemListItem",
  props: {
    roadmapItem: {
      type: Object,
      required: true,
    },
    showArea: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const vuexStore = useStore();
    const validationStore = useValidationStore();

    // Toggle between stores for testing
    const usePinia = ref(false);
    const isDev = import.meta.env.DEV;

    const validationEnabled = computed(() => {
      return usePinia.value
        ? validationStore.validationEnabled
        : vuexStore.state.validationEnabled;
    });

    const popoverVisible = ref(false);

    const showValidation = (roadmapItem) => {
      emit("showValidation", roadmapItem);
    };

    const togglePopover = () => {
      popoverVisible.value = !popoverVisible.value;
    };

    const closePopover = () => {
      popoverVisible.value = false;
    };

    const getStatusClass = (status) => {
      if (!status) return "";
      const normalizedStatus = status.toLowerCase().replace(/[^a-z0-9]/g, "-");
      return `status-${normalizedStatus}`;
    };

    const getStageClass = (stage) => {
      if (!stage) return "";
      const normalizedStage = stage.toLowerCase().replace(/[^a-z0-9]/g, "-");
      return `stage-${normalizedStage}`;
    };

    const switchStore = () => {
      usePinia.value = !usePinia.value;
      console.log(
        `RoadmapItemListItem switched to ${usePinia.value ? "Pinia" : "Vuex"} store`,
      );
    };

    return {
      validationEnabled,
      popoverVisible,
      showValidation,
      togglePopover,
      closePopover,
      getStatusClass,
      getStageClass,
      DEFAULT_UNKNOWN,
      usePinia,
      isDev,
      switchStore,
    };
  },
};
</script>

<style scoped>
.debug-info {
  position: absolute;
  top: -20px;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  color: #666;
  z-index: 1000;
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
