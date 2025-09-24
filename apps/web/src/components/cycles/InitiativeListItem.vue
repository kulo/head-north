<template>
  <div class="release-item-container-column__initiative">
    <div class="release-item-container-column__initiative__name">
      {{ initiative.name }}
    </div>
    <div class="release-item-container-column__initiative__percentage">
      {{ initiative.progress || 0 }}%
    </div>
  </div>
</template>

<script>
export default {
  name: "InitiativeListItem",

  props: {
    initiative: {
      type: Object,
      required: true,
    },
  },
};
</script>
