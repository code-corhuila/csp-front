const tseslint = require('typescript-eslint');
const angularESLint = require('@angular-eslint/eslint-plugin');
const angularESLintTemplate = require('@angular-eslint/eslint-plugin-template');
const angularESLintTemplateParser = require('@angular-eslint/template-parser');

module.exports = tseslint.config(
  { ignores: ['dist/', 'node_modules/', '.angular/', 'eslint.config.js'] },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['tsconfig.json', 'tsconfig.app.json'],
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@angular-eslint': angularESLint,
    },
    rules: {
      ...angularESLint.configs.recommended.rules,
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
    },
  },
  {
    // main.ts runs before initFederation installs the import map: a static import of
    // an Angular package here leaves the shell blank ("Unable to resolve specifier").
    files: ['src/main.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['@angular/*'] }],
    },
  },
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: angularESLintTemplateParser,
    },
    plugins: {
      '@angular-eslint/template': angularESLintTemplate,
    },
    rules: {
      ...angularESLintTemplate.configs.recommended.rules,
    },
  }
);
