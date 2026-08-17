import js from '@eslint/js'
import eslintPluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'
import eslintConfigPrettier from '@vue/eslint-config-prettier'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}']
  },
  {
    name: 'app/files-to-ignore',
    // mock-server/ est un outil de dev autonome (Node CommonJS, son propre
    // package.json) : hors perimetre du lint TypeScript/Vue du frontend.
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.d.ts', 'mock-server/**']
  },
  js.configs.recommended,
  ...eslintPluginVue.configs['flat/recommended'],
  ...vueTsEslintConfig(),
  eslintConfigPrettier,
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      // Les props optionnelles typees TS (`prop?: string`) n'ont pas besoin
      // de valeur par defaut explicite: `undefined` est deja le comportement.
      'vue/require-default-prop': 'off',
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  }
]
