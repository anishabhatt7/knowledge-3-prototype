import { LightningElement, track } from 'lwc';
import * as d3 from 'd3';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { animate, stagger } from 'motion';

gsap.registerPlugin(ScrollToPlugin);
import { navigate } from '../../../router';
import { setDraftSession } from 'data/draftSession';
import { setRecord } from 'data/recordSession';
import {
    seedGraphNodes,
    seedGraphEdges,
    seedHealthDomains,
    seedContradictions,
    seedHealingActions,
    seedQualityIssues,
    buildDomainHealthSnapshot,
    buildSelfHealedIssues,
    CAPABILITY_COLORS,
    CAPABILITY_LABELS,
    SEVERITY_COLORS,
    HEALING_RING_COLORS,
    formatRelativeTime,
    edgeKey,
} from 'data/healingGraph';

export default class HealingGraph extends LightningElement {
    static renderMode = 'light';

    // ── Left rail state ─────────────────────────────────────────────
    @track _railExpanded = true;
    _railAnimating = false;

    _railTopItems = [
        { id: 'home', label: 'Home', icon: 'utility:home', active: false },
    ];

    railMaintain = [
        { id: 'command-center', label: 'Command Center', icon: 'utility:trending' },
        { id: 'healing-graph', label: 'Knowledge Health', icon: 'utility:graph', active: true },
        { id: 'knowledge-agents', label: 'Knowledge Agents', icon: 'utility:agent_astro' },
    ];

    railCreate = [
        { id: 'kb-base', label: 'Knowledge Base', icon: 'utility:knowledge_base' },
        { id: 'kb-blocks', label: 'Knowledge Blocks', icon: 'utility:process' },
    ];

    get railTopItems() {
        return this._railTopItems.map((item) => ({
            ...item,
            rowClass: item.active ? 'kh-rail__row kh-rail__row--active' : 'kh-rail__row',
        }));
    }

    get railMaintainComputed() {
        return this.railMaintain.map((item) => ({
            ...item,
            rowClass: item.active ? 'kh-rail__row kh-rail__row--active' : 'kh-rail__row',
        }));
    }

    get railClass() {
        return this._railExpanded ? 'kh-rail kh-rail--expanded' : 'kh-rail';
    }

    get collapseIconName() {
        return this._railExpanded ? 'utility:left' : 'utility:right';
    }

    get collapseAriaLabel() {
        return this._railExpanded ? 'Collapse navigation' : 'Expand navigation';
    }

    handleToggleRail() {
        if (this._railAnimating) return;
        const next = !this._railExpanded;
        const rail = this.querySelector('.kh-rail');
        if (!rail || !gsap) {
            this._railExpanded = next;
            return;
        }

        const COLLAPSED_W = 48;
        const EXPANDED_W = 267;
        const targetW = next ? EXPANDED_W : COLLAPSED_W;
        this._railAnimating = true;

        if (next) {
            this._railExpanded = true;
            requestAnimationFrame(() => {
                const labels = this.querySelectorAll('.kh-rail .kh-rail__label, .kh-rail .kh-rail__group-header');
                gsap.fromTo(
                    rail,
                    { width: COLLAPSED_W },
                    { width: targetW, duration: 0.32, ease: 'power2.out',
                      onComplete: () => { rail.style.width = ''; this._railAnimating = false; } }
                );
                gsap.fromTo(
                    labels,
                    { opacity: 0, x: -8 },
                    { opacity: 1, x: 0, duration: 0.28, ease: 'power2.out', delay: 0.08, stagger: 0.02 }
                );
            });
        } else {
            const labels = this.querySelectorAll('.kh-rail .kh-rail__label, .kh-rail .kh-rail__group-header');
            gsap.to(labels, {
                opacity: 0,
                x: -8,
                duration: 0.16,
                ease: 'power2.in',
            });
            gsap.to(rail, {
                width: targetW,
                duration: 0.32,
                ease: 'power2.in',
                delay: 0.04,
                onComplete: () => {
                    this._railExpanded = false;
                    rail.style.width = '';
                    this._railAnimating = false;
                },
            });
        }
    }

    handleRailNav(event) {
        const id = event.currentTarget?.dataset?.id;
        if (id === 'home') {
            navigate('/');
        } else if (id === 'knowledge-agents') {
            navigate('/knowledge-agents');
        } else if (id === 'kb-base') {
            navigate('/knowledge-base');
        } else if (id === 'command-center') {
            navigate('/command-center');
        } else if (id === 'kb-blocks') {
            navigate('/knowledge-blocks');
        }
    }

    // ── View toggle (dashboard default, graph optional) ─────────────
    @track _graphView = false;
    @track _domainHealth = [];

    // ── Dashboard "Active Quality Issue" filters + dismissals ───────
    @track _dashFilters = { domain: '', type: '', priority: '' };
    @track _ignoredIssueIds = [];
    _qualityIssues = seedQualityIssues;

    // ── Dashboard "Self-Healed Quality Issue" tree-grid ─────────────
    @track _selfHealed = [];
    @track _expandedHealedIds = [];
    @track _selectedHealedIds = [];
    @track _healedReviewOnly = false;

    // ── Graph state ─────────────────────────────────────────────────
    @track _activeFilters = [];
    @track _healingFilter = 'all';
    @track _hoveredNode = null;
    @track _hoveredInfo = null;
    @track _showFilters = false;
    @track _showHealthBar = true;
    @track _selectedElement = null;
    @track _expandedActions = [];
    @track _selectedDomain = null;

    _d3Inited = false;
    _simulation = null;
    _d3Sels = null;
    _nodes = seedGraphNodes;
    _edges = seedGraphEdges;
    _contradictions = seedContradictions;
    _healingActions = seedHealingActions;
    _healthDomains = seedHealthDomains;

