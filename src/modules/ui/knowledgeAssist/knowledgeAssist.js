import { LightningElement, api, track } from 'lwc';
import { gsap } from 'gsap';

/**
 * Left panel — Knowledge Assist.
 *
 * Renders two visual states driven by the @api `collapsed` flag:
 *  - Expanded (Figma 1:131481): 44px icon rail + nested analytics card
 *    (health donut, contact reason, Smart Suggests).
 *  - Collapsed (Figma 1:92800): same 40px icon rail (Analytics /
 *    Sources mapping / Table of contents), inside a 56px
 *    `rounded-16` white shell. The analytics card is hidden via CSS
 *    (`.ka-panel_collapsed .ka-card { display: none }`) so the rail
 *    stays as the only visible content.
 *
 * Props:  @api health, @api suggests, @api collapsed
 * Events: close, expand, updateall, applysuggestion
 *
 * In collapsed mode the rail acts as an "expand" affordance: clicking
 * any rail button fires `expand` with the tab id so the parent can
 * widen the aside and set the active tab.
 *
 * Tab-switch motion (expanded state):
 *  1. The `.ka-rail__indicator` pill slides from the old tab's button
 *     to the new one on an `expo.out` ease (~0.42s) — JS animates
 *     `top:` only so the tween stays compositor-friendly.
 *  2. The outgoing tab's body fades up and out briefly (~0.14s).
 *  3. `activeRailTab` flips inside the outgoing tween's `onComplete`.
 *  4. The new tab's body fades in with a tiny stagger (~0.32s), and
 *     the newly active rail button does a `back.out` scale pop (~0.45s).
 * All four motions short-circuit to instant swaps when `_gsapEnabled`
 * is false (driven by the `gsap:toggle` reduced-motion event).
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
    /**
     * When true, the panel renders in the wider "expanded" state from
     * Figma 140:26133/140:26134 — same content, larger real estate so
     * reviewers can read suggestion cards without ellipsis and act on
     * them in a single column. Width is owned by the parent shell via
     * --ra-left-col; this prop only flips the panel's chrome to match.
     */
    @api expanded = false;
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

    // Rail-indicator + tab-switch animation bookkeeping. The indicator
    // is a single absolutely-positioned pill in the rail that GSAP
    // slides between active button positions. Section content cross-
    // fades by first animating the outgoing section out, swapping
    // `activeRailTab` in `onComplete`, then animating the incoming
    // section back in from `renderedCallback`. The newly active rail
    // button gets a small `back.out` scale pop for click feedback.
    _railIndicatorTween = null;
    _outgoingTween = null;
    _pendingInAnimation = false;
    _pendingButtonPopId = null;

    connectedCallback() {
        this._boundGsapToggle = (e) => {
            this._gsapEnabled = e.detail?.enabled !== false;
        };
        window.addEventListener('gsap:toggle', this._boundGsapToggle);
    }

    get isCollapsed() {
        return this.collapsed === true || this.collapsed === 'true';
    }

    get isExpanded() {
        // Expanded only applies in the default (non-collapsed) state — a
        // collapsed rail can't simultaneously be "expanded wider".
        return !this.isCollapsed && (this.expanded === true || this.expanded === 'true');
    }

    get panelClass() {
        let cls = 'ka-panel';
        if (this.isCollapsed) cls += ' ka-panel_collapsed';
        else if (this.isExpanded) cls += ' ka-panel_expanded';
        return cls;
    }

    // Expand/contract toggle in the panel header — swaps icon + label
    // based on the current width state so the affordance matches the
    // action it will perform on click.
    get expandToggleIcon() {
        return this.isExpanded ? 'utility:contract_alt' : 'utility:expand_alt';
    }

    get expandToggleLabel() {
        return this.isExpanded ? 'Collapse Knowledge Assist panel' : 'Expand Knowledge Assist panel';
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

    // Only show the sliding indicator pill while the rail is expanded.
    // The collapsed layout paints every button instead, so a single
    // moving highlight would look out of place there.
    get showRailIndicator() {
        return !this.isCollapsed;
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

    // Map an RAG/AI score (0–100) to a CSS color band:
    //  - <50  → red    (#ba0517)  Poor
    //  - 50–74→ amber  (#fe9339)  Fair
    //  - ≥75  → green  (#2e844a)  Healthy
    // Returned as a CSS color string so the conic-gradient inline style
    // and the gsap onUpdate callback both share the same rule of thumb.
    get ringColor() {
        const score = this.health?.score ?? 0;
        if (score < 50) return '#ba0517';
        if (score < 75) return '#fe9339';
        return '#2e844a';
    }

    get ringTrackColor() {
        const score = this.health?.score ?? 0;
        if (score < 50) return '#fde7e9';
        if (score < 75) return '#fef1e1';
        return '#d6e6ff';
    }

    get progressStyle() {
        const color = this.ringColor;
        const track = this.ringTrackColor;
        if (!this._ringAnimated) {
            return `background: conic-gradient(${color} 0deg 0deg, ${track} 0deg 360deg);`;
        }
        const deg = Math.round(this._animProxy.deg);
        return `background: conic-gradient(${color} 0deg ${deg}deg, ${track} ${deg}deg 360deg);`;
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

    // "Overall Performance" label/badge per Figma 125:67812. Defaults
    // map score → label/variant when the data model omits an explicit
    // override (older fixtures), so the panel always renders a badge.
    get performanceLabel() {
        if (this.health?.performanceLabel) return this.health.performanceLabel;
        const score = this.health?.score ?? 0;
        if (score < 50) return 'Poor Score';
        if (score < 75) return 'Fair Score';
        return 'Healthy';
    }

    get performanceBadgeClass() {
        const variant = this.health?.performanceVariant
            || ((this.health?.score ?? 0) < 50 ? 'error'
                : (this.health?.score ?? 0) < 75 ? 'warning' : 'success');
        return `ka-perf-badge ka-perf-badge_${variant}`;
    }

    get performanceIcon() {
        const variant = this.health?.performanceVariant
            || ((this.health?.score ?? 0) < 50 ? 'error'
                : (this.health?.score ?? 0) < 75 ? 'warning' : 'success');
        if (variant === 'error') return 'utility:warning';
        if (variant === 'warning') return 'utility:warning';
        return 'utility:success';
    }

    get suggestCards() {
        return (this.suggests || []).map((s) => ({
            ...s,
            // `scoreDelta` is the new Figma-aligned field; fall back to
            // `coverageDelta` to keep older fixtures rendering.
            scoreLabel: `+${s.scoreDelta ?? s.coverageDelta ?? 0}%`,
            coverageLabel: `+${s.coverageDelta ?? 0}%`,
            confidenceLabel: `+${s.confidenceDelta ?? 0}%`,
            isUpdated: s.status === 'updated',
            isApplied: s.status === 'applied',
            isAvailable: s.status === 'available',
            showBadge: Boolean(s.badge),
        }));
    }

    renderedCallback() {
        // ─── Rail indicator + tab-switch animations ────────────────
        // These run regardless of which tab is active. The indicator
        // snap is gated on `_railIndicatorTween` so the sliding tween
        // from handleRailClick owns the pill during a transition; on
        // incidental re-renders we just confirm the position (a no-op
        // visually). The in-tween and button-pop are pending-flag
        // driven so they only fire once per tab switch.
        if (!this.isCollapsed) {
            if (!this._railIndicatorTween) {
                this._moveIndicatorToTab(this.activeRailTab, { animate: false });
            }

            if (this._pendingInAnimation) {
                this._pendingInAnimation = false;
                this._runSectionInTween();
            }

            if (this._pendingButtonPopId) {
                const popId = this._pendingButtonPopId;
                this._pendingButtonPopId = null;
                this._popRailButton(popId);
            }
        }

        // ─── Score-ring animation ──────────────────────────────────
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

        const ringColor = this.ringColor;
        const trackColor = this.ringTrackColor;

        if (!this._gsapEnabled) {
            this._animProxy.deg = targetDeg;
            this._animProxy.pct = targetPct;
            ring.style.background = `conic-gradient(${ringColor} 0deg ${targetDeg}deg, ${trackColor} ${targetDeg}deg 360deg)`;
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
                ring.style.background = `conic-gradient(${ringColor} 0deg ${d}deg, ${trackColor} ${d}deg 360deg)`;
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
        if (this._railIndicatorTween) {
            this._railIndicatorTween.kill();
            this._railIndicatorTween = null;
        }
        if (this._outgoingTween) {
            this._outgoingTween.kill();
            this._outgoingTween = null;
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
        // With the header close button removed, the rail tabs double as the
        // close affordance: clicking the already-active tab folds the panel
        // back to its 56px rail (works from both default 379px and expanded
        // 600px states). Clicking a different tab still just swaps tabs.
        if (id === this.activeRailTab) {
            this.dispatchEvent(new CustomEvent('close'));
            return;
        }
        // Coordinated tab switch: indicator slides immediately so the
        // pill leads the content swap; the outgoing section briefly
        // fades up; then `activeRailTab` flips in onComplete and
        // renderedCallback animates the new section in and pops the
        // newly active button.
        this._moveIndicatorToTab(id, { animate: true });
        this._fadeOutAndSwap(id);
    }

    // ─── Tab-switch animation helpers ──────────────────────────────
    // Positions the indicator pill over the rail button for `tabId`.
    // When `animate` is false (initial render, reduced-motion, etc.)
    // we snap with `gsap.set`; otherwise we tween `top` for an iOS-
    // tabbar-like slide. The tween is tracked on `_railIndicatorTween`
    // so renderedCallback can avoid snapping while a slide is mid-flight.
    _moveIndicatorToTab(tabId, { animate } = { animate: false }) {
        const rail = this.querySelector('.ka-rail');
        const indicator = this.querySelector('.ka-rail__indicator');
        const btn = this.querySelector(`.ka-rail__btn[data-id="${tabId}"]`);
        if (!rail || !indicator || !btn) return;

        const railRect = rail.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        const targetTop = btnRect.top - railRect.top;

        if (this._railIndicatorTween) {
            this._railIndicatorTween.kill();
            this._railIndicatorTween = null;
        }

        if (!animate || !this._gsapEnabled) {
            gsap.set(indicator, { top: targetTop });
            return;
        }

        this._railIndicatorTween = gsap.to(indicator, {
            top: targetTop,
            duration: 0.42,
            ease: 'expo.out',
            onComplete: () => {
                this._railIndicatorTween = null;
            },
        });
    }

    // Fades the current tab's body content out, then commits the tab
    // switch. The in-tween is handled in renderedCallback after LWC
    // re-renders the swapped section(s).
    _fadeOutAndSwap(newTabId) {
        const targets = this._getCardBodyTargets();

        const commit = () => {
            this._outgoingTween = null;
            this._pendingInAnimation = true;
            this._pendingButtonPopId = newTabId;
            this.activeRailTab = newTabId;
        };

        if (!this._gsapEnabled || targets.length === 0) {
            commit();
            return;
        }

        if (this._outgoingTween) this._outgoingTween.kill();
        this._outgoingTween = gsap.to(targets, {
            opacity: 0,
            y: -6,
            duration: 0.14,
            ease: 'power2.in',
            onComplete: commit,
        });
    }

    _runSectionInTween() {
        const targets = this._getCardBodyTargets();
        if (!targets.length || !this._gsapEnabled) return;
        gsap.fromTo(
            targets,
            { opacity: 0, y: 8 },
            {
                opacity: 1,
                y: 0,
                duration: 0.32,
                ease: 'power2.out',
                stagger: 0.04,
                clearProps: 'transform',
            }
        );
    }

    _popRailButton(tabId) {
        const btn = this.querySelector(`.ka-rail__btn[data-id="${tabId}"]`);
        if (!btn || !this._gsapEnabled) return;
        gsap.fromTo(
            btn,
            { scale: 0.82 },
            {
                scale: 1,
                duration: 0.45,
                ease: 'back.out(2.4)',
                clearProps: 'transform',
            }
        );
    }

    // Animatable body children inside `.ka-card`: every `<section>`,
    // the divider `<hr>`, and the empty placeholder. The `<header>`
    // is excluded so the panel title stays anchored across switches.
    _getCardBodyTargets() {
        const card = this.querySelector('.ka-card');
        if (!card) return [];
        return Array.from(card.children).filter(
            (child) => !child.matches('header')
        );
    }

    // Fired when the user clicks the expand/contract toggle. The parent
    // shell owns the actual width tween — we just announce intent.
    handleToggleExpand() {
        this.dispatchEvent(new CustomEvent('togglewidth'));
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
