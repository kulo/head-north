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
import { useDataStore } from "../../stores";

export default {
  name: "roadmap-item-overview",
  props: ["roadmapItem", "orderedCycles", "itemIndex"],
  setup() {
    const dataStore = useDataStore();

    return {
      dataStore,
    };
  },
  computed: {
    validations() {
      return this.roadmapItem.validations;
    },
    hasValidationError() {
      return (
        this.validations &&
        (!this.validations.hasScheduledRelease ||
          !this.validations.hasGlobalReleaseInBacklog)
      );
    },
    validationErrorText() {
      if (!this.hasValidationError) {
        return "";
      }

      return [
        !this.validations.hasScheduledRelease
          ? "No scheduled S1/S3 release."
          : [],
        !this.validations.hasGlobalReleaseInBacklog
          ? "No planned S3 release."
          : [],
      ]
        .flat()
        .join(" ");
    },
  },
  methods: {
    getReleaseItemsForCycle(cycleId) {
      return this.dataStore.getReleaseItemsForCycle(this.roadmapItem, cycleId);
    },
  },
};
</script>
