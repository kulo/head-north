import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: {
    compilerOptions: {
      composite: false,
    },
  },
  sourcemap: true,
  clean: true,
  splitting: false,
  bundle: true,
  target: "es2022",
  outDir: "dist",
  onSuccess: "echo '✅ @headnorth/utils built successfully'",
});
