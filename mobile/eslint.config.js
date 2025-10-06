// https://docs.expo.dev/guides/using-eslint/
const path = require('path');
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        alias: {
          map: [['@', path.resolve(__dirname)]],
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
  },
]);
