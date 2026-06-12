import { LightningElement, track } from 'lwc';
import { subscribe, navigate, linkHref } from '../../../router';
import { routes } from '../../../routes.config';
import { toggleSLDS, activeSLDSVersion } from '../../../build/slds-loader';
import ReviewArticle from 'page/reviewArticle';
import KnowledgeHome from 'page/knowledgeHome';
import HealingGraph from 'page/healingGraph';
import KnowledgeBase from 'page/knowledgeBase';
import KnowledgeRecord from 'page/knowledgeRecord';
import CommandCenter from 'page/commandCenter';
import KnowledgeAgents from 'page/knowledgeAgents';
import KnowledgeBlocks from 'page/knowledgeBlocks';
import QualityIssues from 'page/qualityIssues';
import ReviewQueue from 'page/reviewQueue';

/** Option A: explicit registration – add one import + one entry here when adding a route */
const ROUTE_COMPONENTS = {
    'page-review-article': ReviewArticle,
    'page-knowledge-home': KnowledgeHome,
    'page-healing-graph': HealingGraph,
    'page-knowledge-base': KnowledgeBase,
    'page-knowledge-record': KnowledgeRecord,
    'page-command-center': CommandCenter,
    'page-knowledge-agents': KnowledgeAgents,
    'page-knowledge-blocks': KnowledgeBlocks,
    'page-quality-issues': QualityIssues,
    'page-review-queue': ReviewQueue,
};

/** Derived from routes.config: component name → nav page id (includes navHighlight for child routes) */
const ROUTE_TO_NAV_PAGE = Object.fromEntries(
    routes.filter((r) => r.navPage || r.navHighlight).map((r) => [r.component, r.navPage ?? r.navHighlight])
);

/** Derived from routes.config: nav page id → path for navigate() */
const NAV_PAGE_TO_PATH = Object.fromEntries(
    routes.filter((r) => r.navPage).map((r) => [r.navPage, r.navPath ?? r.path])
);

/** Nav items for global navigation (tabs + waffle). From routes with navPage. */
const NAV_ITEMS = routes.filter((r) => r.navPage).map((r) => {
    const path = r.navPath ?? r.path;
    return { page: r.navPage, label: r.navLabel, path, href: linkHref(path) };
});

const STORAGE_KEY_SLDS_VERSION = 'slds-ui-slds-version';
const STORAGE_KEY_DARK_MODE = 'slds-ui-dark-mode';

export default class App extends LightningElement {
    static renderMode = 'light';

    @track route;
    @track _sldsVersion = 2;
    @track _darkMode = false;
    @track selectedFlow = 'v1';
    @track prototypeDropdownOpen = false;
    @track _workspaceTabs = [];
    _docClickHandler = null;
    _workspaceTabHandler = null;

    get prototypeOptions() {
        return [
            { label: 'V1 - Knowledge 3.0', value: 'v1' },
            { label: 'V2 - AI ready Knowledge', value: 'v2' },
            { label: "PM's version - AI Ready Knowledge", value: 'pm' },
        ].map((opt) => ({
            ...opt,
            isSelected: opt.value === this.selectedFlow,
            optionClass: `ps-option${opt.value === this.selectedFlow ? ' ps-option--selected' : ''}`,
        }));
    }

    get selectedFlowLabel() {
        const match = this.prototypeOptions.find((o) => o.value === this.selectedFlow);
        return match ? match.label : 'V1 - Knowledge 3.0';
    }

    handleTogglePrototypeDropdown(event) {
        event.stopPropagation();
        this.prototypeDropdownOpen = !this.prototypeDropdownOpen;
    }

    handleFlowSelect(event) {
        event.stopPropagation();
        const newValue = event.currentTarget.dataset.value;
        this.prototypeDropdownOpen = false;
        if (newValue === this.selectedFlow) return;
        const host = typeof window !== 'undefined' ? window.location.hostname : '';
        const isLocal = /^(localhost|127\.0\.0\.1)$/.test(host);
        const isGithubPages = host === 'anishabhatt7.github.io';
        let urls;
        if (isLocal) {
            urls = {
                v1: 'http://localhost:5001/',
                v2: 'http://localhost:8001/',
                pm: 'http://localhost:3000/',
            };
        } else if (isGithubPages) {
            urls = {
                v1: 'https://anishabhatt7.github.io/knowledge-3-prototype/v1/',
                v2: 'https://anishabhatt7.github.io/knowledge-3-prototype/v2/',
                pm: 'https://anishabhatt7.github.io/knowledge-3-prototype/pm/',
            };
        } else {
            urls = {
                v1: 'https://git.soma.salesforce.com/pages/anisha-bhatt/knowledge-3-prototype/v1/',
                v2: 'https://git.soma.salesforce.com/pages/anisha-bhatt/knowledge-3-prototype/v2/',
                pm: 'https://git.soma.salesforce.com/pages/anisha-bhatt/knowledge-3-prototype/pm/',
            };
        }
        if (urls[newValue]) {
            window.location.href = urls[newValue];
        }
    }

    get componentCtor() {
        const name = this.route?.component;
        return name ? ROUTE_COMPONENTS[name] ?? null : null;
    }