    // Lookup maps built once
    _contradictionsByEdge = new Map();
    _healingActionsByEntity = new Map();
    _nodeIdsInContradictions = new Set();

    connectedCallback() {
        this._domainHealth = buildDomainHealthSnapshot();
        this._selfHealed = buildSelfHealedIssues();
        this._contradictions.forEach((c) => {
            this._contradictionsByEdge.set(edgeKey(c.entityA.id, c.entityB.id), c);
        });
        this._healingActions.forEach((a) => {
            const list = this._healingActionsByEntity.get(a.entityId) || [];
            list.push(a);
            this._healingActionsByEntity.set(a.entityId, list);
        });
        this._contradictions.filter((c) => c.status === 'open').forEach((c) => {
            this._nodeIdsInContradictions.add(c.entityA.id);
            this._nodeIdsInContradictions.add(c.entityB.id);
        });
    }

    renderedCallback() {
        if (this._graphView) {
            if (this._d3Inited) return;
            const svg = this.querySelector('.hg-svg');
            if (!svg) return;
            this._d3Inited = true;
            this._playEntranceAnimation();
            this._initGraph();
            return;
        }

        // Dashboard view — set up smooth scroll + entrance/progress motion
        // the first time the dashboard renders.
        if (this._dashInited) return;
        const dashboard = this.querySelector('.hg-dashboard');
        if (!dashboard) return;
        this._dashInited = true;
        this._setupDashboardMotion(dashboard);
    }

    _prefersReducedMotion() {
        return (
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        );
    }

    // ── Dashboard motion ─────────────────────────────────────────────
    // Native smooth scroll on the dashboard scroller (matches the other
    // pages), plus a GSAP-driven entrance: cards and the quality-issues
    // section reveal upward in a stagger, and each domain progress bar
    // fills from zero to its value.
    _setupDashboardMotion(dashboard) {
        this._dashScroller = dashboard;
        dashboard.style.scrollBehavior = 'smooth';

        if (this._prefersReducedMotion()) return;

        const cards = [...this.querySelectorAll('.hg-dash-grid .hg-dash-card')];
        const qiSection = this.querySelector('.hg-qi-section');
        const shiSection = this.querySelector('.hg-shi-section');

        if (cards.length) {
            gsap.from(cards, {
                opacity: 0,
                y: 16,
                duration: 0.5,
                ease: 'power2.out',
                stagger: 0.06,
                clearProps: 'opacity,transform',
            });
        }

        const sections = [qiSection, shiSection].filter(Boolean);
        if (sections.length) {
            gsap.from(sections, {
                opacity: 0,
                y: 16,
                duration: 0.5,
                ease: 'power2.out',
                delay: 0.15,
                stagger: 0.08,
                clearProps: 'opacity,transform',
            });
        }

        this._animateProgressBars();
    }

    // Tween each lightning-progress-bar's value from 0 → target so the
    // fill animates in. We tween a proxy and write the rounded value back
    // to the base component each frame.
    _animateProgressBars() {
        const bars = [...this.querySelectorAll('.hg-dash-progress')];
        bars.forEach((bar, i) => {
            const target = Number(bar.value) || 0;
            const proxy = { v: 0 };
            bar.value = 0;
            gsap.to(proxy, {
                v: target,
                duration: 1,
                ease: 'power2.out',
                delay: 0.2 + i * 0.06,
                onUpdate: () => {
                    bar.value = Math.round(proxy.v);
                },
                onComplete: () => {
                    bar.value = target;
                },
            });
        });
    }

    // A quick "pop" when a card becomes selected, complementing the CSS
    // border/box-shadow transition.
    _animateCardSelection(card) {
        if (!card || this._prefersReducedMotion()) return;
        gsap.fromTo(
            card,
            { scale: 0.97 },
            { scale: 1, duration: 0.45, ease: 'back.out(1.7)', clearProps: 'transform' }
        );
    }

    _playEntranceAnimation() {
        const reduce =
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;

        const header = this.querySelector('.hg-header');
        const healthBar = this.querySelector('.hg-health-bar');
        const legend = this.querySelector('.hg-legend');
        const svgEl = this.querySelector('.hg-svg');

        const targets = [header, healthBar, legend, svgEl].filter(Boolean);
        if (!targets.length) return;

        targets.forEach((el) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(16px)';
        });

