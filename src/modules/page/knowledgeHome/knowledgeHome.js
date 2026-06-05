import { LightningElement, track } from 'lwc';
import { gsap } from 'gsap';
import { animate, inView, stagger } from 'motion';
import { navigate } from '../../../router';
import { setDraftSession } from 'data/draftSession';
import 'ui/draftAgentforceModal';

/**
 * Knowledge Home — first screen of Flow 3.
 *
 * Mirrors Figma 425:13478 (Service Console > Knowledge workspace home):
 *   - Collapsible 267px ↔ 48px left rail (motion: GSAP, identical
 *     to flow 1 / flow 2 — width tween + label opacity stagger)
 *   - Quick Actions: Draft with Agentforce / Templates / Blank Canvas
 *   - My Watchlist metric tiles
 *   - Recently Accessed list
 *   - Templates for Article cards
 *
 * Clicking "Draft with Agentforce" opens <ui-draft-agentforce-modal>;
 * on its `generate` event we stash the payload via `setDraftSession`
 * and navigate to /new-knowledge where review-article picks it up.
 */
export default class KnowledgeHome extends LightningElement {
    static renderMode = 'light';

    // ── Left rail expand/collapse state ──────────────────────────────
    @track _railExpanded = true;
    _railAnimating = false;

    // ── Modal state ──────────────────────────────────────────────────
    @track _modalOpen = false;

    // Nav rail items — `active`: which row gets the brand accent. ────
    _railTopItems = [
        { id: 'home', label: 'Home', icon: 'utility:home', active: true },
    ];

    get railTopItems() {
        return this._railTopItems.map((item) => ({
            ...item,
            rowClass: item.active ? 'kh-rail__row kh-rail__row--active' : 'kh-rail__row',
        }));
    }

    railMaintain = [
        { id: 'command-center', label: 'Command Center', icon: 'utility:trending' },
        { id: 'knowledge-agents', label: 'Knowledge Agents', icon: 'utility:agent_astro' },
        { id: 'healing-graph', label: 'Knowledge Health', icon: 'utility:graph' },
        { id: 'decision-hub', label: 'Decision Hub', icon: 'utility:dataspaces' },
    ];

    railCreate = [
        { id: 'kb-base', label: 'Knowledge Base', icon: 'utility:knowledge_base' },
        { id: 'kb-blocks', label: 'Knowledge Blocks', icon: 'utility:process' },
    ];

    // ── Quick actions ────────────────────────────────────────────────
    // Per Figma 443:50481 the cards share the same lavender surface;
    // only the icon-circle tone changes (purple = agentic, green =
    // templates, blue = blank canvas).
    get quickActions() {
        return [
            {
                id: 'draft-agentforce',
                title: 'Draft with Agentforce',
                description: 'Prompt to Agentforce to Author',
                // Same Agentforce glyph used in the global header
                // (shell/globalHeader: utility:agent_astro).
                icon: 'utility:agent_astro',
                tone: 'agentic',
            },
            {
                id: 'templates',
                title: 'Start with templates',
                description: 'Select a  Article template and Customize',
                icon: 'utility:knowledge_base',
                tone: 'green',
            },
            {
                id: 'blank',
                title: 'Start with Blank Canvas',
                description: 'Author in the in the Agentic Canvas',
                icon: 'utility:upload',
                tone: 'blue',
            },
        ].map((q) => ({
            ...q,
            cardClass: 'kh-quick-card',
            iconClass: `kh-quick-card__icon kh-quick-card__icon--${q.tone}`,
        }));
    }

    // ── Watchlist tiles (Figma "My Watchlist" section) ───────────────
    watchlist = [
        {
            id: 'total-articles',
            title: 'Total Articles',
            cadence: 'Week to Date, Facebook Ads',
            value: '12,323',
            delta: '-10%',
            deltaPositive: false,
            footerLink: 'Go to Content Health',
        },
        {
            id: 'total-searches',
            title: 'Total Searches',
            cadence: 'Week to Date, Facebook Ads',
            value: '134,323',
            delta: '-10%',
            deltaPositive: false,
            footerLink: 'Go to Search Details',
        },
        {
            id: 'total-engaged',
            title: 'Total Engaged Articles',
            cadence: 'Week to Date, Facebook Ads',
            value: '12,235',
            delta: '-10%',
            deltaPositive: false,
            footerLink: 'Go to Engagement Details',
        },
    ];

    // ── Recently accessed (3 cards) ──────────────────────────────────
    // Titles read as real knowledge articles (not agents / emails) so
    // the surface looks like an authoring workspace.
    recentlyAccessed = [
        { id: 'r1', title: 'How to Process a Customer Refund', subtitle: 'Opened today at 11:41 AM' },
        { id: 'r2', title: 'Employee Onboarding Checklist', subtitle: 'Opened yesterday at 4:58 PM' },
        { id: 'r3', title: 'Resetting Your Password & MFA', subtitle: 'Opened 3 days ago' },
    ];

