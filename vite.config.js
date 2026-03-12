import { defineConfig } from 'vite';
import path from 'path';
import lwc from 'vite-plugin-lwc';
import {
  resolveIconTemplatesPlugin,
  iconTemplateExcludeDirs,
  iconTemplateAliases,
} from './vite-plugins/icon-templates.js';

export default defineConfig({
  plugins: [
    resolveIconTemplatesPlugin(),
    lwc({
      modules: [
        {
          dir: path.resolve('./src/modules'),
        },
        {
          name: '@salesforce/gate/bc.260.enableComboboxElementInternals',
          path: path.resolve('./src/shim/gateComboboxElementInternalsClosed.js'),
        },
        {
          npm: 'lightning-base-components',
        },
      ],
      disableSyntheticShadowSupport: false,
      enableDynamicComponents: true,
      exclude: [
        path.resolve('./index.html'),
        path.resolve('./src/generated'),
        ...iconTemplateExcludeDirs,
      ],
    }),
  ],
  appType: 'spa',
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      '@salesforce-ux/design-system': path.resolve('./node_modules/@salesforce-ux/design-system'),
      ...iconTemplateAliases,
    },
  },
});
