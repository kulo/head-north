<template>
  <div class="epic-container-column__objective">
    <div class="epic-container-column__objective__name">{{ objective.name }}</div>
    <div class="epic-container-column__objective__percentage">{{ objective.progress }}%</div>
  </div>
</template>

<script>
export default {
  name: 'objective-list-item',

  props: ['objective']
};
</script>