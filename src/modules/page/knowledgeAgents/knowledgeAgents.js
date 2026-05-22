import { LightningElement, track } from 'lwc';
import { gsap } from 'gsap';
import { animate, stagger } from 'motion';
import { navigate } from '../../../router';
import {
    seedAgents,
    toTableRow,
    formatRelativeTime,
    GOVERNANCE_LABELS,
    GOVERNANCE_DESCRIPTIONS,
    SIGNAL_LABELS,
    STATUS_LABELS,
} from 'data/agents';

/**
 * Knowledge Agents — list + detail view.
 *
 * Visual layout matches Figma 78:10164 (Knowledge 3.0 — Knowledge
 * Agents): the same kh-rail used by Knowledge Home / Command Center
 * sits beside a list-view header (bot icon + title + New button) and
 * a data table.
 *
 * The table columns surface the same per-agent data points the React
 * `AutonomousAgents` card in `knowledge-vision-app` shows — status
 * badge, governance tier, articles created/updated/gaps, signal
 * sources, and the numeric domain health score — so the v2 list
 * stays in lockstep with the vision-app content. The activity feed,
 * cross-domain links, coordination events, predicted needs, and
 * feedback stats in the detail view are likewise ported from
 * `AutonomousAgents.tsx` so list + detail stay aligned.
 */
export default class KnowledgeAgents extends LightningElement {
    static renderMode = 'light';

    // ── Left rail state ─────────────────────────────────────────────
    @track _railExpanded = true;
    _railAnimating = false;

    _railTopItems = [
        { id: 'home', label: 'Home', icon: 'utility:home', active: false },
    ];

