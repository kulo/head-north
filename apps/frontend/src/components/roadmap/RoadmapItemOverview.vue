<template>
  <div>
    <a-row :class="{ 'roadmap-item-row': true, 'odd': itemIndex % 2 === 0 }">
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
        <template v-if="roadmapItem.sprints[sprint.id]">
          <a-row class="release-item" v-for="releaseItem in roadmapItem.sprints[sprint.id]" :key="releaseItem.ticketId">
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
  }
}
</script>

<style scoped>
.roadmap-item-row {
  min-height: 60px;
  height: 100%;
  background: var(--color-gray-800);
  color: var(--color-text-primary);
}

.roadmap-item-row.odd {
  background: var(--color-gray-700);
}

.roadmap-item-row {
  border-bottom: 1px solid var(--color-gray-600);
  transition: background-color 0.2s ease;
}

.roadmap-item-row:hover {
  background: var(--color-gray-600) !important;
}
.roadmap-item, .sprint-release-items {
  min-height: 60px;
  color: var(--color-text-primary);
  text-overflow: clip;
  margin: 5px 2px;
}

.release-item {
  height: 90px;
  width: 100%;
  background: var(--color-gray-800);
  display: inline-block;
  margin: 1px 0;
}

.release-item p {
  padding: 0 8px;
  font-size: 14px;
}

.release-item a {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.roadmap-item {
  padding-left: 20px;
  font-weight: bolder;
  height: 100%;
}

.roadmap-item p {
  margin-bottom: 0;
}

.s0 { background: var(--color-gray-500); }
.s1 { background: var(--color-warning); }
.s2 { background: var(--color-success); }
.s3 { background: var(--color-info); }

.project-popover__release-item__stage {
  border: none;
  padding-top: 2px;
}

.gtm-validation {
  font-weight: lighter;
  font-size: smaller;
  font-style: italic;
  cursor: pointer;
}

.link-icon {
  margin-left: 5px;
  font-size: 12px;
}
</style>
