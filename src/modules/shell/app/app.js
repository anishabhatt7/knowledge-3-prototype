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
import { setDraftSession } from 'data/draftSession';
import { initialArticle } from 'data/knowledge';

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
    @track selectedFlow = 'v2';
    @track prototypeDropdownOpen = false;
    // The workspace tab strip carries at most one dynamic article tab at
    // a time. It starts empty — when the user opens an article (from the
    // Knowledge Base list view, Command Center, Healing Graph, etc.) a
    // single tab appears and is highlighted as the current page; opening
    // a different article replaces that tab; closing it makes the tab
    // disappear entirely. `originPath` records where the article was
    // opened from so the close action returns the user there.
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
        return match ? match.label : 'V2 - AI ready Knowledge';
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

    // Resolves the route's pattern (`/knowledge-record/:id`) against
    // the live params so we can compare it to the concrete `path` stored
    // on a workspace tab. Without this the parametric article route
    // never matches its tab and the tab fails to highlight.
    get _currentLogicalPath() {
        const route = this.route;
        if (!route) return '/';
        let path = route.path || '/';
        const params = route.params || {};
        for (const key of Object.keys(params)) {
            path = path.replace(`:${key}`, encodeURIComponent(params[key]));
        }
        return path;
    }

    get currentNavPage() {
        if (!this.route) return 'knowledge';
        const livePath = this._currentLogicalPath;
        const matching = this._workspaceTabs.filter((t) => t.path === livePath);
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
            // When the user leaves an article view by any means other
            // than the close button (clicking another nav item, hitting
            // the back button, following an in-page link, etc.) drop the
            // article tab so the context bar returns to its empty state.
            const pattern = route?.path;
            if (pattern && !pattern.startsWith('/knowledge-record/') && this._workspaceTabs.length) {
                const livePath = this._currentLogicalPath;
                const stillMatches = this._workspaceTabs.some((t) => t.path === livePath);
                if (!stillMatches) this._workspaceTabs = [];
            }
        });
        this._docClickHandler = (e) => {
            const switcher = this.querySelector('.prototype-switcher');
            if (switcher && !switcher.contains(e.target)) {
                this.prototypeDropdownOpen = false;
            }
        };
        document.addEventListener('click', this._docClickHandler);

        this._workspaceTabHandler = (e) => {
            const { label, path, kind = 'record', originPath: explicitOrigin } = e.detail || {};
            if (!label || !path) return;
            // Reopening the exact same path is always a no-op. Otherwise
            // the behaviour depends on `kind`:
            //   kind === 'record' (default) — record tabs are mutually
            //       exclusive with each other (mirrors the prior single-
            //       tab pattern). Opening a different record replaces
            //       the prior record tab but keeps any editor tab open.
            //   kind === 'editor' — appended alongside existing tabs so
            //       the user can flip between the source record and the
            //       active authoring experience opened from it.
            // `originPath` controls where the close action returns the
            // user. Callers (e.g. the v2 landing seed) can pass an
            // explicit value to break out of the default "go back to
            // where I came from" rule — the landing seed for example
            // sends close → /command-center even though it was fired
            // from /.
            const existingByPath = this._workspaceTabs.find((t) => t.path === path);
            if (existingByPath) return;
            const page = `tab-${kind}-${Date.now()}`;
            const currentPath = this._currentLogicalPath;
            const derivedOrigin = currentPath.startsWith('/knowledge-record/')
                ? '/knowledge-base'
                : currentPath;
            const originPath = explicitOrigin || derivedOrigin;
            const newTab = {
                page,
                label,
                path,
                href: linkHref(path),
                closable: true,
                originPath,
                kind,
            };
            if (kind === 'editor') {
                this._workspaceTabs = [...this._workspaceTabs, newTab];
            } else {
                const nonRecord = this._workspaceTabs.filter((t) => t.kind !== 'record');
                this._workspaceTabs = [...nonRecord, newTab];
            }
        };
        window.addEventListener('workspace:addtab', this._workspaceTabHandler);

        this._workspaceCloseHandler = (e) => {
            const page = e.detail?.page;
            if (!page) return;
            const wasActive = this.currentNavPage === page;
            // Capture the tab BEFORE removing it so we can route back to
            // the path the user came from. `originPath` was stamped when
            // the tab was added (or seeded for the default landing tab);
            // missing values fall back to `/`.
            const closingTab = this._workspaceTabs.find((t) => t.page === page);
            this._workspaceTabs = this._workspaceTabs.filter((t) => t.page !== page);
            if (wasActive) navigate(closingTab?.originPath || '/');
        };
        window.addEventListener('workspace:closetab', this._workspaceCloseHandler);

        // Default landing for the v2 ("Prototype experience") prototype:
        // mirror the Command Center → Review Draft hand-off so the user
        // arrives directly in the active article authoring experience
        // with a workspace tab in the context bar. Closing that tab
        // returns the user to /command-center (overriding the usual
        // "close goes back to where I came from" rule by passing an
        // explicit originPath into the addtab event).
        if (!this._didLandingSetup) {
            this._didLandingSetup = true;
            const livePath = this._currentLogicalPath;
            if (livePath === '/' || livePath === '') {
                const title = initialArticle?.title || 'New Knowledge Article';
                setDraftSession({ title });
                window.dispatchEvent(
                    new CustomEvent('workspace:addtab', {
                        detail: {
                            label: title,
                            path: '/new-knowledge',
                            kind: 'editor',
                            originPath: '/command-center',
                        },
                    })
                );
                navigate('/new-knowledge');
            }
        }
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
