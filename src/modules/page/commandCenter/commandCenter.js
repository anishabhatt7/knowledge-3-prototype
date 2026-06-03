import { LightningElement, track } from 'lwc';
import { gsap } from 'gsap';
import { animate } from 'motion';
import { navigate } from '../../../router';
import { setRecord } from 'data/recordSession';
import { setEditSession } from 'data/editSession';
import { getArticleEdit } from 'data/articleEdits';
import {
    seedAIReadiness,
    seedStructuralViolations,
} from 'data/commandCenter';

/**
 * Knowledge Health page (formerly "Command Center" — renamed per
 * Figma frame 214-32880).
 *
 * Three sections sit inside the cc-main scroller:
 *   1. Page header (Astro icon + title + subtitle + search).
 *   2. Two-card overview row — Knowledge AI Readiness donut on the
 *      left, Total Articles big-number + sparkline on the right.
 *   3. Structural Violations data table with a per-row action menu
 *      (Approve changes / Edit to Resolve). "Edit to Resolve" stashes
 *      the article in `data/editSession` and hands off to the Review
 *      Article (active authoring) page in a new workspace tab, the
 *      same path used by the Knowledge Record violations CTA.
 */
export default class CommandCenter extends LightningElement {
    static renderMode = 'light';

    // ── Left rail state ─────────────────────────────────────────────
    @track _railExpanded = true;
    _railAnimating = false;

    _railTopItems = [
        { id: 'home', label: 'Home', icon: 'utility:home', active: false },
    ];

    // The "Maintain" group exposes a single rail entry. The id stays
    // `command-center` (matches the route navHighlight) but the label
    // is "Knowledge Health" per the new design.
    railMaintain = [
        { id: 'command-center', label: 'Knowledge Health', icon: 'utility:graph', active: true },
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
        // `/home` maps to page-knowledge-home; `/` is the editor-landing
        // route used by the v2 prototype's first-visit seed and would
        // drop the user back into the active authoring experience
        // instead of the Knowledge home page.
        if (id === 'home') navigate('/home');
        else if (id === 'knowledge-agents') navigate('/knowledge-agents');
        else if (id === 'healing-graph') navigate('/healing-graph');
        else if (id === 'kb-base') navigate('/knowledge-base');
        else if (id === 'kb-blocks') navigate('/knowledge-blocks');
    }

    // ── AI Readiness donut ──────────────────────────────────────────
    _aiReadiness = seedAIReadiness;

    get donutRadius() { return 70; }
    get donutCircumference() { return 2 * Math.PI * this.donutRadius; }
    get donutOffset() { return this.donutCircumference * (1 - this._aiReadiness.overall / 100); }
    get donutDasharray() { return String(this.donutCircumference); }
    get donutDashoffset() { return String(this.donutOffset); }
    get readinessOverall() { return `${this._aiReadiness.overall}%`; }

    // ── Total Articles card ─────────────────────────────────────────
    // Static prototype values — match the Figma frame's hero card.
    totalArticlesValue = '123,456';
    totalArticlesBadge = 'Acceptable';
    totalArticlesDelta = '-10%';
    totalArticlesPeriod = 'period vs period';

    // Inline SVG sparkline points for the trend chart — pre-computed
    // so the template stays declarative. The trailing dashed segment
    // mirrors the "projected" tail in the Figma frame, and the
    // forecast band widens around the projection to convey
    // increasing uncertainty over time (Figma 214:33138).
    sparkPath = 'M 0 82 L 50 80 L 100 78 L 150 72 L 200 60 L 260 50';
    sparkProjectedPath = 'M 260 50 L 340 42 L 420 32 L 470 25';
    sparkForecastPath = 'M 260 50 L 470 0 L 470 50 L 260 60 Z';
    sparkGoalY = '40';

    // ── Structural Violations table ─────────────────────────────────
    @track _violations = seedStructuralViolations.map((v) => ({
        ...v,
        selected: false,
        menuOpen: false,
    }));
    @track _allSelected = false;

