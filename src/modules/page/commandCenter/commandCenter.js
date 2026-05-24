import { LightningElement, track } from 'lwc';
import { gsap } from 'gsap';
import { animate, inView, stagger } from 'motion';
import { navigate } from '../../../router';
import { setDraftSession } from 'data/draftSession';
import {
    seedAIReadiness,
    seedCapabilitySummaries,
    seedWatchlist,
    seedActionItems,
} from 'data/commandCenter';

export default class CommandCenter extends LightningElement {
    static renderMode = 'light';

    // ── Left rail state ─────────────────────────────────────────────
    @track _railExpanded = true;
    _railAnimating = false;

    _railTopItems = [
        { id: 'home', label: 'Home', icon: 'utility:home', active: false },
    ];

    railMaintain = [
        { id: 'command-center', label: 'Command Center', icon: 'utility:trending', active: true },
        { id: 'knowledge-agents', label: 'Knowledge Agents', icon: 'utility:agent_astro' },
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
        if (id === 'home') navigate('/');
        else if (id === 'knowledge-agents') navigate('/knowledge-agents');
        else if (id === 'healing-graph') navigate('/healing-graph');
        else if (id === 'kb-base') navigate('/knowledge-base');
        else if (id === 'kb-blocks') navigate('/knowledge-blocks');
    }

    // ── Data ────────────────────────────────────────────────────────
    _aiReadiness = seedAIReadiness;
    watchlist = seedWatchlist;
    @track _actionItems = seedActionItems.map((item, idx) => ({
        ...item,
        expanded: idx === 0,
    }));

    // ── AI Readiness donut ──────────────────────────────────────────
    get donutRadius() { return 70; }
    get donutCircumference() { return 2 * Math.PI * this.donutRadius; }
    get donutOffset() { return this.donutCircumference * (1 - this._aiReadiness.overall / 100); }
    get donutDasharray() { return String(this.donutCircumference); }
    get donutDashoffset() { return String(this.donutOffset); }
    get readinessOverall() { return `${this._aiReadiness.overall}%`; }

    get dimensionsComputed() {
        return this._aiReadiness.dimensions.map((dim) => ({
            ...dim,
            barStyle: `width: ${dim.score}%`,
        }));
    }

    // ── Capability summary cards ────────────────────────────────────
    // Map a capability card's `key` to a route. Keys without a mapping
    // render as non-interactive cards (no role/tabindex/cursor change).
    _capabilityRoutes = {
        healing: '/healing-graph',
    };

    get capabilitySummariesComputed() {
        return seedCapabilitySummaries.map((s) => {
            const route = this._capabilityRoutes[s.key];
            const isInteractive = Boolean(route);
            // Split "+12% this week" → number "+12%" + label " this week"
            // so the numeric portion can be coloured independently.
            const match = /^([+-]?\d+(?:[.,]\d+)?%?)(.*)$/.exec(s.trendValue || '');
            const trendNumber = match ? match[1] : (s.trendValue || '');
            const trendLabel = match ? match[2] : '';
            return {
                ...s,
                trendIcon: s.trend === 'up' ? 'utility:arrowup' : s.trend === 'down' ? 'utility:arrowdown' : 'utility:dash',
                trendNumber,
                trendLabel,
                trendClass:
                    s.trend === 'up'
                        ? 'cc-capability-card__trend cc-capability-card__trend--up'
                        : s.trend === 'down'
                            ? 'cc-capability-card__trend cc-capability-card__trend--down'
                            : 'cc-capability-card__trend',
                cardClass: isInteractive
                    ? 'cc-capability-card cc-capability-card--clickable'
                    : 'cc-capability-card',
                cardRole: isInteractive ? 'button' : null,
                cardTabIndex: isInteractive ? '0' : null,
                cardAriaLabel: isInteractive ? `Open ${s.metric}` : null,
            };
        });
    }

    handleCapabilityClick(event) {
        const key = event.currentTarget?.dataset?.key;
        const route = this._capabilityRoutes[key];
        if (route) navigate(route);
    }

    handleCapabilityKeyDown(event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const key = event.currentTarget?.dataset?.key;
        const route = this._capabilityRoutes[key];
        if (!route) return;
        event.preventDefault();
        navigate(route);
    }

    // ── Actions for you ─────────────────────────────────────────────
    get actionItemsComputed() {
        return this._actionItems.map((item) => ({
            ...item,
            rowClass: item.highlighted
                ? 'cc-action-row cc-action-row--highlighted'
                : 'cc-action-row',
            chevronIcon: item.expanded ? 'utility:chevrondown' : 'utility:chevronright',
            showTable: item.expanded && item.tableData && item.tableData.length > 0,
            priorityLabel: item.priority === 'high' ? 'High Priority' : item.priority,
            priorityBadgeClass: item.priority === 'high' ? 'cc-priority-badge cc-priority-badge--high' : 'cc-priority-badge',
            hasPriority: !!item.priority,
        }));
    }

    handleToggleAction(event) {
        const id = event.currentTarget.dataset.id;
        this._actionItems = this._actionItems.map((item) => ({
            ...item,
            expanded: item.id === id ? !item.expanded : item.expanded,
        }));
    }

    handleReviewDraft(event) {
        const title = event.currentTarget.dataset.title || 'Untitled Article';
        setDraftSession({ title });
        window.dispatchEvent(new CustomEvent('workspace:addtab', {
            detail: { label: title, path: '/new-knowledge' },
        }));
        navigate('/new-knowledge');
    }

