import { LightningElement, api, track } from 'lwc';
import { gsap } from 'gsap';

/**
 * Left panel — Knowledge Assist.
 *
 * Renders two visual states driven by the @api `collapsed` flag:
 *  - Expanded (Figma 1:131481): 44px icon rail + nested analytics card
 *    (health donut, contact reason, Smart Suggests).
 *  - Collapsed (Figma 1:92800): 40px icon rail only, inside a 56px
 *    `rounded-16` white shell. No analytics card is rendered.
 *
 * Props:  @api health, @api suggests, @api collapsed
 * Events: close, expand, updateall, applysuggestion
 *
 * In collapsed mode the rail acts as an "expand" affordance: clicking
 * any rail button fires `expand` with the tab id so the parent can
 * widen the aside and set the active tab.
 */
const RAIL_TABS = [
    { id: 'metrics', icon: 'utility:metrics', ariaLabel: 'Analytics' },
    { id: 'sources', icon: 'utility:mixed_sources_mapping', ariaLabel: 'Sources mapping' },
    { id: 'toc', icon: 'utility:rows', ariaLabel: 'Table of contents' },
];

// Cap visual indentation in the TOC tree at 4 levels (depth 0..3). Anything
// deeper renders at depth 3 — keeps the 281px panel readable when authors
// drill into very nested categories.
const MAX_TOC_DEPTH = 3;

export default class KnowledgeAssist extends LightningElement {
    static renderMode = 'light';

    @api health;
    @api suggests = [];
    @api collapsed = false;
    @api knowledgeBlocks = [];
    @api insertedBlockIds = [];
    @api tocTree = [];
    @api currentArticleId = null;

    @track activeRailTab = 'metrics';
    @track _blockSearch = '';
    @track _selectedBlockIndex = 0;
    @track _tocSearch = '';
    // Array of node ids whose children are currently expanded. `null` means
    // "uninitialized" — the first read of `flattenedToc` seeds this with the
    // ancestor path of `currentArticleId` so the selected article is visible
    // on first render.
    @track _tocExpanded = null;

    _ringAnimated = false;
    _animProxy = { deg: 0, pct: 0 };
    _ringTween = null;
    _gsapEnabled = true;
    _boundGsapToggle = null;

    connectedCallback() {
        this._boundGsapToggle = (e) => {
            this._gsapEnabled = e.detail?.enabled !== false;
        };
        window.addEventListener('gsap:toggle', this._boundGsapToggle);
    }

    get isCollapsed() {
        return this.collapsed === true || this.collapsed === 'true';
    }

    get panelClass() {
        return `ka-panel${this.isCollapsed ? ' ka-panel_collapsed' : ''}`;
    }

    get railTabs() {
        return RAIL_TABS.map((tab) => {
            const isActive = !this.isCollapsed && tab.id === this.activeRailTab;
            return {
                ...tab,
                btnClass: `ka-rail__btn${isActive ? ' ka-rail__btn_active' : ''}`,
            };
        });
    }

    get isMetricsTab() {
        return this.activeRailTab === 'metrics';
    }

    get isSourcesTab() {
        return this.activeRailTab === 'sources';
    }

    get isTocTab() {
        return this.activeRailTab === 'toc';
    }

    get blockCountLabel() {
        const len = (this.knowledgeBlocks || []).length;
        return `${len} block${len !== 1 ? 's' : ''}`;
    }

    get filteredBlocks() {
        const all = this.knowledgeBlocks || [];
        const inserted = new Set(this.insertedBlockIds || []);
        const q = (this._blockSearch || '').toLowerCase();
        const filtered = q
            ? all.filter(
                  (kb) =>
                      kb.title.toLowerCase().includes(q) ||
                      (kb.description || '').toLowerCase().includes(q) ||
                      (kb.content || '').toLowerCase().includes(q)
              )
            : all;
        return filtered.map((kb) => ({
            ...kb,
            isInserted: inserted.has(kb.syncGroupId),
            isSuggested: kb.suggested === true,
        }));
    }

    get noBlockResults() {
        return this._blockSearch && this.filteredBlocks.length === 0;
    }

