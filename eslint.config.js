const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: ['**/node_modules/**', 'server/generated/**', 'server/prisma/migrations/**'],
  },
  js.configs.recommended,
  {
    // arquivos de configuração na raiz (como este)
    files: ['*.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  {
    files: ['server/**/*.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
    rules: { 'no-empty': ['error', { allowEmptyCatch: true }] },
  },
  {
    files: ['client/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      // funções e variáveis compartilhadas entre os arquivos do front
      globals: {
        ...globals.browser,
        Chart: 'readonly',
        request: 'writable',
        getToken: 'writable',
        logout: 'writable',
        loadStats: 'writable',
        escapeHtml: 'writable',
        API_URL: 'writable',
      },
    },
    rules: {
      'no-redeclare': 'off',
      'no-unused-vars': ['warn', { vars: 'local' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
];