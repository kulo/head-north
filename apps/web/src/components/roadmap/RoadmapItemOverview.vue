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
            <span class="gtm-validation">Cycle not scheduled yet</span>
          </a-tooltip>
        </div>
      </a-col>
      <a-col
        v-for="cycle in orderedCycles"
        :key="cycle.id"
        :span="4"
        class="cycle-cycle-items"
      >
        <template v-if="getCycleItemsForCycle(cycle.id).length > 0">
          <div
            v-for="cycleItem in getCycleItemsForCycle(cycle.id)"
            :key="cycleItem.id"
            class="cycle-item"
          >
            <a :href="cycleItem.url" class="jira-link" target="_blank">
              {{ cycleItem.name }}
            </a>
            <span
              v-if="cycleItem.stage"
              :class="{
                [cycleItem.stage]: true,
                'project-popover__cycle-item__stage': true,
              }"
            >
              {{ cycleItem.stage }}
            </span>
          </div>
        </template>
      </a-col>
    </a-row>
  </div>
</template>

<script>
import { computed } from "vue";
import {
  hasValidationError,
  getValidationErrorText,
} from "../../lib/utils/roadmap-validation";
import { getCycleItemsForCycle } from "../../lib/utils/roadmap-item-utils";

export default {
  name: "roadmap-item-overview",
  props: ["roadmapItem", "orderedCycles", "itemIndex"],
  setup(props) {
    // Extract validation logic to pure functions
    const validations = computed(() => props.roadmapItem.validations);
    const hasValidationErrorComputed = computed(() =>
      hasValidationError(validations.value),
    );
    const validationErrorTextComputed = computed(() =>
      getValidationErrorText(validations.value),
    );

    // Use pure function instead of store method
    const getCycleItemsForCycleFn = (cycleId) => {
      return getCycleItemsForCycle(props.roadmapItem, cycleId);
    };

    return {
      validations,
      hasValidationError: hasValidationErrorComputed,
      validationErrorText: validationErrorTextComputed,
      getCycleItemsForCycle: getCycleItemsForCycleFn,
    };
  },
};
</script>
