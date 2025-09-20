// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config({ ignores: ['dist'] }, {
  extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.test.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}"],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
  },
  plugins: {
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
  },
   rules: {
      "max-lines-per-function": ["warn", { max: 120, skipBlankLines: true, skipComments: true }],
      "no-console": "warn",
      "@typescript-eslint/explicit-function-return-type": "off", // allow terser test syntax
      "testing-library/no-debugging-utils": "warn",
      "testing-library/prefer-screen-queries": "error",
    },
}, storybook.configs["flat/recommended"]);
