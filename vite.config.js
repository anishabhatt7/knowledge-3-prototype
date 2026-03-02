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
          npm: 'lightning-base-components'
        }
      ],
      // Enable synthetic shadow (like Salesforce platform)
      // false = use synthetic shadow, true = use native shadow
      disableSyntheticShadowSupport: false
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