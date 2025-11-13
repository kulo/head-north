<template>
  <div class="logo">
    <img :src="logoUrl" alt="Prewave Logo" class="logo-image" />
    <h1>Head North</h1>
  </div>
</template>

<script>
export default {
  name: "Logo",
  computed: {
    logoUrl() {
      return "/assets/prewave-logo.png";
    },
  },
};
</script>