    get violationsComputed() {
        // The AI Score column is locked to a descending sort, matching
        // the column header arrow indicator. Scores are stored as
        // formatted strings like "+ 6%" / "− 4%" (using U+2212 unicode
        // minus, not ASCII "-"), so normalise the sign before parseFloat.
        const parseScore = (raw) => {
            const normalised = String(raw).replace('−', '-').replace(/[\s%]/g, '');
            const n = parseFloat(normalised);
            return Number.isNaN(n) ? 0 : n;
        };
        return [...this._violations]
            .sort((a, b) => parseScore(b.aiScore) - parseScore(a.aiScore))
            .map((v) => ({
                ...v,
                aiCellClass: v.aiTone === 'positive'
                    ? 'cc-vt__ai cc-vt__ai--positive'
                    : 'cc-vt__ai cc-vt__ai--warning',
                menuClass: v.menuOpen ? 'cc-vt__menu cc-vt__menu--open' : 'cc-vt__menu',
                actionsCellClass: v.menuOpen
                    ? 'cc-vt__cell cc-vt__cell--actions cc-vt__cell--actions-open'
                    : 'cc-vt__cell cc-vt__cell--actions',
            }));
    }

    handleSelectAll(event) {
        const checked = !!event.target?.checked;
        this._allSelected = checked;
        this._violations = this._violations.map((v) => ({ ...v, selected: checked }));
    }

    handleSelectRow(event) {
        const id = event.target?.dataset?.id;
        const checked = !!event.target?.checked;
        this._violations = this._violations.map((v) =>
            v.id === id ? { ...v, selected: checked } : v
        );
        this._allSelected = this._violations.every((v) => v.selected);
    }

    /**
     * Open the Knowledge Article record for the clicked violation row
     * in a new workspace tab. Mirrors the list-view pattern in
     * `knowledgeBase.js`: stash record metadata via `setRecord`,
     * dispatch `workspace:addtab` so the global tab strip shows the
     * new tab, then navigate to the parametric record route. Closing
     * the tab returns the user to `/command-center` via the shell's
     * `originPath` mechanism.
     */
    handleArticleOpen(event) {
        event.preventDefault();
        const id = event.currentTarget?.dataset?.id;
        const row = this._violations.find((v) => v.id === id);
        if (!row) return;
        setRecord({
            id: row.id,
            title: row.article,
            articleRecordType: 'FAQ',
            language: 'English',
            currentVersion: '1',
            isKnowledgeBlock: false,
        });
        const path = `/knowledge-record/${encodeURIComponent(row.id)}`;
        window.dispatchEvent(new CustomEvent('workspace:addtab', {
            detail: {
                label: row.article,
                path,
                originPath: '/command-center',
            },
        }));
        navigate(path);
    }

    handleViolationMenuToggle(event) {
        event.stopPropagation();
        const id = event.currentTarget?.dataset?.id;
        // Close any other open menu so only one popover is visible at
        // a time — mirrors the row-actions UX in lightning-datatable.
        this._violations = this._violations.map((v) => ({
            ...v,
            menuOpen: v.id === id ? !v.menuOpen : false,
        }));
        this._ensureDocumentClickListener();
    }

    handleApproveChanges(event) {
        event.stopPropagation();
        const id = event.currentTarget?.dataset?.id;
        // Close the menu and mark the row as resolved (purely visual
        // for the prototype — drops the row from the displayed list).
        this._violations = this._violations
            .map((v) => ({ ...v, menuOpen: false }))
            .filter((v) => v.id !== id);
    }

    handleEditToResolve(event) {
        event.stopPropagation();
        const id = event.currentTarget?.dataset?.id;
        const row = this._violations.find((v) => v.id === id);
        if (!row) return;
        // Close any open menus before navigating.
        this._violations = this._violations.map((v) => ({ ...v, menuOpen: false }));
        this._launchActiveAuthoring(row);
    }

