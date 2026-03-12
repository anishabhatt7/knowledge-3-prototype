/**
 * Stub for lightning/features when running outside Salesforce (e.g. Vite dev).
 * Avoids pulling in 60+ @salesforce/gate/* modules. All feature flags resolve to false.
 */
const features = new Proxy(Object.create(null), {
  get(_, prop) {
    return false;
  },
});

function setFeatureForTest() {
  // No-op for local dev.
}

export { features, setFeatureForTest };
