import { createElement } from 'lwc';
import HealthDashboard from 'page/healthDashboard';
import { initSldsFromStorage, activeSldsLink } from './build/slds-loader.js';

await initSldsFromStorage();

// Inject global stylesheet after SLDS using new URL() to bypass LWC plugin.
const globalCssUrl = new URL('./styles/global.css', import.meta.url).href;
const globalLink = document.createElement('link');
globalLink.rel = 'stylesheet';
globalLink.href = globalCssUrl;
document.head.appendChild(globalLink);

// Create and mount the standalone dashboard component
try {
    const dashboard = createElement('page-health-dashboard', {
        is: HealthDashboard
    });
    document.querySelector('#app').appendChild(dashboard);
} catch (err) {
    console.error('[LWC dashboard bootstrap] Failed to mount dashboard:', err);
}

// Reveal the app once the active SLDS stylesheet has loaded.
const link = activeSldsLink();
if (link && !link.sheet) {
    await new Promise((r) => { link.addEventListener('load', r, { once: true }); });
}
const loading = document.getElementById('app-loading');
if (loading) loading.remove();
document.getElementById('app')?.classList.add('is-ready');

// Preload icon template modules so they're likely ready when the first icons render.
Promise.all([
    import('lightning/iconSvgTemplatesUtility'),
    import('lightning/iconSvgTemplatesStandard'),
    import('lightning/iconSvgTemplatesDoctype'),
    import('lightning/iconSvgTemplatesAction'),
]).catch(() => {});
