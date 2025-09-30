import { defineConfig } from "vitest/config";

/**
 * Shared Vitest configuration for Omega packages
 * Provides consistent test settings across all packages
 */

export function createBaseTestConfig(options = {}) {
  return defineConfig({
    test: {
      globals: true,
      environment: "node",
      include: ["tests/**/*.test.{js,ts}"],
      exclude: ["node_modules", "dist"],
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
      ...options,
    },
  });
}

export function createPackageTestConfig(packageName, customOptions = {}) {
  return createBaseTestConfig({
    test: {
      name: packageName,
      ...customOptions,
    },
  });
}

export function createWebTestConfig(customOptions = {}) {
  return defineConfig({
    test: {
      globals: true,
      environment: "jsdom",
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
      ...customOptions,
    },
  });
}

export function createAppTestConfig(appName, customOptions = {}) {
  return createBaseTestConfig({
    test: {
      name: appName,
      setupFiles: ["tests/setup.ts"],
      ...customOptions,
    },
  });
}

// Default export for easy importing
export default createBaseTestConfig();
