<template>
  <div class="epic-container-column__initiative">
    <div class="epic-container-column__initiative__name">{{ initiative.name }}</div>
    <div class="epic-container-column__initiative__percentage">{{ initiative.progress }}%</div>
  </div>
</template>

<script>
export default {
  name: 'initiative-list-item',

  props: ['initiative']
};
</script>