<template>
  <div class="logo">
    <img :src="logoUrl" alt="Prewave Logo" class="logo-image" />
    <h1>Omega</h1>
  </div>
</template>

<script>
export default {
  name: 'Logo',
  computed: {
    logoUrl() {
      return '/assets/prewave-logo.png';
    }
  }
}
</script>

<style scoped>
.logo {
  display: flex;
  align-items: center;
  margin-right: 20px;
  flex-shrink: 0; /* Prevent the logo from shrinking */
  min-width: fit-content; /* Ensure it takes the space it needs */
}

.logo-image {
  height: 25px;
  width: auto;
  margin-right: 12px;
  filter: invert(1) brightness(1);
  object-fit: contain;
  transition: all 0.3s ease;
}

/* On smaller screens, crop to show only the 'P' */
@media (max-width: 768px) {
  .logo-image {
    width: 25px; /* Square crop to show only the 'P' */
    height: 25px;
    object-fit: cover;
    object-position: left; /* Align to show the 'P' on the left */
  }
}

h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  white-space: nowrap;
  line-height: 1;
  flex-shrink: 0; /* Prevent the text from shrinking */
  overflow: visible; /* Ensure text is not clipped */
}
</style>