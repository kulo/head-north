<template>
  <div class="cycle-item-container-column__objective">
    <div class="cycle-item-container-column__objective__name">
      {{ objective.name }}
    </div>
    <div class="cycle-item-container-column__objective__percentage">
      {{ objective.progress || 0 }}%
    </div>
  </div>
</template>

<script>
export default {
  name: "ObjectiveListItem",

  props: {
    objective: {
      type: Object,
      required: true,
    },
  },
};
</script>