    // ─── Table of Contents ─────────────────────────────────────────
    // Walks the `tocTree` into a flat list of rows the template renders.
    // Each row carries its own depth-indent class, chevron icon, selected
    // state, and aria-expanded so the template can stay declarative.
    //
    // Search behaviour: when a query is present we collapse the hierarchy
    // and show every node whose title matches at depth 0 (no chevrons).
    // This mirrors the Sources tab's flat-filter pattern and avoids the
    // "ghost parent" problem where empty branches would otherwise render.
    get flattenedToc() {
        const tree = this.tocTree || [];
        const expandedSet = this._getExpandedSet(tree);
        const q = (this._tocSearch || '').toLowerCase().trim();
        const out = [];

        const buildRow = (node, depth, hasChildren, isExpanded) => {
            const cappedDepth = Math.min(depth, MAX_TOC_DEPTH);
            const isSelected = node.id === this.currentArticleId;
            const cls = ['ka-toc__row'];
            cls.push(`ka-toc__row_d${cappedDepth}`);
            if (isSelected) cls.push('ka-toc__row_selected');
            return {
                id: node.id,
                title: node.title,
                hasChildren,
                isLeaf: !hasChildren,
                isExpanded: hasChildren && isExpanded,
                isSelected,
                ariaExpanded: hasChildren ? String(isExpanded) : null,
                rowClass: cls.join(' '),
                chevronIcon: hasChildren
                    ? (isExpanded ? 'utility:chevrondown' : 'utility:chevronright')
                    : null,
            };
        };

        const walk = (nodes, depth) => {
            for (const node of nodes) {
                const children = node.children || [];
                const hasChildren = children.length > 0;
                const isExpanded = expandedSet.has(node.id);

                if (q) {
                    if (node.title.toLowerCase().includes(q)) {
                        out.push(buildRow(node, 0, false, false));
                    }
                    if (hasChildren) walk(children, depth + 1);
                } else {
                    out.push(buildRow(node, depth, hasChildren, isExpanded));
                    if (hasChildren && isExpanded) walk(children, depth + 1);
                }
            }
        };

        walk(tree, 0);
        return out;
    }

    get noTocResults() {
        return Boolean(this._tocSearch) && this.flattenedToc.length === 0;
    }

    // Lazily seed the expanded set with the ancestor path of the current
    // article so the selected leaf is visible on first render. Using a
    // Set (not @track) is fine because we always reassign `_tocExpanded`
    // through array reassignment when the user toggles a node.
    _getExpandedSet(tree) {
        if (this._tocExpanded !== null) {
            return new Set(this._tocExpanded);
        }
        const path = findAncestorPath(tree, this.currentArticleId);
        this._tocExpanded = path;
        return new Set(path);
    }

    get progressStyle() {
        if (!this._ringAnimated) {
            return `background: conic-gradient(#2e844a 0deg 0deg, var(--slds-g-color-brand-base-90, #d6e6ff) 0deg 360deg);`;
        }
        const deg = Math.round(this._animProxy.deg);
        return `background: conic-gradient(#2e844a 0deg ${deg}deg, var(--slds-g-color-brand-base-90, #d6e6ff) ${deg}deg 360deg);`;
    }

    get scoreLabel() {
        if (!this._ringAnimated) return '0%';
        return `${Math.round(this._animProxy.pct)}%`;
    }

    get deltaLabel() {
        const d = this.health?.delta ?? 0;
        return `+${d}%`;
    }

    get casesAvertedLabel() {
        return `${this.health?.casesAverted ?? 0} Cases`;
    }

    get contactReasonLabel() {
        return this.health?.contactReason?.label || 'Baggage allowance';
    }

    get reasonNote() {
        return this.health?.reasonNote || '';
    }

    get suggestCards() {
        return (this.suggests || []).map((s) => ({
            ...s,
            coverageLabel: `+${s.coverageDelta}%`,
            confidenceLabel: `+${s.confidenceDelta}%`,
            isUpdated: s.status === 'updated',
            isApplied: s.status === 'applied',
            isAvailable: s.status === 'available',
            showBadge: Boolean(s.badge),
        }));
    }

