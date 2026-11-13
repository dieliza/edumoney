const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
module.exports = defineConfig([expoConfig, { ignores: ['dist/**', 'dist-web/**', 'dist-preview/**', 'test-results/**', 'playwright-report/**', 'ios/**', 'android/**', 'plugins/**'] }]);
