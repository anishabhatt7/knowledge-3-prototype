/**
 * Dynamically injects stylesheets to bypass Vite/LWC CSS processing.
 *
 * LWC's CSS transformer rejects selectors like :root, so any stylesheet that
 * uses them (slds-plus, SLDS itself) must be loaded at runtime via <link> tags
 * rather than through ES module imports.
 *
 * @param {Object} [options]
 * @param {boolean} [options.slds1=false] - Also load the SLDS 1 stylesheet
 *   (/slds/styles/salesforce-lightning-design-system.min.css) alongside slds-plus.
 */
export function loadSLDS({ slds1 = false } = {}) {
    injectLink('/css/slds-plus.css', 'slds-plus');

    if (slds1) {
        injectLink('/slds/styles/salesforce-lightning-design-system.min.css', 'salesforce-lightning-design-system');
    }

    if (!document.body.classList.contains('slds-scope')) {
        document.body.classList.add('slds-scope');
    }
}

function injectLink(href, key) {
    if (!document.querySelector(`link[data-slds="${key}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.slds = key;
        document.head.appendChild(link);
    }
}
