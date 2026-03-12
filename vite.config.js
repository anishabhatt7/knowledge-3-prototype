import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import lwc from 'vite-plugin-lwc';
import {
  resolveIconTemplatesPlugin,
  iconTemplateExcludeDirs,
  iconTemplateAliases,
} from './vite-plugins/icon-templates.js';
import { salesforceStubsPlugin } from './vite-plugins/salesforce-stubs.js';

const lightningBasePath = path.resolve(
  './node_modules/lightning-base-components/src/lightning'
);
const lightningAliases = {};
if (fs.existsSync(lightningBasePath)) {
  for (const entry of fs.readdirSync(lightningBasePath, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const name = entry.name;
      const jsPath = path.join(lightningBasePath, name, `${name}.js`);
      if (fs.existsSync(jsPath)) {
        lightningAliases[`lightning/${name}`] = path.resolve(jsPath);
      }
    }
  }
}

const shimPath = (file) => path.resolve('./src/shim', file);

export default defineConfig({
  plugins: [
    salesforceStubsPlugin(),
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
  optimizeDeps: {
    // Only pre-bundle these; lightning-base-components is excluded because it imports .html
    // (LWC templates) and esbuild has no HTML loader. It is resolved in the main build instead.
    noDiscovery: true,
    include: ['lwc', '@lwc/synthetic-shadow', '@salesforce-ux/design-system'],
  },
  resolve: {
    alias: {
      '@salesforce-ux/design-system': path.resolve('./node_modules/@salesforce-ux/design-system'),
      ...lightningAliases,
      'lightning/features': shimPath('features.js'),
      ...iconTemplateAliases,
    },
  },
});
