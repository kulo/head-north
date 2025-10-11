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
  </div>
</template>

<script>
import { computed, ref } from "vue";
import { useValidationStore } from "../../stores/registry";
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
    const validationStore = useValidationStore();

    const validationEnabled = computed(() => validationStore.validationEnabled);
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

    return {
      validationEnabled,
      popoverVisible,
      showValidation,
      togglePopover,
      closePopover,
      getStatusClass,
      getStageClass,
      DEFAULT_UNKNOWN,
    };
  },
};
</script>