    /**
     * Opens the Review Article (active authoring) experience in a new
     * workspace tab seeded with the violation's article context. The
     * tab's `originPath` is `/command-center` so closing the editor
     * returns the user here. Mirrors `KnowledgeRecord._launchActive
     * Authoring` so saved edits flow through `data/articleEdits` and
     * the same `article:saved` event bus.
     */
    _launchActiveAuthoring(row) {
        if (!row?.id) return;
        const id = row.id;
        const title = row.article;
        const existing = getArticleEdit(id);
        // Seed the editor with any in-flight edit, otherwise leave the
        // body blank — the Review Article page will fall back to its
        // own `_blocksToHtml(initialArticle.blockData)` path when no
        // seed HTML is supplied.
        const seedHtml = existing?.html || null;

        setEditSession({
            id,
            title,
            html: seedHtml,
            recordType: 'FAQ',
            originPath: '/command-center',
            violation: { description: row.description, score: row.aiScore },
        });

        // Mirror the article into recordSession so a deep-link refresh
        // of the editor route still finds metadata (title, version).
        setRecord({
            id,
            title,
            articleRecordType: 'FAQ',
            language: 'English',
            currentVersion: '1',
            isKnowledgeBlock: false,
        });

        const path = `/edit-article/${encodeURIComponent(id)}`;
        const tabLabel = `Edit: ${title}`;
        window.dispatchEvent(
            new CustomEvent('workspace:addtab', {
                detail: {
                    label: tabLabel,
                    path,
                    kind: 'editor',
                    originPath: '/command-center',
                },
            })
        );
        navigate(path);
    }

    /**
     * Open the article review queue in a new workspace tab and drive
     * the GSAP-powered hand-off animation.
     *
     * The trigger is a native `<button>` (see commandCenter.html);
     * `lightning-button` was swapped out because its shadow-DOM click
     * doesn't surface to LWC template `onclick` bindings consistently
     * in this synthetic-shadow prototype, leaving the queue CTA
     * silently inert. Native `onclick` is reliable and lets the
     * transition flow run end-to-end. The queue page (page-review-
     * queue) hosts the side-by-side current vs. suggested compare
     * experience driven by `data/reviewQueue` seed; closing the tab
     * returns the user to /command-center via the shell's
     * `originPath` mechanism.
     */
    handleReviewInQueue(event) {
        this._reviewInQueueTransition(event);
    }

    // Close the open row-actions menu when the user clicks outside it.
    _docClickHandler = null;

    _ensureDocumentClickListener() {
        if (this._docClickHandler) return;
        this._docClickHandler = (e) => {
            if (!this._violations.some((v) => v.menuOpen)) return;
            const inside = e.target?.closest?.('.cc-vt__cell--actions');
            if (inside) return;
            this._violations = this._violations.map((v) => ({ ...v, menuOpen: false }));
        };
        document.addEventListener('click', this._docClickHandler);
    }

    disconnectedCallback() {
        if (this._docClickHandler) {
            document.removeEventListener('click', this._docClickHandler);
            this._docClickHandler = null;
        }
    }

    // ── Motion entrance ─────────────────────────────────────────────
    _motionInited = false;
    _scoreAnimated = false;
    _sparkAnimated = false;

    renderedCallback() {
        // Always force the donut label / ring into a known-good state on
        // every render. This guards against stale DOM left by older
        // animation logic across HMR boundaries.
        this._animateReadinessScore();
        this._animateSparkline();

        if (this._motionInited) return;
        const scroller = this.querySelector('.cc-main');
        if (!scroller) return;
        this._motionInited = true;
        scroller.style.scrollBehavior = 'smooth';
    }

    /**
     * GSAP-driven exit animation for the Knowledge Health → Review
     * Queue hand-off, followed by the route swap. The matching
     * entrance animation lives in `reviewQueue.renderedCallback`.
     * Guarded by `_navigating` so a mash on the button doesn't queue
     * overlapping tweens. `prefers-reduced-motion` skips the tween.
     */
    _navigating = false;

    _reviewInQueueTransition(event) {
        event?.stopPropagation?.();
        if (this._navigating) return;
        const path = '/review-queue';
        const doNav = () => {
            window.dispatchEvent(
                new CustomEvent('workspace:addtab', {
                    detail: {
                        label: 'Review Queue',
                        path,
                        kind: 'editor',
                        originPath: '/command-center',
                    },
                })
            );
            navigate(path);
        };

        const main = this.querySelector('.cc-main');
        const reduce =
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!main || !gsap || reduce) {
            doNav();
            return;
        }