    // ── Motion entrance ─────────────────────────────────────────────
    _motionInited = false;
    _stopInView = null;
    _scoreAnimated = false;
    _scoreTween = null;
    _ringTween = null;
    _dimensionsAnimated = false;
    _dimensionTweens = null;

    renderedCallback() {
        if (this._motionInited) return;
        const scroller = this.querySelector('.cc-main');
        if (!scroller) return;
        this._motionInited = true;

        const reduce =
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;

        scroller.style.scrollBehavior = 'smooth';

        const sections = Array.from(this.querySelectorAll('.cc-main .cc-section'));
        if (!sections.length) return;

        const childSelector = '.cc-readiness-card, .cc-capability-card, .cc-metric-card, .cc-actions-panel';
        sections.forEach((section) => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(24px)';
            section.querySelectorAll(childSelector).forEach((card) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(16px)';
            });
        });

        this._stopInView = inView(
            sections,
            (section) => {
                animate(
                    section,
                    { opacity: [0, 1], y: [24, 0] },
                    { duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }
                );
                const cards = section.querySelectorAll(childSelector);
                if (cards.length) {
                    animate(
                        cards,
                        { opacity: [0, 1], y: [16, 0] },
                        { duration: 0.45, ease: 'easeOut', delay: stagger(0.07, { startDelay: 0.1 }) }
                    );
                }
            },
            { root: scroller, amount: 0.15 }
        );

        this._animateReadinessScore();
        this._animateReadinessDimensions();
    }

    /**
     * Count-up entrance for the AI Readiness donut: animates the percentage
     * label from 0 up to the target value and fills the SVG ring in sync.
     * Runs once per mount and respects prefers-reduced-motion.
     */
    _animateReadinessScore() {
        if (this._scoreAnimated) return;
        const labelEl = this.querySelector('.cc-donut-label__value');
        const ringEl = this.querySelector('.cc-donut-fg');
        if (!labelEl || !gsap) return;
        this._scoreAnimated = true;

        const target = this._aiReadiness.overall;

        if (ringEl) {
            // Disable CSS transition so GSAP's per-frame updates render cleanly.
            ringEl.style.transition = 'none';
        }

        labelEl.textContent = '0%';
        const counter = { val: 0 };
        this._scoreTween = gsap.to(counter, {
            val: target,
            duration: 1.6,
            ease: 'power2.out',
            delay: 0.25,
            onUpdate: () => {
                labelEl.textContent = `${Math.round(counter.val)}%`;
            },
            onComplete: () => {
                labelEl.textContent = `${target}%`;
            },
        });

        if (ringEl) {
            const circumference = this.donutCircumference;
            const finalOffset = this.donutOffset;
            this._ringTween = gsap.fromTo(
                ringEl,
                { strokeDashoffset: circumference },
                {
                    strokeDashoffset: finalOffset,
                    duration: 1.6,
                    ease: 'power2.out',
                    delay: 0.25,
                    onComplete: () => {
                        // Restore the CSS transition for any future stroke updates.
                        ringEl.style.transition = '';
                    },
                }
            );
        }
    }

    /**
     * Count-up entrance for each readiness dimension: animates the score
     * number from 0 up to the target and fills the progress bar in sync.
     * Uses scaleX (not width) on the bar fill so we don't fight the
     * existing CSS `transition: width` rule and stay on the compositor.
     * Runs once per mount; gated by the prefers-reduced-motion check
     * in renderedCallback().
     */
    _animateReadinessDimensions() {
        if (this._dimensionsAnimated) return;
        if (!gsap) return;
        const dimEls = Array.from(this.querySelectorAll('.cc-dimension'));
        if (!dimEls.length) return;
        this._dimensionsAnimated = true;

        const targets = this._aiReadiness.dimensions;
        this._dimensionTweens = [];

        dimEls.forEach((dimEl, i) => {
            const target = targets[i];
            if (!target) return;
            const scoreEl = dimEl.querySelector('.cc-dimension__score');
            const fillEl = dimEl.querySelector('.cc-dimension__bar-fill');
            if (!scoreEl || !fillEl) return;

            scoreEl.textContent = '0%';
            gsap.set(fillEl, { scaleX: 0, transformOrigin: 'left center' });

            const duration = 1.2;
            const delay = 0.3 + i * 0.08;
            const ease = 'power2.out';

            const counter = { val: 0 };
            const counterTween = gsap.to(counter, {
                val: target.score,
                duration,
                delay,
                ease,
                onUpdate: () => {
                    scoreEl.textContent = `${Math.round(counter.val)}%`;
                },
                onComplete: () => {
                    scoreEl.textContent = `${target.score}%`;
                },
            });

            const fillTween = gsap.to(fillEl, {
                scaleX: 1,
                duration,
                delay,
                ease,
            });

            this._dimensionTweens.push(counterTween, fillTween);
        });
    }

    disconnectedCallback() {
        this._stopInView?.();
        this._stopInView = null;
        this._motionInited = false;
        this._scoreTween?.kill();
        this._ringTween?.kill();
        this._scoreTween = null;
        this._ringTween = null;
        this._scoreAnimated = false;
        if (this._dimensionTweens) {
            this._dimensionTweens.forEach((t) => t?.kill());
            this._dimensionTweens = null;
        }
        this._dimensionsAnimated = false;
    }
}
