import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Contourner cette règle avec queueMicrotask n’apporte aucun gain produit mesurable
      // (voir docs/refactor_rules.md) ; elle interdit aussi des effets légitimes (chargement,
      // reset à l’ouverture). Désactivée au profit de revues ciblées plutôt que microtasks.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