        this._navigating = true;
        gsap.to(main, {
            opacity: 0,
            y: -12,
            duration: 0.28,
            ease: 'power2.in',
            onComplete: doNav,
        });
    }

    /**
     * Draw-on entrance for the Total Articles sparkline. Uses GSAP to
     * animate `stroke-dashoffset` from the full path length down to 0
     * so the trend line appears to grow from left to right. The dashed
     * projection segment draws in second (after the solid trend has
     * rendered), and the forecast confidence band fades in alongside
     * it. Runs once per mount and respects `prefers-reduced-motion`.
     */
    _animateSparkline() {
        if (this._sparkAnimated) return;
        const trendEl = this.querySelector('.cc-spark-line:not(.cc-spark-line--projected)');
        const projectedEl = this.querySelector('.cc-spark-line--projected');
        const forecastEl = this.querySelector('.cc-spark-forecast');
        if (!trendEl || !projectedEl) return;
        this._sparkAnimated = true;

        const reduce =
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce || !gsap) return;

        // `getTotalLength()` returns the total path length in user units
        // (the SVG viewBox 0-480 wide × 0-110 tall). Setting both
        // dasharray and dashoffset to that length hides the stroke
        // entirely; tweening offset back to 0 then "draws" the line.
        try {
            const trendLength = trendEl.getTotalLength();
            const projectedLength = projectedEl.getTotalLength();

            gsap.set(trendEl, {
                strokeDasharray: trendLength,
                strokeDashoffset: trendLength,
            });
            // Preserve the dashed visual on the projected segment by
            // pairing the existing 6-4 dash pattern with a long offset
            // — animating to 0 reveals it left-to-right while keeping
            // the dotted appearance once drawn.
            gsap.set(projectedEl, {
                strokeDasharray: `${projectedLength} ${projectedLength}`,
                strokeDashoffset: projectedLength,
            });
            if (forecastEl) {
                gsap.set(forecastEl, { opacity: 0 });
            }

            const tl = gsap.timeline({ delay: 0.35 });
            tl.to(trendEl, {
                strokeDashoffset: 0,
                duration: 1.4,
                ease: 'power2.out',
            });
            tl.to(
                projectedEl,
                {
                    strokeDashoffset: 0,
                    duration: 0.9,
                    ease: 'power1.out',
                    // After the projection has finished drawing, restore
                    // the original dashed visual so the segment matches
                    // its static design.
                    onComplete: () => {
                        projectedEl.style.strokeDasharray = '6 4';
                        projectedEl.style.strokeDashoffset = '0';
                    },
                },
                '-=0.15'
            );
            if (forecastEl) {
                tl.to(
                    forecastEl,
                    { opacity: 1, duration: 0.6, ease: 'power1.out' },
                    '-=0.7'
                );
            }
        } catch (_) {
            // gsap unavailable / SVG API failure — leave the chart at
            // its static (already-drawn) state.
        }
    }

    /**
     * Count-up entrance for the AI Readiness donut: animates the
     * percentage label from 0 up to the target value and fills the
     * SVG ring in sync. Runs once per mount and respects
     * prefers-reduced-motion.
     */
    _animateReadinessScore() {
        // Always force the percentage label to the canonical value on
        // every render — guards against stale textContent left by
        // earlier (now-removed) animation logic across HMR updates.
        const labelEl = this.querySelector('.cc-donut-label__value');
        if (labelEl) {
            labelEl.textContent = `${this._aiReadiness.overall}%`;
        }

        // Animate the SVG ring from full circumference (empty) up to its
        // computed final offset using motion.animate(). Runs once per
        // mount; if the animation is unavailable, the template binding
        // already places the ring at the final value.
        if (this._scoreAnimated) return;
        const ringEl = this.querySelector('.cc-donut-fg');
        if (!ringEl) return;
        this._scoreAnimated = true;

        const circumference = this.donutCircumference;
        const finalOffset = this.donutOffset;
        try {
            animate(
                ringEl,
                { strokeDashoffset: [circumference, finalOffset] },
                { duration: 1.4, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }
            );
        } catch (_) {
            ringEl.setAttribute('stroke-dashoffset', String(finalOffset));
        }
    }
}
