module.exports = {
  // Basic formatting
  semi: true,
  singleQuote: true,
  quoteProps: "as-needed",
  trailingComma: "es5",
  tabWidth: 2,
  useTabs: false,
  printWidth: 80,

  // Vue specific
  vueIndentScriptAndStyle: false,

  // File type specific
  overrides: [
    {
      files: "*.vue",
      options: {
        parser: "vue",
      },
    },
    {
      files: "*.json",
      options: {
        parser: "json",
      },
    },
    {
      files: "*.md",
      options: {
        parser: "markdown",
        printWidth: 100,
      },
    },
  ],
};
