import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'GitHub Helper',
    description: 'GitHub trending and hot repositories discovery tool',
    version: '1.1.0',
    permissions: ['storage'],
    host_permissions: [
      'https://github.com/*',
      'https://api.github.com/*',
      'http://localhost:*/*',
      'https://generativelanguage.googleapis.com/*',
    ],
    commands: {
      toggle_sidebar: {
        suggested_key: {
          default: 'Ctrl+Shift+G',
          mac: 'Command+Shift+G',
        },
        description: 'Toggle GitHub Helper sidebar',
      },
    },
  },
});
