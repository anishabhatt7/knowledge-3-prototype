import { LightningElement, track } from 'lwc';
import * as d3 from 'd3';
import { gsap } from 'gsap';
import { animate, stagger } from 'motion';
import { navigate } from '../../../router';
import { setDraftSession } from 'data/draftSession';
import {
    seedGraphNodes,
    seedGraphEdges,
    seedHealthDomains,
    seedContradictions,
    seedHealingActions,
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
        { id: 'command-center', label: 'Knowledge Health', icon: 'utility:graph' },
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
        if (this._d3Inited) return;
        const svg = this.querySelector('.hg-svg');
        if (!svg) return;
        this._d3Inited = true;
        this._playEntranceAnimation();
        this._initGraph();
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
        if (this._simulation) {
            this._simulation.stop();
            this._simulation = null;
        }
        this._d3Sels = null;
        this._d3Inited = false;
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
            detail: { label: title, path: '/new-knowledge' },
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
