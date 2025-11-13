import esbuild from "esbuild";
import { readdirSync } from "fs";

const isDev = process.env.NODE_ENV === "development";

// Get all TypeScript files in src
const srcFiles = readdirSync("src")
  .filter((file) => file.endsWith(".ts"))
  .map((file) => `src/${file}`);

const buildConfig = {
  entryPoints: srcFiles,
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
  tsconfig: "./tsconfig.esbuild.json",
};

// Build function
async function build() {
  try {
    await esbuild.build(buildConfig);
    console.log("✅ @headnorth/utils built successfully");
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

build();
