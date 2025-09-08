// Shared ESLint configuration for Omega applications

module.exports = {
  // Base configuration
  extends: [
    'eslint:recommended'
  ],
  
  // Environment settings
  env: {
    node: true,
    es2022: true,
    browser: true
  },
  
  // Parser options
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  
  // Rules
  rules: {
    // General rules
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-unused-vars': 'warn',
    'no-undef': 'error',
    
    // Code style
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    
    // Best practices
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-sequences': 'error',
    'no-throw-literal': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unused-expressions': 'error',
    'no-useless-call': 'error',
    'no-useless-concat': 'error',
    'no-useless-return': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error'
  },
  
  // Override for different file types
  overrides: [
    {
      files: ['*.vue'],
      extends: ['plugin:vue/recommended'],
      rules: {
        'vue/multi-word-component-names': 'off',
        'vue/no-v-html': 'warn'
      }
    },
    {
      files: ['*.test.js', '*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        'no-unused-expressions': 'off'
      }
    }
  ]
};
