import esbuild from "esbuild";
import { readdirSync } from "fs";

/**
 * Shared esbuild configuration for Head North packages
 * Provides consistent build settings across all packages
 */

export function createBaseConfig(options = {}) {
  const isDev = process.env.NODE_ENV === "development";

  return {
    bundle: false,
    platform: "neutral",
    target: "es2020",
    format: "esm",
    outdir: "dist",
    outExtension: { ".js": ".js" },
    sourcemap: isDev,
    minify: !isDev,
    splitting: false,
    treeShaking: true,
    external: [],
    tsconfig: "./tsconfig.json",
    ...options,
  };
}

export function createPackageConfig(packageName, customOptions = {}) {
  // Get all TypeScript files in src
  const srcFiles = readdirSync("src")
    .filter((file) => file.endsWith(".ts"))
    .map((file) => `src/${file}`);

  return createBaseConfig({
    entryPoints: srcFiles,
    ...customOptions,
  });
}

export function createAppConfig(entryPoint, customOptions = {}) {
  return createBaseConfig({
    entryPoints: [entryPoint],
    bundle: true,
    platform: "node",
    target: "node18",
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
      "@headnorth/config",
      "@headnorth/types",
      "@headnorth/utils",
    ],
    ...customOptions,
  });
}

export async function buildWithConfig(config, packageName) {
  try {
    await esbuild.build(config);
    console.log(`✅ ${packageName} built successfully`);
  } catch (error) {
    console.error(`❌ ${packageName} build failed:`, error);
    process.exit(1);
  }
}
