/**
 * SLDS stylesheets are loaded as static <link> tags in index.html to avoid FOUC.
 * The active sheet is toggled via the media attribute:
 *   - media="" / "all"  → applied
 *   - media="not all"   → fetched but not applied
 *
 * LWC's CSS transformer rejects :root selectors, so SLDS cannot be imported
 * as an ES module — <link> tag injection is required.
 */

const SLDS2_KEY = 'slds-plus';
const SLDS1_KEY = 'salesforce-lightning-design-system';

function getLink(key) {
    return document.querySelector(`link[data-slds="${key}"]`);
}

export function activateSLDS2() {
    const slds2 = getLink(SLDS2_KEY);
    const slds1 = getLink(SLDS1_KEY);
    if (slds2) slds2.media = 'all';
    if (slds1) slds1.media = 'not all';
}

export function activateSLDS1() {
    const slds2 = getLink(SLDS2_KEY);
    const slds1 = getLink(SLDS1_KEY);
    if (slds2) slds2.media = 'not all';
    if (slds1) slds1.media = 'all';
}

export function toggleSLDS() {
    const slds2 = getLink(SLDS2_KEY);
    if (!slds2) return;
    const usingSlds2 = slds2.media !== 'not all';
    if (usingSlds2) {
        activateSLDS1();
    } else {
        activateSLDS2();
    }
}

export function activeSLDSVersion() {
    const slds2 = getLink(SLDS2_KEY);
    return slds2 && slds2.media !== 'not all' ? 2 : 1;
}
