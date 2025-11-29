import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  bundle: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  minify: false,
  outDir: "dist",
  external: [
    // Keep these as external dependencies
    "koa",
    "@koa/cors",
    "@koa/router",
    "axios",
    "csv-parse",
    "jira.js",
    "lodash",
    "node-cache",
    "pino",
    "retry",
    // Keep shared packages as external
    "@headnorth/config",
    "@headnorth/types",
    "@headnorth/utils",
    "@headnorth/jira-primitives",
  ],
  onSuccess: "echo '✅ Build completed successfully'",
});
