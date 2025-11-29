import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

export default [
  // Base JavaScript configuration
  js.configs.recommended,

  // Global ignores
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/*.min.js",
      "**/*.d.ts",
      "**/__tests__/**",
      "**/*.test.ts",
      "**/*.test.js",
      "**/*.map",
    ],
  },

  // TypeScript configuration
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-empty-object-type": "warn",
      "no-unused-vars": "off", // Turn off base rule as it can report incorrect errors
      "no-undef": "off", // TypeScript handles this
      "no-prototype-builtins": "warn",
      "no-dupe-class-members": "warn",
      "no-dupe-keys": "warn",
    },
  },

  // Vue configuration
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: typescriptParser,
        ecmaVersion: 2022,
        sourceType: "module",
      },
      globals: {
        console: "readonly",
        process: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
      },
    },
    plugins: {
      vue,
    },
    rules: {
      ...vue.configs["vue3-recommended"].rules,
      "vue/multi-word-component-names": "off",
      "vue/no-unused-vars": "warn",
      "no-unused-vars": "off",
      "no-undef": "off",
    },
  },

  // JavaScript configuration
  {
    files: ["**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
      },
    },
    rules: {
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
      "prefer-const": "error",
      "no-var": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },

  // Note: esbuild.config.js files were removed in Phase 4 (migrated to tsup)
  // This section kept for reference but no longer needed
];
