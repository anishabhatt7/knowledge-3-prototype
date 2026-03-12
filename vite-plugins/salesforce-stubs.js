/**
 * Vite plugin: resolve all @salesforce/* imports to local stubs when running outside Salesforce.
 * Avoids adding a separate alias for every @salesforce/label/* and @salesforce/i18n/* specifier.
 */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const shim = (file) => path.join(projectRoot, 'src/shim/salesforce', file);

const STUBS = {
  label: shim('label.js'),
  accessCheck: shim('accessCheck.js'),
  client: shim('client-formFactor.js'),
  i18nLocale: shim('i18n-locale.js'),
  i18nDir: shim('i18n-dir.js'),
  i18nDefault: shim('i18n-default.js'),
  gate: shim('gate.js'),
};

function resolveSalesforceId(id) {
  if (!id.startsWith('@salesforce/')) return null;
  if (id.startsWith('@salesforce/label/')) return STUBS.label;
  if (id.startsWith('@salesforce/accessCheck/')) return STUBS.accessCheck;
  if (id.startsWith('@salesforce/client/')) return STUBS.client;
  if (id.startsWith('@salesforce/gate/')) return STUBS.gate;
  if (id.startsWith('@salesforce/i18n/')) {
    if (id === '@salesforce/i18n/locale') return STUBS.i18nLocale;
    if (id === '@salesforce/i18n/dir') return STUBS.i18nDir;
    return STUBS.i18nDefault;
  }
  return null;
}

export function salesforceStubsPlugin() {
  return {
    name: 'salesforce-stubs',
    enforce: 'pre',
    resolveId(id) {
      return resolveSalesforceId(id);
    },
  };
}
