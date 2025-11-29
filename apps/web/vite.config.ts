import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { fileURLToPath } from "url";
import autoprefixer from "autoprefixer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Vue 3 specific options
        },
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      vue: "vue/dist/vue.esm-bundler.js",
      "@headnorth/types": path.resolve(__dirname, "../../packages/types/src"),
      "@headnorth/utils": path.resolve(__dirname, "../../packages/utils/src"),
      "@headnorth/config": path.resolve(__dirname, "../../packages/config/src"),
    },
    extensions: [".ts", ".js", ".vue", ".json"],
  },
  server: {
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    // Increase chunk size warning limit to 1500KB
    // ant-design-vue is inherently large (~1.4MB) and is already properly code-split
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["vue", "vue-router", "pinia"],
          antd: ["ant-design-vue"],
          charts: ["vue3-apexcharts", "apexcharts"],
        },
      },
    },
  },
  define: {
    __VUE_OPTIONS_API__: "true",
    __VUE_PROD_DEVTOOLS__: "false",
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false",
  },
  css: {
    postcss: {
      plugins: [autoprefixer],
    },
  },
  publicDir: "public",
});
