import esbuild from "esbuild";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);

const config = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "esm",
  outfile: "dist/index.js",
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
    "@omega/config",
    "@omega/types",
    "@omega/utils",
  ],
  sourcemap: true,
  minify: false,
  logLevel: "info",
};

// Build function
async function build() {
  try {
    await esbuild.build(config);
    console.log("✅ Build completed successfully");
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

// Run build if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  build();
}

export default config;
