import { defineConfig } from 'vite';
import lwc from 'vite-plugin-lwc';
import path from 'path';

export default defineConfig({
  plugins: [
    lwc({
      modules: [
        {
          dir: path.resolve('./src/modules')
        },
        {
          name: '@salesforce/gate/bc.260.enableComboboxElementInternals',
          path: path.resolve('./src/shim/gateComboboxElementInternalsClosed.js')
        },
        {
          npm: 'lightning-base-components'
        }
      ],
      // Enable synthetic shadow (like Salesforce platform)
      // false = use synthetic shadow, true = use native shadow
      disableSyntheticShadowSupport: false,
      exclude: [path.resolve('./index.html')]
    })
  ],
  appType: 'spa',
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      '@salesforce-ux/design-system': path.resolve('./node_modules/@salesforce-ux/design-system')
    }
  }
});