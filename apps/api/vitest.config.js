import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      "@headnorth/types": path.resolve(__dirname, "../../packages/types/src"),
      "@headnorth/utils": path.resolve(__dirname, "../../packages/utils/src"),
      "@headnorth/config": path.resolve(__dirname, "../../packages/config/src"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.{js,ts}"],
    exclude: ["node_modules", "dist"],
    env: {
      NODE_ENV: "test",
    },
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
});