    get currentNavPage() {
        if (!this.route) return 'knowledge';
        // `route.path` is the (possibly parametric) template; rebuild the
        // concrete path with the route params so workspace tabs opened on
        // routes like `/knowledge-record/:id` match and show as active.
        const params = this.route.params || {};
        const concretePath = this.route.path
            ? this.route.path.replace(/:([^/]+)/g, (_m, k) => encodeURIComponent(params[k] ?? ''))
            : this.route.path;
        const matching = this._workspaceTabs.filter((t) => t.path === concretePath);
        if (matching.length) return matching[matching.length - 1].page;
        return this.route.navPage ?? this.route.navHighlight ?? ROUTE_TO_NAV_PAGE[this.route.component] ?? 'knowledge';
    }

    get navItems() {
        const main = NAV_ITEMS.filter((i) => i.page !== 'more');
        const more = NAV_ITEMS.filter((i) => i.page === 'more');
        return [...main, ...this._workspaceTabs, ...more];
    }

    connectedCallback() {
        this._restorePreferences();
        this._sldsVersion = activeSLDSVersion();
        this.unsubscribe = subscribe((route) => {
            this.route = route;
        });
        this._docClickHandler = (e) => {
            const switcher = this.querySelector('.prototype-switcher');
            if (switcher && !switcher.contains(e.target)) {
                this.prototypeDropdownOpen = false;
            }
        };
        document.addEventListener('click', this._docClickHandler);

        this._workspaceTabHandler = (e) => {
            const { label, path, originPath } = e.detail || {};
            if (!label || !path) return;
            const existing = this._workspaceTabs.find((t) => t.label === label);
            if (!existing) {
                const page = `article-${Date.now()}`;
                this._workspaceTabs = [
                    ...this._workspaceTabs,
                    { page, label, path, originPath, href: linkHref(path), closable: true },
                ];
            }
        };
        window.addEventListener('workspace:addtab', this._workspaceTabHandler);

        this._workspaceCloseHandler = (e) => {
            const page = e.detail?.page;
            if (!page) return;
            const closing = this._workspaceTabs.find((t) => t.page === page);
            // `this.route.path` is the (possibly parametric) template, so
            // rebuild the concrete path with the route params to reliably
            // tell whether the tab being closed is the one on screen — a
            // plain `currentNavPage` check misses `/knowledge-record/:id`
            // style tabs.
            const params = this.route?.params || {};
            const concretePath = this.route?.path
                ? this.route.path.replace(/:([^/]+)/g, (_m, k) =>
                    encodeURIComponent(params[k] ?? ''))
                : null;
            const wasActive = closing && concretePath === closing.path;
            this._workspaceTabs = this._workspaceTabs.filter((t) => t.page !== page);
            // Return to the tab's origin (e.g. Knowledge Health for record
            // tabs opened from the Active Quality Issue links); fall back to
            // the Knowledge home when no origin was stamped.
            if (wasActive) navigate(closing?.originPath || '/');
        };
        window.addEventListener('workspace:closetab', this._workspaceCloseHandler);
    }

    _restorePreferences() {
        const savedVersion = localStorage.getItem(STORAGE_KEY_SLDS_VERSION);
        const savedDarkMode = localStorage.getItem(STORAGE_KEY_DARK_MODE);
        const version = savedVersion === '1' ? 1 : 2;
        if (savedDarkMode === 'true' && version === 2) {
            this._darkMode = true;
            document.body.classList.add('slds-color-scheme_dark');
        } else if (savedDarkMode === 'false') {
            this._darkMode = false;
            document.body.classList.remove('slds-color-scheme_dark');
        }
    }

    disconnectedCallback() {
        this.unsubscribe?.();
        if (this._docClickHandler) {
            document.removeEventListener('click', this._docClickHandler);
        }
        if (this._workspaceTabHandler) {
            window.removeEventListener('workspace:addtab', this._workspaceTabHandler);
        }
        if (this._workspaceCloseHandler) {
            window.removeEventListener('workspace:closetab', this._workspaceCloseHandler);
        }
    }

    async handleToggleSLDS() {
        await toggleSLDS();
        this._sldsVersion = activeSLDSVersion();
        localStorage.setItem(STORAGE_KEY_SLDS_VERSION, String(this._sldsVersion));
        if (this._sldsVersion !== 2 && this._darkMode) {
            this._darkMode = false;
            document.body.classList.remove('slds-color-scheme_dark');
            localStorage.setItem(STORAGE_KEY_DARK_MODE, 'false');
        }
    }

    handleToggleDarkMode() {
        this._darkMode = !this._darkMode;
        document.body.classList.toggle('slds-color-scheme_dark', this._darkMode);
        localStorage.setItem(STORAGE_KEY_DARK_MODE, String(this._darkMode));
    }

    handleNavNavigate(event) {
        const page = event.detail?.page;
        const dynamicTab = this._workspaceTabs.find((t) => t.page === page);
        const path = dynamicTab ? dynamicTab.path : (page ? NAV_PAGE_TO_PATH[page] : '/');
        if (path) navigate(path);
    }


    handleNavigateBack() {
        history.back();
    }
}
