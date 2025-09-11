<template>
  <div>
    <a-row :class="{ 'roadmap-item-row': true, 'odd': itemIndex % 2 === 1 }">
      <a-col :span="6" class="roadmap-item">
        <p>
          <a :href="roadmapItem.url" class="jira-link" target="_blank">
            {{ roadmapItem.summary }}
            <span class="link-icon">🔗</span>
          </a>
        </p>
        <div v-if="hasValidationError">
          <a-tooltip :title="validationErrorText" placement="bottom">
            <span class="gtm-validation">Release not scheduled yet</span>
          </a-tooltip>
        </div>
      </a-col>
      <a-col :span="4" class="sprint-release-items" v-for="sprint in orderedSprints" :key="sprint.id">
        <template v-if="getReleaseItemsForSprint(sprint.id).length > 0">
          <a-row class="release-item" v-for="releaseItem in getReleaseItemsForSprint(sprint.id)" :key="releaseItem.ticketId">
            <p>
              <a :href="releaseItem.url" class="jira-link" target="_blank">
                {{ releaseItem.name }}
              </a>
              <span v-if="releaseItem.stage" :class="{ [releaseItem.stage]: true, 'project-popover__release-item__stage': true }">
                    {{ releaseItem.stage }}
              </span>
            </p>
          </a-row>
        </template>
      </a-col>
    </a-row>
  </div>
</template>

<script>
export default {
  name: "roadmap-item-overview",
  props: ['roadmapItem', 'orderedSprints', 'itemIndex'],
  computed: {
    validations() {
      return this.roadmapItem.validations;
    },
    hasValidationError() {
      return this.validations && (!this.validations.hasScheduledRelease || !this.validations.hasGlobalReleaseInBacklog);
    },
    validationErrorText() {
      if (!this.hasValidationError) {
        return '';
      }

      return [
        !this.validations.hasScheduledRelease ? 'No scheduled S1/S3 release.' : [],
        !this.validations.hasGlobalReleaseInBacklog ? 'No planned S3 release.' : []
      ].flat().join(' ');
    }
  },
  methods: {
    getReleaseItemsForSprint(sprintId) {
      if (!this.roadmapItem.sprints) {
        return [];
      }
      
      const sprintData = this.roadmapItem.sprints.find(sprint => sprint.sprintId === sprintId);
      return sprintData ? sprintData.releaseItems : [];
    }
  }
}
</script>