    railMaintain = [
        { id: 'command-center', label: 'Command Center', icon: 'utility:trending' },
        { id: 'knowledge-agents', label: 'Knowledge Agents', icon: 'utility:agent_astro', active: true },
        { id: 'healing-graph', label: 'Healing Graph', icon: 'utility:graph' },
        { id: 'decision-hub', label: 'Decision Hub', icon: 'utility:dataspaces' },
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

    // GSAP-driven width tween + label opacity stagger — mirrors the
    // motion used by healingGraph / commandCenter / knowledgeHome so
    // the rail feels identical across every page in the shell.
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
                    {
                        width: targetW,
                        duration: 0.32,
                        ease: 'power2.out',
                        onComplete: () => {
                            rail.style.width = '';
                            this._railAnimating = false;
                        },
                    }
                );
                gsap.fromTo(
                    labels,
                    { opacity: 0, x: -8 },
                    { opacity: 1, x: 0, duration: 0.28, ease: 'power2.out', delay: 0.08, stagger: 0.02 }
                );
            });
        } else {
            const labels = this.querySelectorAll('.kh-rail .kh-rail__label, .kh-rail .kh-rail__group-header');
            gsap.to(labels, { opacity: 0, x: -8, duration: 0.16, ease: 'power2.in' });
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
        if (id === 'home') navigate('/');
        else if (id === 'command-center') navigate('/command-center');
        else if (id === 'healing-graph') navigate('/healing-graph');
        else if (id === 'kb-base') navigate('/knowledge-base');
    }

    // ── Data ────────────────────────────────────────────────────────
    @track _selectedAgentId = null;

    _agents = seedAgents;

    get hasSelection() {
        return Boolean(this._selectedAgentId);
    }

    get selectedAgent() {
        if (!this._selectedAgentId) return null;
        return this._agents.find((a) => a.id === this._selectedAgentId) || null;
    }

    // ── List view ──────────────────────────────────────────────────
    get tableRows() {
        return this._agents.map((agent) => toTableRow(agent));
    }

    get itemCountLabel() {
        const n = this._agents.length;
        return `${n} item${n === 1 ? '' : 's'} • Sorted by Last Modified Date • Updated a few seconds ago`;
    }

    handleSelectAgent(event) {
        const target = event.currentTarget;
        // Tolerate clicks where currentTarget is an LBC host wrapper
        // that didn't surface the data attribute — fall back to the
        // nearest ancestor that carries data-id.
        const id =
            target?.dataset?.id ||
            (typeof target?.closest === 'function'
                ? target.closest('[data-id]')?.dataset?.id
                : null);
        if (id) this._selectedAgentId = id;
    }

    handleSelectAgentKeyDown(event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const id = event.currentTarget?.dataset?.id;
        if (!id) return;
        event.preventDefault();
        this._selectedAgentId = id;
    }

    handleBackToList() {
        this._selectedAgentId = null;
    }

    handleNewAgent() {
        // Stub — surface the intent so demo flows can wire it later.
        window.dispatchEvent(new CustomEvent('agents:new'));
    }

    // ── Detail view computed ───────────────────────────────────────
    get detail() {
        const agent = this.selectedAgent;
        if (!agent) return null;

        const govLabel = GOVERNANCE_LABELS[agent.governanceTier] || agent.governanceTier;
        const govDescription = GOVERNANCE_DESCRIPTIONS[agent.governanceTier] || '';
        const govClass = `ka-detail__gov-tier ka-detail__gov-tier--${agent.governanceTier}`;
        const govBlockClass = `ka-detail__gov-card ka-detail__gov-card--${agent.governanceTier}`;
        const statusLabel = STATUS_LABELS[agent.status] || agent.status;
        const statusClass = `ka-status-badge ka-status-badge--${agent.status}`;

        return {
            id: agent.id,
            name: agent.name,
            domain: agent.domain,
            avatar: agent.avatar,
            statusLabel,
            statusClass,
            govLabel,
            govClass,
            govDescription,
            govBlockClass,
            healthScore: agent.domainHealthScore,
            healthLabel: this._healthLabel(agent.domainHealthScore),
            healthClass: this._healthClass(agent.domainHealthScore),
            coveragePercent: agent.coveragePercent,
            coverageStyle: `width: ${agent.coveragePercent}%`,
            freshnessPercent: agent.freshnessPercent,
            freshnessStyle: `width: ${agent.freshnessPercent}%`,
            contradictionsFound: agent.contradictionsFound,
            articlesCreated: agent.articlesCreated,
            articlesUpdated: agent.articlesUpdated,
            gapsIdentified: agent.gapsIdentified,
        };
    }

    get activityItems() {
        const agent = this.selectedAgent;
        if (!agent) return [];
        return (agent.activityLog || []).map((act) => ({
            ...act,
            iconName: this._activityIcon(act.type),
            iconClass: `ka-activity__icon ka-activity__icon--${act.type}`,
            timeLabel: formatRelativeTime(act.timestamp),
        }));
    }

    get signalSources() {
        const agent = this.selectedAgent;
        if (!agent) return [];
        return (agent.signalSources || []).map((source) => ({
            key: source,
            label: SIGNAL_LABELS[source] || source,
        }));
    }

    get crossDomainLinks() {
        const agent = this.selectedAgent;
        if (!agent || !agent.crossDomainLinks) return [];
        return agent.crossDomainLinks.map((link, i) => ({
            key: `xdl-${i}`,
            ...link,
        }));
    }

    get coordinationEvents() {
        const agent = this.selectedAgent;
        if (!agent || !agent.coordinationEvents) return [];
        return agent.coordinationEvents.map((evt, i) => ({
            key: `coord-${i}`,
            ...evt,
            timeLabel: formatRelativeTime(evt.timestamp),
            statusClass: `ka-coord__status ka-coord__status--${evt.status}`,
        }));
    }

    get predictedNeeds() {
        const agent = this.selectedAgent;
        if (!agent || !agent.predictedNeeds) return [];
        const now = Date.now();
        return agent.predictedNeeds.map((need, i) => {
            const dueTs = need.dueDate ? new Date(need.dueDate).getTime() : null;
            const daysAway = dueTs ? (dueTs - now) / 86_400_000 : null;
            const dueSoon = daysAway !== null && daysAway >= 0 && daysAway < 7;
            return {
                key: `pn-${i}`,
                topic: need.topic,
                confidence: need.confidence,
                confidenceStyle: `width: ${need.confidence}%`,
                source: need.source,
                dueLabel: need.dueDate ? new Date(need.dueDate).toLocaleDateString() : '',
                dueClass: dueSoon ? 'ka-need__due ka-need__due--soon' : 'ka-need__due',
            };
        });
    }

    get feedback() {
        const agent = this.selectedAgent;
        const stats = agent?.feedbackStats;
        if (!stats) return null;
        const total = stats.totalReviewed || 0;
        if (total === 0) return { total, hasData: false };

        const accepted = stats.accepted || 0;
        const modified = stats.modified || 0;
        const rejected = stats.rejected || 0;
        const acceptanceRate = Math.round((accepted / total) * 100);

        const trend = stats.confidenceTrend || [];
        let trendPoints = '';
        if (trend.length > 1) {
            const min = Math.min(...trend);
            const max = Math.max(...trend);
            const range = max - min || 1;
            const W = 160;
            const H = 32;
            trendPoints = trend
                .map((v, i) => {
                    const x = (i / (trend.length - 1)) * W;
                    const y = H - ((v - min) / range) * H;
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(' ');
        }

        return {
            total,
            hasData: true,
            acceptedStyle: `width: ${total > 0 ? (accepted / total) * 100 : 0}%`,
            modifiedStyle: `width: ${total > 0 ? (modified / total) * 100 : 0}%`,
            rejectedStyle: `width: ${total > 0 ? (rejected / total) * 100 : 0}%`,
            hasAccepted: accepted > 0,
            hasModified: modified > 0,
            hasRejected: rejected > 0,
            acceptanceRate,
            trendPoints,
            showTrend: trend.length > 1,
        };
    }

    // ── Helpers ─────────────────────────────────────────────────────
    _healthLabel(score) {
        if (score >= 85) return 'Excellent';
        if (score >= 70) return 'Healthy';
        if (score >= 50) return 'Needs Attention';
        return 'At Risk';
    }

    _healthClass(score) {
        if (score >= 85) return 'ka-health ka-health--excellent';
        if (score >= 70) return 'ka-health ka-health--healthy';
        if (score >= 50) return 'ka-health ka-health--attention';
        return 'ka-health ka-health--risk';
    }

    _activityIcon(type) {
        switch (type) {
            case 'created': return 'utility:add';
            case 'updated': return 'utility:edit';
            case 'flagged': return 'utility:warning';
            case 'linked': return 'utility:link';
            case 'deprecated': return 'utility:ban';
            case 'monitored': return 'utility:eye';
            default: return 'utility:info';
        }
    }

    // ── Motion entrance ─────────────────────────────────────────────
    // Light entrance animation: animate FROM hidden TO visible without
    // mutating the elements' inline styles up-front, so the page is
    // still legible if the motion library fails to schedule.
    _lastViewKey = null;

    renderedCallback() {
        const viewKey = this._selectedAgentId ? `detail:${this._selectedAgentId}` : 'list';
        if (viewKey === this._lastViewKey) return;
        this._lastViewKey = viewKey;

        const reduce =
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;

        const selector = this._selectedAgentId
            ? '.ka-detail__back, .ka-detail__header, .ka-detail-row'
            : '.ka-page-header, .ka-toolbar, .ka-table-wrap';
        const targets = Array.from(this.querySelectorAll(selector));
        if (!targets.length) return;

        try {
            animate(
                targets,
                { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0)'] },
                { duration: 0.4, ease: [0.2, 0.8, 0.2, 1], delay: stagger(0.06) }
            );
        } catch (_err) {
            // If motion is unavailable, leave the elements visible.
        }
    }

    disconnectedCallback() {
        this._lastViewKey = null;
    }
}
