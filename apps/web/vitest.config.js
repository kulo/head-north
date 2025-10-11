import { defineConfig } from "vitest/config";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.{js,ts,vue}"],
    exclude: ["node_modules", "dist"],
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "tests/",
        "**/*.d.ts",
        "**/*.config.js",
        "**/*.config.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