    renderedCallback() {
        if (this.isCollapsed || this.activeRailTab !== 'metrics') {
            this._ringAnimated = false;
            if (this._ringTween) {
                this._ringTween.kill();
                this._ringTween = null;
            }
            this._animProxy.deg = 0;
            this._animProxy.pct = 0;
            return;
        }

        const ring = this.querySelector('.ka-score__ring');
        if (!ring || this._ringTween) return;

        const targetPct = Math.max(0, Math.min(100, this.health?.score || 0));
        const targetDeg = Math.round((targetPct / 100) * 360);

        this._ringAnimated = true;

        if (!this._gsapEnabled) {
            this._animProxy.deg = targetDeg;
            this._animProxy.pct = targetPct;
            ring.style.background = `conic-gradient(#2e844a 0deg ${targetDeg}deg, var(--slds-g-color-brand-base-90, #d6e6ff) ${targetDeg}deg 360deg)`;
            const inner = ring.querySelector('.ka-score__inner');
            if (inner) inner.textContent = `${targetPct}%`;
            return;
        }

        this._animProxy.deg = 0;
        this._animProxy.pct = 0;

        const inner = ring.querySelector('.ka-score__inner');

        this._ringTween = gsap.to(this._animProxy, {
            deg: targetDeg,
            pct: targetPct,
            duration: 1.2,
            ease: 'power2.out',
            onUpdate: () => {
                const d = Math.round(this._animProxy.deg);
                ring.style.background = `conic-gradient(#2e844a 0deg ${d}deg, var(--slds-g-color-brand-base-90, #d6e6ff) ${d}deg 360deg)`;
                if (inner) inner.textContent = `${Math.round(this._animProxy.pct)}%`;
            },
            onComplete: () => {
                this._ringTween = null;
            },
        });
    }

    disconnectedCallback() {
        if (this._ringTween) {
            this._ringTween.kill();
            this._ringTween = null;
        }
        if (this._boundGsapToggle) {
            window.removeEventListener('gsap:toggle', this._boundGsapToggle);
            this._boundGsapToggle = null;
        }
    }

    handleRailClick(event) {
        const id = event.currentTarget.dataset.id;
        if (!id) return;
        if (this.isCollapsed) {
            // Collapsed rail acts as an expand affordance. The parent
            // controls width; we just announce intent and which tab
            // the user asked for.
            this.dispatchEvent(new CustomEvent('expand', { detail: { id } }));
            return;
        }
        this.activeRailTab = id;
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleUpdateAll() {
        this.dispatchEvent(new CustomEvent('updateall'));
    }

    handleApply(event) {
        const id = event.currentTarget.dataset.id;
        this.dispatchEvent(new CustomEvent('applysuggestion', { detail: { id } }));
    }

    // ─── Knowledge Block library (Sources tab) ────────────────────
    handleBlockSearch(event) {
        this._blockSearch = event.target.value;
        this._selectedBlockIndex = 0;
    }

    handleBlockSearchKeyDown(event) {
        const list = this.filteredBlocks;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this._selectedBlockIndex = Math.min(this._selectedBlockIndex + 1, list.length - 1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            this._selectedBlockIndex = Math.max(this._selectedBlockIndex - 1, 0);
        } else if (event.key === 'Enter' && list[this._selectedBlockIndex]) {
            event.preventDefault();
            this.dispatchEvent(
                new CustomEvent('insertblock', {
                    detail: { syncGroupId: list[this._selectedBlockIndex].syncGroupId },
                })
            );
        }
    }

    handleInsertBlockClick(event) {
        const syncGroupId = event.currentTarget.dataset.id;
        this.dispatchEvent(new CustomEvent('insertblock', { detail: { syncGroupId } }));
    }

    // ─── Table of Contents handlers ────────────────────────────────
    handleTocSearch(event) {
        this._tocSearch = event.target.value;
    }

    // A row click toggles expansion for branches and announces selection
    // for leaves. We reassign `_tocExpanded` rather than mutating it so
    // LWC reactivity picks up the change.
    handleTocRowClick(event) {
        const id = event.currentTarget.dataset.id;
        const hasChildren = event.currentTarget.dataset.hasChildren === 'true';
        if (!id) return;

        if (hasChildren) {
            const current = this._tocExpanded || [];
            const next = current.includes(id)
                ? current.filter((x) => x !== id)
                : [...current, id];
            this._tocExpanded = next;
            return;
        }

        this.dispatchEvent(
            new CustomEvent('selectarticle', { detail: { articleId: id } })
        );
    }
}

// Walks the tree depth-first looking for `targetId` and returns the list
// of ancestor ids (excluding the target itself). Used to default-expand
// the path to the currently open article so it's visible on first render.
function findAncestorPath(nodes, targetId) {
    if (!targetId || !Array.isArray(nodes)) return [];
    const visit = (list, trail) => {
        for (const node of list) {
            if (node.id === targetId) return trail;
            if (node.children && node.children.length) {
                const found = visit(node.children, [...trail, node.id]);
                if (found) return found;
            }
        }
        return null;
    };
    return visit(nodes, []) || [];
}
