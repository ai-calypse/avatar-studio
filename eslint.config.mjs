import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'mcp/node_modules/**', 'dist/**', '.pages-site/**', 'test-results/**', 'playwright-report/**'] },
  js.configs.recommended,
  { rules: { 'no-empty': ['error', { allowEmptyCatch: true }] } },
  { files: ['src/**/*.js', 'demo/**/*.js', 'agent-robot-avatar.js'], languageOptions: { globals: globals.browser } },
  { files: ['mcp/**/*.mjs', 'scripts/**/*.mjs', '*.config.mjs'], languageOptions: { globals: globals.node } },
  { files: ['tests/**/*.{js,mjs}'], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  // Existing animation hooks intentionally retain arguments and intermediate
  // values for extension compatibility. Undefined references and other
  // recommended correctness rules remain errors.
  { files: ['src/agent-robot-avatar*.js', 'demo/agent-robot-avatar-demo*.js'], rules: { 'no-unused-vars': 'off' } },
];
