#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates that required environment variables are set for development
 */

const fs = require("fs");
const path = require("path");

// Required environment variables for development (when using Jira adapters)
const REQUIRED_ENV_VARS = [
  "HN_JIRA_USER",
  "HN_JIRA_TOKEN",
  "HN_JIRA_HOST",
  "HN_JIRA_BOARD_ID",
];

// Optional environment variables with defaults
const OPTIONAL_ENV_VARS = {
  HN_PORT: "3000",
  HN_MAX_RETRY: "3",
  HN_DELAY_BETWEEN_RETRY: "2",
  HN_DATA_SOURCE_ADAPTER: "default",
};

console.log("🔍 Validating development environment...\n");

let hasErrors = false;

// Check required environment variables
console.log("📋 Required Environment Variables (for Jira adapters):");
const adapterType = (
  process.env.HN_DATA_SOURCE_ADAPTER || "default"
).toLowerCase();
const isFakeDataMode = adapterType === "fake";

REQUIRED_ENV_VARS.forEach((varName) => {
  if (process.env[varName] || isFakeDataMode) {
    console.log(
      `  ✅ ${varName}: ${process.env[varName] ? "Set" : "Skipped (fake adapter mode)"}`,
    );
  } else {
    console.log(`  ❌ ${varName}: Missing`);
    hasErrors = true;
  }
});

// Check optional environment variables
console.log("\n📋 Optional Environment Variables (with defaults):");
Object.entries(OPTIONAL_ENV_VARS).forEach(([varName, defaultValue]) => {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName}: ${process.env[varName]}`);
  } else {
    console.log(`  ⚠️  ${varName}: Not set (using default: ${defaultValue})`);
  }
});

// Check for .env file
console.log("\n📋 Environment File:");
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  console.log("  ✅ .env file exists");
} else {
  console.log("  ⚠️  .env file not found (create one from .env.example)");
}

// Summary
console.log("\n" + "=".repeat(50));
if (hasErrors) {
  console.log("❌ Environment validation failed!");
  console.log("Please set the missing required environment variables.");
  console.log("\n💡 Tip: Copy .env.example to .env and fill in your values.");
  process.exit(1);
} else {
  console.log("✅ Environment validation passed!");
  console.log("Ready for development.");
  process.exit(0);
}