        animate(
            targets,
            { opacity: [0, 1], y: [16, 0] },
            {
                duration: 0.5,
                ease: [0.2, 0.8, 0.2, 1],
                delay: stagger(0.08, { startDelay: 0.1 }),
            }
        );
    }

    disconnectedCallback() {
        this._teardownGraph();
    }

    _teardownGraph() {
        if (this._simulation) {
            this._simulation.stop();
            this._simulation = null;
        }
        this._d3Sels = null;
        this._d3Inited = false;
    }

    // ── View toggle ─────────────────────────────────────────────────
    handleToggleGraphView(event) {
        const detail = event.detail || {};
        const on = detail.checked !== undefined ? !!detail.checked : !!event.target.checked;
        this._graphView = on;
        // The graph builds lazily in renderedCallback when the <svg> is in
        // the DOM. lwc:if removes that node when we leave graph view, so we
        // reset the init guards to force a clean rebuild on the next toggle.
        if (on) {
            this._dashInited = false;
        } else {
            this._teardownGraph();
        }
    }

    get headerSubtitle() {
        return this._graphView
            ? this.statsLabel
            : 'Unified view of decisions, expertise, and organizational knowledge';
    }

    get domainCards() {
        return this._domainHealth.map((c) => {
            let status = 'error';
            if (c.overall >= 85) status = 'success';
            else if (c.overall >= 70) status = 'warning';
            const selected = c.domain === this._dashFilters.domain;
            return {
                id: c.id,
                domain: c.domain,
                agent: c.agent,
                overall: c.overall,
                overallLabel: `${c.overall}%`,
                trend: c.trend,
                selected,
                cardClass: selected
                    ? 'hg-dash-card hg-dash-card--selected'
                    : 'hg-dash-card',
                progressClass: `hg-dash-progress hg-dash-progress_${status}`,
                accuracyLabel: `${c.accuracy}%`,
                metadataLabel: `${c.metadata}%`,
                complianceLabel: `${c.compliance}%`,
                structureLabel: `${c.structure}%`,
                hitl: `${c.hitl}`,
            };
        });
    }

    /**
     * Selecting a domain card filters the Active Quality Issues to that
     * domain and scrolls the section into view. Clicking the already
     * selected card clears the filter (toggle).
     */
    handleDomainCardClick(event) {
        const card = event.currentTarget;
        const domain = card?.dataset?.domain;
        if (!domain) return;
        const alreadySelected = this._dashFilters.domain === domain;
        this._dashFilters = {
            ...this._dashFilters,
            domain: alreadySelected ? '' : domain,
        };
        if (!alreadySelected) {
            this._animateCardSelection(card);
            this._scrollToQualityIssues();
        }
    }

    handleDomainCardKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.handleDomainCardClick(event);
        }
    }

    _scrollToQualityIssues() {
        // Light DOM render mode — query the rendered section directly.
        requestAnimationFrame(() => {
            const scroller = this._dashScroller || this.querySelector('.hg-dashboard');
            const section = this.querySelector('.hg-qi-section');
            if (!scroller || !section) return;
            if (this._prefersReducedMotion()) {
                section.scrollIntoView({ block: 'start' });
                return;
            }
            // GSAP smooth scroll within the dashboard scroll container.
            gsap.to(scroller, {
                duration: 0.6,
                ease: 'power3.inOut',
                scrollTo: { y: section, offsetY: 16 },
            });
        });
    }

    // ── Dashboard: Active Quality Issues ─────────────────────────────

    get _openQualityIssues() {
        return this._qualityIssues.filter((q) => !this._ignoredIssueIds.includes(q.id));
    }

    get domainFilterOptions() {
        const seen = [];
        this._qualityIssues.forEach((q) => {
            if (q.domain && !seen.includes(q.domain)) seen.push(q.domain);
        });
        return [
            { label: 'All Domains/Agents', value: '' },
            ...seen.map((v) => ({ label: v, value: v })),
        ];
    }

    get qualityIssueTypeOptions() {
        return [
            { label: 'All Issue Types', value: '' },
            { label: 'Contradiction', value: 'contradiction' },
            { label: 'Similar Article', value: 'similarity' },
        ];
    }

    get priorityFilterOptions() {
        return [
            { label: 'All Priorities', value: '' },
            { label: 'Critical', value: 'Critical' },
            { label: 'High', value: 'High' },
            { label: 'Medium', value: 'Medium' },
            { label: 'Low', value: 'Low' },
        ];
    }

    get hasQualityIssues() {
        return this.qualityIssues.length > 0;
    }

    /** Dashboard shows only the top 3 issues; the full list lives on the
     *  "Explore All" page (`/quality-issues`). */
    get topQualityIssues() {
        return this.qualityIssues.slice(0, 3);
    }

    get hasTopQualityIssues() {
        return this.topQualityIssues.length > 0;
    }

    /** Open the full, paginated Top Quality Issues list in a workspace tab. */
    handleExploreAll() {
        window.dispatchEvent(new CustomEvent('workspace:addtab', {
            detail: { label: 'Top Quality Issues', path: '/quality-issues', originPath: '/healing-graph' },
        }));
        navigate('/quality-issues');
    }

    get qualityIssues() {
        const f = this._dashFilters;
        return this._openQualityIssues
            .filter((q) => (!f.domain || q.domain === f.domain)
                && (!f.type || q.type === f.type)
                && (!f.priority || q.priority === f.priority))
            .map((q) => {
                const isContradiction = q.type === 'contradiction';
                return {
                    id: q.id,
                    domain: q.domain,
                    title: q.title,
                    description: q.description,
                    isContradiction,
                    isSimilarity: !isContradiction,
                    typeBadgeLabel: isContradiction ? 'Contradiction' : 'Similar Article',
                    confidenceLabel: `Confidence: ${q.confidence}%`,
                    itemALabel: isContradiction ? 'Option A' : 'Article 1',
                    itemBLabel: isContradiction ? 'Option B' : 'Article 2',
                    itemActionLabel: isContradiction ? 'Pick this' : 'Archive Article',
                    itemA: { ...q.itemA },
                    itemB: { ...q.itemB },
                };
            });
    }

    handleDashFilterChange(event) {
        const field = event.target?.name;
        if (!field) return;
        this._dashFilters = { ...this._dashFilters, [field]: event.detail?.value ?? '' };
    }

    /**
     * Open the linked article as a Knowledge Article record page in a
     * new workspace tab (read view), matching the V2 prototype's
     * `/knowledge-record/:id` flow. Closing the tab returns here via the
     * shell's `originPath` mechanism.
     */
    handleOpenArticle(event) {
        const { id, title } = event.currentTarget?.dataset || {};
        if (!id || !title) return;
        this._openArticleRecord(id, title);
    }

    _openArticleRecord(id, title) {
        setRecord({
            id,
            title,
            language: 'English',
            articleRecordType: 'FAQ',
            isKnowledgeBlock: false,
        });
        const path = `/knowledge-record/${encodeURIComponent(id)}`;
        window.dispatchEvent(new CustomEvent('workspace:addtab', {
            detail: { label: title, path, originPath: '/healing-graph' },
        }));
        navigate(path);
    }

    /** Contradiction → pick the correct source and open it for editing. */
    handlePickOption(event) {
        const title = event.currentTarget?.dataset?.title;
        if (!title) return;
        this._addArticleTab(title);
        this._navigateToArticle(title);
    }

    /** Similarity → open a merged knowledge record combining both articles. */
    handleMergeArticles(event) {
        const title = event.currentTarget?.dataset?.title || 'Merged Article';
        this._addArticleTab(title);
        this._navigateToArticle(title);
    }

    handleArchiveArticle(event) {
        const id = event.currentTarget?.dataset?.id;
        if (!id) return;
        this._ignoredIssueIds = [...this._ignoredIssueIds, id];
    }

    handleIgnoreIssue(event) {
        const id = event.currentTarget?.dataset?.id;
        if (!id) return;
        this._ignoredIssueIds = [...this._ignoredIssueIds, id];
    }

    // ── Dashboard: Self-Healed Quality Issues (tree-grid) ────────────

    get selfHealedRows() {
        const rows = this._healedReviewOnly
            ? this._selfHealed.filter((r) => r.status === 'In Review')
            : this._selfHealed;
        return rows.map((r) => {
            const expanded = this._expandedHealedIds.includes(r.id);
            return {
                ...r,
                isExpanded: expanded,
                selected: this._selectedHealedIds.includes(r.id),
                chevronIcon: expanded ? 'utility:chevrondown' : 'utility:chevronright',
                rowClass: expanded ? 'hg-shi-row hg-shi-row--expanded' : 'hg-shi-row',
                statusBadgeClass: r.status === 'Resolved'
                    ? 'hg-shi-badge slds-theme_success'
                    : 'hg-shi-badge slds-theme_warning',
                resolutionParts: r.resolution.parts.map((p, i) => ({
                    ...p,
                    key: `${r.id}-rp-${i}`,
                })),
            };
        });
    }

    get hasSelfHealed() {
        return this.selfHealedRows.length > 0;
    }

    get healedFilterBtnClass() {
        return this._healedReviewOnly ? 'hg-shi-iconbtn hg-shi-iconbtn--active' : 'hg-shi-iconbtn';
    }

    handleToggleHealedRow(event) {
        const id = event.currentTarget?.dataset?.id;
        if (!id) return;
        const expanded = [...this._expandedHealedIds];
        const idx = expanded.indexOf(id);
        if (idx >= 0) expanded.splice(idx, 1);
        else expanded.push(id);
        this._expandedHealedIds = expanded;
    }

    handleHealedSelect(event) {
        const id = event.currentTarget?.dataset?.id;
        if (!id) return;
        const checked = event.detail ? event.detail.checked : event.target?.checked;
        const selected = this._selectedHealedIds.filter((s) => s !== id);
        if (checked) selected.push(id);
        this._selectedHealedIds = selected;
    }

    handleHealedArticleClick(event) {
        const { id, title } = event.currentTarget?.dataset || {};
        if (!id || !title) return;
        this._openArticleRecord(id, title);
    }

    /** Header refresh — re-roll the self-healed history. */
    handleRefreshHealed() {
        this._selfHealed = buildSelfHealedIssues();
        this._expandedHealedIds = [];
        this._selectedHealedIds = [];
    }

    /** Header filter — toggle showing only items still awaiting review. */
    handleFilterHealed() {
        this._healedReviewOnly = !this._healedReviewOnly;
    }

    handleHealedRowAction(event) {
        const value = event.detail?.value;
        const id = event.currentTarget?.dataset?.id;
        if (!id) return;
        const row = this._selfHealed.find((r) => r.id === id);
        if (value === 'view-article' && row) {
            this._openArticleRecord(row.articleId, row.articleTitle);
        } else if (value === 'dismiss') {
            this._selfHealed = this._selfHealed.filter((r) => r.id !== id);
            this._expandedHealedIds = this._expandedHealedIds.filter((x) => x !== id);
        }
    }

    // ── Computed getters ─────────────────────────────────────────────

    get filteredNodes() {
        if (this._activeFilters.length === 0) return this._nodes;
        return this._nodes.filter((n) => this._activeFilters.includes(n.capability));
    }

    get filteredEdges() {
        const nodeIds = new Set(this.filteredNodes.map((n) => n.id));
        return this._edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
    }

    get statsLabel() {
        const openContra = this._contradictions.filter((c) => c.status === 'open').length;
        return `${this.filteredNodes.length} nodes · ${this.filteredEdges.length} edges · ${openContra} contradictions`;
    }

    get healthBtnClass() {
        return this._showHealthBar ? 'hg-btn hg-btn--active' : 'hg-btn';
    }

    get filterBtnClass() {
        return (this._showFilters || this._activeFilters.length > 0) ? 'hg-btn hg-btn--active' : 'hg-btn';
    }

    get activeFilterCount() {
        return this._activeFilters.length || 0;
    }

    get healingFilterOptions() {
        return [
            { value: 'all', label: 'All Nodes', selected: this._healingFilter === 'all' },
            { value: 'contradictions', label: 'Contradictions', selected: this._healingFilter === 'contradictions' },
            { value: 'healed', label: 'Healed', selected: this._healingFilter === 'healed' },
            { value: 'pending', label: 'Pending Review', selected: this._healingFilter === 'pending' },
        ];
    }

    /**
     * Same options as `healingFilterOptions` but in the `{label,value}`
     * shape required by `lightning-combobox`. Selection is driven via the
     * combobox's `value` binding, so the `selected` flag is not needed.
     */
    get healingComboboxOptions() {
        return this.healingFilterOptions.map(({ value, label }) => ({ value, label }));
    }

    get allCapabilities() {
        const caps = new Set();
        this._nodes.forEach((n) => caps.add(n.capability));
        return Array.from(caps);
    }

    get capabilityFilterItems() {
        return this.allCapabilities.map((cap) => ({
            key: cap,
            label: CAPABILITY_LABELS[cap] || cap,
            count: this._nodes.filter((n) => n.capability === cap).length,
            dotStyle: `background-color: ${CAPABILITY_COLORS[cap] || '#3b82f6'}`,
            rowClass: (this._activeFilters.length === 0 || this._activeFilters.includes(cap))
                ? 'hg-cap-row'
                : 'hg-cap-row hg-cap-row--dimmed',
        }));
    }

    get legendCapabilities() {
        return this.allCapabilities.map((cap) => ({
            key: cap,
            label: CAPABILITY_LABELS[cap] || cap,
            dotStyle: `background-color: ${CAPABILITY_COLORS[cap] || '#3b82f6'}`,
        }));
    }

    get healthDomainsComputed() {
        return this._healthDomains.map((dom) => ({
            ...dom,
            chipClass: this._selectedDomain === dom.domain
                ? 'hg-domain-chip hg-domain-chip--active'
                : 'hg-domain-chip',
        }));
    }

    get allDomainBtnClass() {
        return this._selectedDomain === null
            ? 'hg-domain-chip hg-domain-chip--all hg-domain-chip--active'
            : 'hg-domain-chip hg-domain-chip--all';
    }

    get showTooltip() {
        return this._hoveredInfo && !this._selectedElement;
    }

    get tooltipDotStyle() {
        if (!this._hoveredInfo) return '';
        return `background-color: ${CAPABILITY_COLORS[this._hoveredInfo.capability] || '#3b82f6'}`;
    }

    get hasSelection() {
        return !!this._selectedElement;
    }

    get panelTitle() {
        if (!this._selectedElement) return '';
        return this._selectedElement.type === 'contradiction' ? 'Contradiction Detail' : 'Healing Actions';
    }

    get isContradictionSelected() {
        return this._selectedElement?.type === 'contradiction';
    }

    get isNodeHealingSelected() {
        return this._selectedElement?.type === 'node-healing';
    }

    get contraSeverityClass() {
        if (!this._selectedElement?.data) return 'hg-severity-badge';
        return `hg-severity-badge hg-severity-badge--${this._selectedElement.data.severity}`;
    }

    get contraDetectedTime() {
        if (!this._selectedElement?.data) return '';
        return formatRelativeTime(this._selectedElement.data.detectedAt);
    }

    get contraResolutionsComputed() {
        const data = this._selectedElement?.data;
        if (!data) return [];
        if (data.suggestedResolutions) {
            return data.suggestedResolutions.map((r, i) => ({
                ...r,
                key: `res-${i}`,
            }));
        }
        if (data.suggestedResolution) {
            return [{ key: 'res-0', articleTitle: data.entityB?.title || data.entityA?.title || 'Article', text: data.suggestedResolution }];
        }
        return [];
    }

    /**
     * Maps the selected graph contradiction into the same shape the
     * dashboard "Active Quality Issues" tile uses, so the side panel
     * presents identical content and actions: clickable articles that
     * open as records in a workspace tab, a confidence badge, and a
     * "Pick this" action per conflicting option.
     */
    get selectedContradiction() {
        const data = this._selectedElement?.data;
        if (!data) return null;
        const confidenceBySeverity = { critical: 98, high: 95, medium: 90, low: 85 };
        const confidence = confidenceBySeverity[data.severity] ?? 95;
        return {
            id: data.id,
            domain: data.domain,
            typeBadgeLabel: 'Contradiction',
            confidenceLabel: `Confidence: ${confidence}%`,
            title: `Conflicting information in ${data.domain}`,
            description:
                'The following information has been identified as a contradiction. Both articles make mutually-exclusive claims about the same topic — only one can be correct. Review each source and pick the one to keep.',
            itemA: {
                articleId: data.entityA?.id,
                articleTitle: data.entityA?.title,
                text: data.entityA?.claim,
            },
            itemB: {
                articleId: data.entityB?.id,
                articleTitle: data.entityB?.title,
                text: data.entityB?.claim,
            },
        };
    }

    get healingNodeDotStyle() {
        if (!this._selectedElement?.node) return '';
        return `background-color: ${CAPABILITY_COLORS[this._selectedElement.node.capability] || '#3b82f6'}`;
    }

    get healingActionCountLabel() {
        const count = this._selectedElement?.actions?.length || 0;
        return `${count} Healing Action${count !== 1 ? 's' : ''}`;
    }

    get sortedHealingActions() {
        if (!this._selectedElement?.actions) return [];
        return [...this._selectedElement.actions]
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((action) => ({
                ...action,
                isExpanded: this._expandedActions.includes(action.id),
                chevronIcon: this._expandedActions.includes(action.id) ? 'utility:chevrondown' : 'utility:chevronright',
                issueClass: 'hg-issue-badge',
                actionClass: 'hg-action-badge',
                timeLabel: formatRelativeTime(action.timestamp),
            }));
    }

    // ── Healing highlight IDs ────────────────────────────────────────

    get _healingHighlightIds() {
        if (this._healingFilter === 'all') return null;
        const ids = new Set();
        if (this._healingFilter === 'contradictions') {
            this._nodeIdsInContradictions.forEach((id) => ids.add(id));
        } else if (this._healingFilter === 'healed') {
            this._healingActionsByEntity.forEach((actions, entityId) => {
                if (actions.some((a) => a.actionType === 'auto-healed')) ids.add(entityId);
            });
        } else if (this._healingFilter === 'pending') {
            this._healingActionsByEntity.forEach((actions, entityId) => {
                if (actions.some((a) => a.actionType === 'pending-review')) ids.add(entityId);
            });
        }
        return ids;
    }

    get _domainHighlightIds() {
        if (!this._selectedDomain) return null;
        const domainNode = this._nodes.find((n) => n.type === 'domain' && n.label === this._selectedDomain);
        if (!domainNode) return null;
        const ids = new Set([domainNode.id]);
        this._edges.forEach((e) => {
            if (e.source === domainNode.id) ids.add(e.target);
            if (e.target === domainNode.id) ids.add(e.source);
        });
        return ids;
    }

    // ── Event handlers ───────────────────────────────────────────────

    handleToggleHealthBar() {
        this._showHealthBar = !this._showHealthBar;
    }

    handleToggleFilters() {
        this._showFilters = !this._showFilters;
    }

    handleHealingFilterChange(event) {
        // lightning-combobox dispatches a CustomEvent with { detail: { value } }.
        // Fall back to event.target.value to remain compatible with a native
        // <select> if the markup is ever swapped back.
        this._healingFilter = event.detail?.value ?? event.target?.value;
        this._applyHighlights();
    }

    handleToggleCapability(event) {
        const cap = event.currentTarget.dataset.cap;
        const filters = [...this._activeFilters];
        const idx = filters.indexOf(cap);
        if (idx >= 0) {
            filters.splice(idx, 1);
        } else {
            filters.push(cap);
        }
        this._activeFilters = filters;
        this._reinitGraph();
    }

    handleClearFilters() {
        this._activeFilters = [];
        this._reinitGraph();
    }

    handleDomainClick(event) {
        const domain = event.currentTarget.dataset.domain;
        this._selectedDomain = this._selectedDomain === domain ? null : domain;
        this._applyDomainHighlight();
    }

    handleDomainAllClick() {
        this._selectedDomain = null;
        this._applyDomainHighlight();
    }

    handleClosePanel() {
        this._selectedElement = null;
    }

    /** Dismiss the selected contradiction and close the detail panel. */
    handleIgnoreContradiction() {
        const id = this._selectedElement?.data?.id;
        if (id) {
            this._contradictions = this._contradictions.map((c) =>
                c.id === id ? { ...c, status: 'ignored' } : c
            );
        }
        this._selectedElement = null;
    }

    handleToggleAction(event) {
        const id = event.currentTarget.dataset.actionId;
        const expanded = [...this._expandedActions];
        const idx = expanded.indexOf(id);
        if (idx >= 0) {
            expanded.splice(idx, 1);
        } else {
            expanded.push(id);
        }
        this._expandedActions = expanded;
    }

    handleApproveDraftContra() {
        const contra = this._selectedElement?.data;
        if (!contra) return;
        const resolutions = contra.suggestedResolutions || [];
        const titles = resolutions.length
            ? [...new Set(resolutions.map((r) => r.articleTitle).filter(Boolean))]
            : [contra.entityA?.title, contra.entityB?.title].filter(Boolean);
        if (!titles.length) return;
        titles.forEach((t) => this._addArticleTab(t));
        this._navigateToArticle(titles[titles.length - 1]);
    }

    handleApproveDraftArticle(event) {
        const title = event.currentTarget.dataset.title || 'Untitled Article';
        this._addArticleTab(title);
        this._navigateToArticle(title);
    }

    handleApproveDraftAction(event) {
        const title = event.currentTarget.dataset.title || 'Untitled Article';
        this._addArticleTab(title);
        this._navigateToArticle(title);
    }

    handleApproveAllDrafts() {
        const actions = this._selectedElement?.actions;
        if (!actions || !actions.length) return;
        const titles = [...new Set(actions.map((a) => a.entityTitle).filter(Boolean))];
        titles.forEach((t) => this._addArticleTab(t));
        this._navigateToArticle(titles[titles.length - 1]);
    }

    _addArticleTab(title) {
        window.dispatchEvent(new CustomEvent('workspace:addtab', {
            detail: { label: title, path: '/new-knowledge', originPath: '/healing-graph' },
        }));
    }

    _navigateToArticle(title) {
        setDraftSession({ title });
        navigate('/new-knowledge');
    }

    // ── D3 graph engine ──────────────────────────────────────────────

    _reinitGraph() {
        if (this._simulation) {
            this._simulation.stop();
        }
        const svg = this.querySelector('.hg-svg');
        if (svg) {
            svg.querySelectorAll('*').forEach((el) => el.remove());
        }
        this._d3Sels = null;
        this._initGraph();
    }

    _initGraph() {
        const svgEl = this.querySelector('.hg-svg');
        if (!svgEl || this.filteredNodes.length === 0) return;

        const width = svgEl.clientWidth;
        const height = svgEl.clientHeight;
        const svg = d3.select(svgEl);
        svg.selectAll('*').remove();

        const g = svg.append('g');

        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => g.attr('transform', event.transform));

        svg.call(zoom);
        svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2));

        svg.on('click', () => { this._selectedElement = null; });

        const simNodes = this.filteredNodes.map((n) => ({ ...n }));
        const simEdges = this.filteredEdges.map((e) => ({ ...e }));

        const simulation = d3.forceSimulation(simNodes)
            .force('link', d3.forceLink(simEdges).id((d) => d.id).distance(140))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(0, 0))
            .force('collide', d3.forceCollide().radius((d) => d.size + 12));

        this._simulation = simulation;

        // Hit areas for conflict edges
        const hitArea = g.append('g')
            .selectAll('line.hit-area')
            .data(simEdges.filter((d) => d.relationship === 'conflicts-with'))
            .join('line')
            .attr('class', 'hit-area')
            .attr('stroke', 'transparent')
            .attr('stroke-width', 14)
            .attr('cursor', 'pointer')
            .on('click', (event, d) => {
                event.stopPropagation();
                const src = d.source.id || d.source;
                const tgt = d.target.id || d.target;
                const contra = this._contradictionsByEdge.get(edgeKey(src, tgt));
                if (contra) {
                    this._selectedElement = { type: 'contradiction', data: contra };
                }
            });

        // Edges
        const link = g.append('g')
            .selectAll('line.edge')
            .data(simEdges)
            .join('line')
            .attr('class', 'edge')
            .attr('stroke', (d) => {
                if (d.relationship === 'conflicts-with') {
                    const src = d.source.id || d.source;
                    const tgt = d.target.id || d.target;
                    const contra = this._contradictionsByEdge.get(edgeKey(src, tgt));
                    return SEVERITY_COLORS[contra?.severity || 'medium'] || '#f97316';
                }
                return '#9ca3af';
            })
            .attr('stroke-width', (d) => d.relationship === 'conflicts-with' ? 1.2 : 0.8)
            .attr('stroke-dasharray', (d) => d.relationship === 'conflicts-with' ? '6,3' : 'none')
            .attr('stroke-opacity', (d) => d.relationship === 'conflicts-with' ? 0.8 : 0.45);

        // Edge labels
        const edgeLabel = g.append('g')
            .selectAll('text')
            .data(simEdges)
            .join('text')
            .text((d) => d.relationship)
            .attr('font-size', '7px')
            .attr('fill', (d) => d.relationship === 'conflicts-with' ? '#ef4444' : '#9ca3af')
            .attr('font-weight', '400')
            .attr('text-anchor', 'middle')
            .style('pointer-events', 'none')
            .style('opacity', (d) => d.relationship === 'conflicts-with' ? 0.7 : 0);

        // Healing status rings
        const healedNodeData = simNodes.filter((n) => this._healingActionsByEntity.has(n.id));
        const healingRing = g.append('g')
            .selectAll('circle.healing-ring')
            .data(healedNodeData)
            .join('circle')
            .attr('class', 'healing-ring')
            .attr('r', (d) => d.size / 2 + 8)
            .attr('fill', 'none')
            .attr('stroke', (d) => {
                const actions = this._healingActionsByEntity.get(d.id) || [];
                const latest = [...actions].sort((a, b) => b.timestamp - a.timestamp)[0];
                return HEALING_RING_COLORS[latest?.actionType] || '#6b7280';
            })
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '4,3')
            .attr('opacity', 0.6)
            .style('pointer-events', 'none');

        // Nodes
        let dragDistance = 0;
        const node = g.append('g')
            .selectAll('circle.node')
            .data(simNodes)
            .join('circle')
            .attr('class', 'node')
            .attr('r', (d) => d.size / 2 + 3)
            .attr('fill', (d) => CAPABILITY_COLORS[d.capability] || '#3b82f6')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .attr('cursor', 'pointer')
            .style('opacity', (d) => {
                const hl = this._healingHighlightIds;
                if (!hl) return 1;
                return hl.has(d.id) ? 1 : 0.12;
            })
            .call(
                d3.drag()
                    .on('start', (event) => {
                        dragDistance = 0;
                        if (!event.active) simulation.alphaTarget(0.3).restart();
                        event.subject.fx = event.subject.x;
                        event.subject.fy = event.subject.y;
                    })
                    .on('drag', (event) => {
                        dragDistance += Math.abs(event.dx) + Math.abs(event.dy);
                        event.subject.fx = event.x;
                        event.subject.fy = event.y;
                    })
                    .on('end', (event) => {
                        if (!event.active) simulation.alphaTarget(0);
                        event.subject.fx = null;
                        event.subject.fy = null;
                    })
            )
            .on('click', (event, d) => {
                if (dragDistance > 5) return;
                event.stopPropagation();
                const actions = this._healingActionsByEntity.get(d.id);
                if (actions && actions.length > 0) {
                    this._selectedElement = {
                        type: 'node-healing',
                        nodeId: d.id,
                        node: this._nodes.find((n) => n.id === d.id),
                        actions,
                    };
                }
            })
            .on('mouseenter', (event, d) => {
                this._hoveredNode = d.id;
                const connections = this._edges.filter((e) => e.source === d.id || e.target === d.id);
                const actions = this._healingActionsByEntity.get(d.id);
                this._hoveredInfo = {
                    label: d.label,
                    type: d.type,
                    capability: d.capability,
                    capLabel: CAPABILITY_LABELS[d.capability] || d.capability,
                    connectionCount: connections.length,
                    inContradiction: this._nodeIdsInContradictions.has(d.id),
                    healingCount: actions?.length || 0,
                };

                d3.select(event.currentTarget).transition().duration(200).attr('r', d.size / 2 + 5);

                edgeLabel.style('opacity', (e) =>
                    (e.source.id || e.source) === d.id || (e.target.id || e.target) === d.id ? 1 : 0
                );

                const connectedIds = new Set([d.id]);
                simEdges.forEach((e) => {
                    const src = e.source.id || e.source;
                    const tgt = e.target.id || e.target;
                    if (src === d.id) connectedIds.add(tgt);
                    if (tgt === d.id) connectedIds.add(src);
                });

                node.transition().duration(200).style('opacity', (n) => connectedIds.has(n.id) ? 1 : 0.08);
                link.transition().duration(200).attr('stroke-opacity', (e) => {
                    const src = e.source.id || e.source;
                    const tgt = e.target.id || e.target;
                    return (src === d.id || tgt === d.id) ? 0.6 : 0.04;
                });
                text.transition().duration(200).style('opacity', (n) => connectedIds.has(n.id) ? 1 : 0.06);
                healingRing.transition().duration(200).style('opacity', (n) => connectedIds.has(n.id) ? 0.6 : 0.06);
                contraBadge.transition().duration(200).style('opacity', (n) => connectedIds.has(n.id) ? 1 : 0.06);
            })
            .on('mouseleave', (event, d) => {
                this._hoveredNode = null;
                this._hoveredInfo = null;

                d3.select(event.currentTarget).transition().duration(200).attr('r', d.size / 2 + 3);

                const hl = this._healingHighlightIds;
                edgeLabel.style('opacity', (e) => e.relationship === 'conflicts-with' ? 0.7 : 0);
                node.transition().duration(200).style('opacity', (n) => (!hl ? 1 : hl.has(n.id) ? 1 : 0.12));
                link.transition().duration(200).attr('stroke-opacity', (d) => d.relationship === 'conflicts-with' ? 0.7 : 0.25);
                text.transition().duration(200).style('opacity', 0.8);
                healingRing.transition().duration(200).style('opacity', 0.6);
                contraBadge.transition().duration(200).style('opacity', 1);
            });

        // Contradiction badges
        const contraNodeData = simNodes.filter((n) => this._nodeIdsInContradictions.has(n.id));
        const contraBadge = g.append('g')
            .selectAll('text.contra-badge')
            .data(contraNodeData)
            .join('text')
            .attr('class', 'contra-badge')
            .text('⚠')
            .attr('font-size', '11px')
            .style('pointer-events', 'none');

        // Labels
        const text = g.append('g')
            .selectAll('text.label')
            .data(simNodes)
            .join('text')
            .attr('class', 'label')
            .text((d) => d.label.length > 18 ? d.label.substring(0, 18) + '…' : d.label)
            .attr('font-size', '9px')
            .attr('font-weight', '500')
            .attr('text-anchor', 'middle')
            .attr('dy', (d) => d.size / 2 + 14)
            .attr('fill', '#6b7280')
            .style('opacity', 0.8)
            .style('pointer-events', 'none');

        // Store selections
        this._d3Sels = { node, link, text, healingRing, contraBadge, zoom, svg, edgeLabel };

        // Tick
        simulation.on('tick', () => {
            link
                .attr('x1', (d) => d.source.x)
                .attr('y1', (d) => d.source.y)
                .attr('x2', (d) => d.target.x)
                .attr('y2', (d) => d.target.y);
            hitArea
                .attr('x1', (d) => d.source.x)
                .attr('y1', (d) => d.source.y)
                .attr('x2', (d) => d.target.x)
                .attr('y2', (d) => d.target.y);
            edgeLabel
                .attr('x', (d) => (d.source.x + d.target.x) / 2)
                .attr('y', (d) => (d.source.y + d.target.y) / 2);
            node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
            healingRing.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
            contraBadge
                .attr('x', (d) => d.x - d.size / 2 - 4)
                .attr('y', (d) => d.y - d.size / 2 - 4);
            text.attr('x', (d) => d.x).attr('y', (d) => d.y);
        });
    }

    // ── Highlight transitions (no sim restart) ───────────────────────

    _applyHighlights() {
        const sels = this._d3Sels;
        if (!sels) return;
        const hl = this._healingHighlightIds;

        sels.node.transition().duration(300)
            .style('opacity', (d) => {
                if (!hl) return 1;
                return hl.has(d.id) ? 1 : 0.12;
            });

        sels.link.transition().duration(300)
            .attr('stroke-opacity', (d) => d.relationship === 'conflicts-with' ? 0.7 : 0.25);

        sels.text.transition().duration(300).style('opacity', 0.8);
        sels.healingRing.transition().duration(300).style('opacity', 0.6);
        sels.contraBadge.transition().duration(300).style('opacity', 1);
    }

    _applyDomainHighlight() {
        const sels = this._d3Sels;
        if (!sels) return;
        const dhl = this._domainHighlightIds;
        const hl = this._healingHighlightIds;

        sels.node.transition().duration(300)
            .style('opacity', (d) => {
                if (dhl) return dhl.has(d.id) ? 1 : 0.08;
                if (hl) return hl.has(d.id) ? 1 : 0.12;
                return 1;
            });

        sels.link.transition().duration(300)
            .attr('stroke-opacity', (d) => {
                if (dhl) {
                    const src = d.source.id || d.source;
                    const tgt = d.target.id || d.target;
                    return (dhl.has(src) && dhl.has(tgt))
                        ? (d.relationship === 'conflicts-with' ? 0.7 : 0.4)
                        : 0.03;
                }
                return d.relationship === 'conflicts-with' ? 0.7 : 0.25;
            });

        sels.text.transition().duration(300)
            .style('opacity', (d) => dhl ? (dhl.has(d.id) ? 1 : 0.06) : 0.8);

        sels.healingRing.transition().duration(300)
            .style('opacity', (d) => dhl ? (dhl.has(d.id) ? 0.6 : 0.04) : 0.6);

        sels.contraBadge.transition().duration(300)
            .style('opacity', (d) => dhl ? (dhl.has(d.id) ? 1 : 0.04) : 1);

        // Zoom to highlighted cluster
        const svgEl = this.querySelector('.hg-svg');
        if (dhl && svgEl) {
            const positions = [];
            sels.node.each(function (d) {
                if (dhl.has(d.id)) positions.push({ x: d.x, y: d.y });
            });
            if (positions.length > 0) {
                const xMin = d3.min(positions, (p) => p.x);
                const xMax = d3.max(positions, (p) => p.x);
                const yMin = d3.min(positions, (p) => p.y);
                const yMax = d3.max(positions, (p) => p.y);
                const pad = 100;
                const bw = (xMax - xMin) + pad * 2;
                const bh = (yMax - yMin) + pad * 2;
                const cx = (xMin + xMax) / 2;
                const cy = (yMin + yMax) / 2;
                const w = svgEl.clientWidth;
                const svgH = svgEl.clientHeight;
                const scale = Math.min(w / bw, svgH / bh, 2.5);
                const tx = w / 2 - cx * scale;
                const ty = svgH / 2 - cy * scale;
                sels.svg.transition().duration(600).ease(d3.easeCubicInOut)
                    .call(sels.zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
            }
        } else if (!dhl && svgEl) {
            const w = svgEl.clientWidth;
            const svgH = svgEl.clientHeight;
            sels.svg.transition().duration(600).ease(d3.easeCubicInOut)
                .call(sels.zoom.transform, d3.zoomIdentity.translate(w / 2, svgH / 2));
        }
    }
}
