// Load .env file from project root for monorepo setup
// This script MUST be loaded before any other code runs (via --import flag)
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (two levels up from apps/api)
// Use absolute path to ensure it works regardless of current working directory
const envPath = resolve(__dirname, "../../.env");
const absoluteEnvPath = resolve(envPath); // Ensure absolute path

if (existsSync(absoluteEnvPath)) {
  const result = dotenv.config({ path: absoluteEnvPath });
  if (result.error) {
    console.error(
      `[load-env] Error loading .env file from ${absoluteEnvPath}:`,
      result.error,
    );
  } else {
    // Log successful load (only in development to avoid noise)
    if (process.env.NODE_ENV !== "production") {
      console.log(`[load-env] Loaded .env from ${absoluteEnvPath}`);
    }
  }
} else {
  console.warn(`[load-env] Warning: .env file not found at ${absoluteEnvPath}`);
  console.warn(`[load-env] Current working directory: ${process.cwd()}`);
  console.warn(`[load-env] Script location: ${__dirname}`);
}