    // ── Templates for Article ────────────────────────────────────────
    // Figma 443:50484 — first template carries the "selected" affordance
    // (a darker neutral-base-70 border) per the Explorations frame.
    get templates() {
        return [
            {
                id: 't1',
                title: 'Template 1',
                body: 'Lorem ipsum dolor sit amet consectetur. Non sem in facilisis cursus sapien adipiscing diam molestie. Convallis dignissim aenean nulla odio duis tincidunt gravida. Nibh sagittis sed tellus egestas tellus nec augue at.',
                selected: true,
            },
            {
                id: 't2',
                title: 'Template 2',
                body: 'Lorem ipsum dolor sit amet consectetur. Fringilla elementum imperdiet nibh suspendisse tellus. Lobortis nibh tortor eu adipiscing volutpat elementum nisl. Congue eget felis dignissim egestas integer sed est sed amet.',
                selected: false,
            },
            {
                id: 't3',
                title: 'Template 3',
                body: 'Lorem ipsum dolor sit amet consectetur. Sed turpis massa fermentum dignissim et velit. Sapien pellentesque pharetra placerat tortor semper blandit egestas. In amet tortor in elit volutpat mi pretium aenean.',
                selected: false,
            },
        ].map((t) => ({
            ...t,
            cardClass: t.selected
                ? 'kh-template-card kh-template-card--selected'
                : 'kh-template-card',
        }));
    }

    // ── Computed CSS classes ─────────────────────────────────────────
    get railClass() {
        return this._railExpanded ? 'kh-rail kh-rail--expanded' : 'kh-rail';
    }

    get collapseIconName() {
        return this._railExpanded ? 'utility:left' : 'utility:right';
    }

    get collapseAriaLabel() {
        return this._railExpanded ? 'Collapse navigation' : 'Expand navigation';
    }

    // ── Left-rail animation (mirrors flow 1 / flow 2) ────────────────
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

    // ── Left rail navigation ─────────────────────────────────────────
    handleRailNav(event) {
        const id = event.currentTarget?.dataset?.id;
        if (id === 'knowledge-agents') {
            navigate('/knowledge-agents');
        } else if (id === 'healing-graph') {
            navigate('/healing-graph');
        } else if (id === 'kb-base') {
            navigate('/knowledge-base');
        } else if (id === 'command-center') {
            navigate('/command-center');
        } else if (id === 'kb-blocks') {
            navigate('/knowledge-blocks');
        }
    }

    // ── Quick action click ────────────────────────────────────────────
    handleQuickAction(event) {
        const id = event.currentTarget?.dataset?.id;
        if (id === 'draft-agentforce') {
            // Reset before opening so the modal always lands on Step 1
            // even if the user had previously closed it mid-flow.
            const modal = this.querySelector('ui-draft-agentforce-modal');
            modal?.reset?.();
            this._modalOpen = true;
        }
    }

    // ── Modal callbacks ───────────────────────────────────────────────
    handleModalCancel() {
        this._modalOpen = false;
    }

    handleModalGenerate(event) {
        const detail = event.detail || {};
        setDraftSession({
            title: detail.title,
            recordType: detail.recordType,
            recordTypeValue: detail.recordTypeValue,
            language: detail.language,
            languageValue: detail.languageValue,
        });
        this._modalOpen = false;
        // navigate to the existing review-article route. App router
        // re-renders <page-review-article>, which consumes the session
        // on connectedCallback.
        navigate('/new-knowledge');
    }

    // ── Motion: scroll-triggered section reveals ─────────────────────
    // Each `.kh-section` starts hidden + offset; Motion's `inView`
    // (Intersection Observer under the hood) animates it into place
    // the first time it crosses 15% of the .kh-main scroll viewport.
    // Inner cards stagger in afterward for a layered reveal. We also
    // turn on smooth scroll on the container so anchor navigation
    // and wheel deltas glide rather than jump.
    renderedCallback() {
        if (this._motionInited) return;
        const scroller = this.querySelector('.kh-main');
        if (!scroller) return;
        this._motionInited = true;

        // Honor reduced-motion preferences — bail out completely so
        // sections render at their natural opacity / position.
        const reduce =
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;

        // Smooth scroll feels native and complements the reveal.
        scroller.style.scrollBehavior = 'smooth';

        const sections = Array.from(this.querySelectorAll('.kh-main .kh-section'));
        if (!sections.length) return;

        // Pre-set initial state so the page doesn't flash full-opacity
        // for one frame before the first reveal kicks in.
        const childSelector =
            '.kh-quick-card, .kh-metric-card, .kh-recent-card, .kh-template-card';
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
                        {
                            duration: 0.45,
                            ease: 'easeOut',
                            delay: stagger(0.07, { startDelay: 0.1 }),
                        }
                    );
                }
            },
            { root: scroller, amount: 0.15 }
        );
    }

    disconnectedCallback() {
        this._stopInView?.();
        this._stopInView = null;
        this._motionInited = false;
    }
}
