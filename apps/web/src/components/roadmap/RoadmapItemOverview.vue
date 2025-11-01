<template>
  <div>
    <a-row :class="{ 'roadmap-item-row': true, odd: itemIndex % 2 === 1 }">
      <a-col :span="6" class="roadmap-item">
        <div>
          <a :href="roadmapItem.url" class="jira-link" target="_blank">
            {{ roadmapItem.name }}
          </a>
        </div>
        <div v-if="hasValidationError">
          <a-tooltip :title="validationErrorText" placement="bottom">
            <span class="gtm-validation">Release not scheduled yet</span>
          </a-tooltip>
        </div>
      </a-col>
      <a-col
        v-for="cycle in orderedCycles"
        :key="cycle.id"
        :span="4"
        class="cycle-release-items"
      >
        <template v-if="getReleaseItemsForCycle(cycle.id).length > 0">
          <div
            v-for="releaseItem in getReleaseItemsForCycle(cycle.id)"
            :key="releaseItem.id"
            class="release-item"
          >
            <a :href="releaseItem.url" class="jira-link" target="_blank">
              {{ releaseItem.name }}
            </a>
            <span
              v-if="releaseItem.stage"
              :class="{
                [releaseItem.stage]: true,
                'project-popover__release-item__stage': true,
              }"
            >
              {{ releaseItem.stage }}
            </span>
          </div>
        </template>
      </a-col>
    </a-row>
  </div>
</template>

<script>
import { computed } from "vue";
import { useDataStore } from "../../stores";
import {
  hasValidationError,
  getValidationErrorText,
} from "../../lib/utils/roadmap-validation";

export default {
  name: "roadmap-item-overview",
  props: ["roadmapItem", "orderedCycles", "itemIndex"],
  setup(props) {
    const dataStore = useDataStore();

    // Extract validation logic to pure functions
    const validations = computed(() => props.roadmapItem.validations);
    const hasValidationErrorComputed = computed(() =>
      hasValidationError(validations.value),
    );
    const validationErrorTextComputed = computed(() =>
      getValidationErrorText(validations.value),
    );

    const getReleaseItemsForCycle = (cycleId) => {
      return dataStore.getReleaseItemsForCycle(props.roadmapItem, cycleId);
    };

    return {
      dataStore,
      validations,
      hasValidationError: hasValidationErrorComputed,
      validationErrorText: validationErrorTextComputed,
      getReleaseItemsForCycle,
    };
  },
};
</script>
