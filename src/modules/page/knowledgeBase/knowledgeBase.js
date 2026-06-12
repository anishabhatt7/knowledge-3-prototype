import { LightningElement, track } from 'lwc';
import { gsap } from 'gsap';
import { navigate } from '../../../router';
import { setRecord } from 'data/recordSession';
import 'ui/knowledgePageHeader';
import 'ui/knowledgeDataTable';

/**
 * Knowledge Base — list-view page (Recently Viewed Knowledge).
 *
 * Mirrors Flow 1 / Flow 2's `main-knowledge-page-header`
 * + `main-knowledge-data-table` pair, hosted in the Knowledge 3.0
 * shell with the same collapsible left rail used by Knowledge Home
 * and the Healing Graph page. Reached via the rail's
 * "Create > Knowledge Base" item (kb-base).
 */
export default class KnowledgeBase extends LightningElement {
    static renderMode = 'light';

    // ── Left rail state ─────────────────────────────────────────────
    @track _railExpanded = true;
    _railAnimating = false;

    _railTopItems = [
        { id: 'home', label: 'Home', icon: 'utility:home', active: false },
    ];

    railMaintain = [
        { id: 'command-center', label: 'Command Center', icon: 'utility:trending' },
        { id: 'healing-graph', label: 'Knowledge Health', icon: 'utility:graph' },
        { id: 'knowledge-agents', label: 'Knowledge Agents', icon: 'utility:agent_astro' },
    ];

    railCreate = [
        { id: 'kb-base', label: 'Knowledge Base', icon: 'utility:knowledge_base', active: true },
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

    get railCreateComputed() {
        return this.railCreate.map((item) => ({
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

    // GSAP-driven width tween + label opacity stagger — copied from
    // healingGraph / knowledgeHome so motion stays identical across
    // pages that share the rail.
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
        } else if (id === 'healing-graph') {
            navigate('/healing-graph');
        } else if (id === 'kb-base') {
            // already here — no-op
        } else if (id === 'command-center') {
            navigate('/command-center');
        } else if (id === 'kb-blocks') {
            navigate('/knowledge-blocks');
        }
    }

    /**
     * Open the clicked article as a Knowledge Article record page in a
     * new workspace tab (read view), matching the v2 prototype's
     * `/knowledge-record/:id` flow. The tab is made active on open, and
     * closing it returns here via the shell's `originPath` mechanism —
     * which unmounts the record page along with the tab.
     */
    handleViewRecord(event) {
        const { id, title, language } = event.detail || {};
        if (!id || !title) return;
        setRecord({
            id,
            title,
            language: language || 'English',
            articleRecordType: 'FAQ',
            isKnowledgeBlock: false,
        });
        const path = `/knowledge-record/${encodeURIComponent(id)}`;
        window.dispatchEvent(new CustomEvent('workspace:addtab', {
            detail: { label: title, path, originPath: '/knowledge-base' },
        }));
        navigate(path);
    }

    // ── Page entrance motion ─────────────────────────────────────────
    // A GSAP reveal on first render — the page header and data table
    // glide up and fade in, matching the entrance used on the other
    // pages (knowledgeHome / healingGraph).
    renderedCallback() {
        if (this._motionInited) return;
        const shell = this.querySelector('.kb-shell');
        if (!shell) return;
        this._motionInited = true;
        this._playEntrance(shell);
    }

    disconnectedCallback() {
        this._motionInited = false;
    }

    _playEntrance(shell) {
        const reduce =
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;

        const items = Array.from(shell.children);
        if (!items.length) return;

        gsap.from(items, {
            opacity: 0,
            y: 18,
            duration: 0.5,
            ease: 'power2.out',
            stagger: 0.1,
            clearProps: 'opacity,transform',
        });
    }
}
