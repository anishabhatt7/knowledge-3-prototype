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
    seedQualityIssues,
} from 'data/commandCenter';

/**
 * Knowledge Health page (formerly "Command Center" — renamed per
 * Figma frame 214-32880).
 *
 * Four sections sit inside the cc-main scroller:
 *   1. Page header (Astro icon + title + subtitle + search).
 *   2. Two-card overview row — Knowledge AI Readiness donut on the
 *      left, Total Articles big-number + sparkline on the right.
 *   3. Top Structural Violations to Resolve — a stack of expandable
 *      tiles (Figma 612-43216 / 612-70638). Each tile shows the
 *      article, a violations + AI Score badge pair, a one-line
 *      summary and an "Edit to Resolve" action; the chevron expands
 *      the per-issue breakdown. "Edit to Resolve" stashes the article
 *      in `data/editSession` and hands off to the Review Article
 *      (active authoring) page in a new workspace tab — the same path
 *      used by the Knowledge Record violations CTA.
 *   4. Top Quality Issues to Resolve — contradiction / similarity
 *      cards (Figma 612-71226) comparing two source articles side by
 *      side with Ignore / Merge / Archive actions.
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

    // ── Structural Violations tiles ─────────────────────────────────
    // Each violation renders as an expandable tile (Figma 612-43216 /
    // 612-70638). Tiles start collapsed so the list reads as a compact
    // summary on load.
    @track _violations = seedStructuralViolations.map((v) => ({
        ...v,
        expanded: false,
    }));

    get violationsComputed() {
        // AI Score badges are locked to a descending sort, matching the
        // ranked "Top … to Resolve" framing. Scores are stored as plain
        // percent strings like "9%".
        const parseScore = (raw) => {
            const n = parseFloat(String(raw).replace(/[\s%]/g, ''));
            return Number.isNaN(n) ? 0 : n;
        };
        return [...this._violations]
            .sort((a, b) => parseScore(b.aiScore) - parseScore(a.aiScore))
            .map((v) => ({
                ...v,
                tileClass: v.expanded
                    ? 'cc-sv__tile cc-sv__tile--expanded'
                    : 'cc-sv__tile',
                chevronIcon: v.expanded ? 'utility:chevrondown' : 'utility:chevronright',
                aiScoreLabel: `AI Score: ${v.aiScore}`,
                violationsLabel: `${v.violations} Violations`,
                issues: (v.issues || []).map((issue) => ({
                    ...issue,
                    iconName: this._issueIconName(issue.tone),
                    iconClass: issue.tone === 'warning'
                        ? 'cc-sv__issue-icon cc-sv__issue-icon--warning'
                        : 'cc-sv__issue-icon cc-sv__issue-icon--info',
                })),
            }));
    }

    _issueIconName(tone) {
        if (tone === 'list') return 'utility:list';
        if (tone === 'enrich') return 'utility:data_graph';
        return 'utility:warning';
    }

    // Tiles currently mid-animation (keyed by violation id) — guards
    // against a rapid double-click queuing overlapping GSAP tweens.
    _tileAnimating = {};

    handleToggleViolation(event) {
        const id = event.currentTarget?.dataset?.id;
        if (!id || this._tileAnimating[id]) return;
        const row = this._violations.find((v) => v.id === id);
        if (!row) return;

        const reduce =
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (row.expanded) {
            // ── Collapse ──────────────────────────────────────────────
            // Animate the panel's height/opacity down first, then drop
            // it from the DOM by flipping `expanded` on completion.
            const panel = this._issuesPanelForId(id);
            if (!panel || !gsap || reduce) {
                this._setExpanded(id, false);
                return;
            }
            this._tileAnimating[id] = true;
            gsap.to(panel, {
                height: 0,
                opacity: 0,
                duration: 0.3,
                ease: 'power2.inOut',
                onComplete: () => {
                    this._tileAnimating[id] = false;
                    this._setExpanded(id, false);
                },
            });
        } else {
            // ── Expand ────────────────────────────────────────────────
            // Flip state so LWC renders the panel, then reveal it on the
            // next animation frame (by which point the microtask render
            // has committed the markup to the DOM — same sequencing the
            // left-rail expand uses).
            this._setExpanded(id, true);
            if (!gsap || reduce) return;
            this._tileAnimating[id] = true;
            requestAnimationFrame(() => this._animateExpand(id));
        }
    }

    _setExpanded(id, expanded) {
        this._violations = this._violations.map((v) =>
            v.id === id ? { ...v, expanded } : v
        );
    }

    /**
     * Resolve the `.cc-sv__issues` panel for a given violation id by
     * walking up from the summary toggle (which carries the data-id) to
     * its owning tile, then back down to the issues container. Returns
     * null when the tile is collapsed (no panel rendered).
     */
    _issuesPanelForId(id) {
        const btn = this.querySelector(`.cc-sv__summary[data-id="${id}"]`);
        const tile = btn && btn.closest('.cc-sv__tile');
        return tile ? tile.querySelector('.cc-sv__issues') : null;
    }

    /**
     * GSAP height-reveal for a freshly expanded tile: grows the panel
     * from 0 to its natural height while fading in, and floats the
     * individual issue rows up in a quick stagger. Inline styles are
     * cleared on completion so the layout reflows normally afterward.
     */
    _animateExpand(id) {
        const panel = this._issuesPanelForId(id);
        if (!panel || !gsap) {
            this._tileAnimating[id] = false;
            return;
        }
        const rows = panel.querySelectorAll('.cc-sv__issue');
        // Measure the natural height while the panel is laid out, then
        // collapse to 0 and tween back up.
        gsap.set(panel, { height: 'auto', opacity: 1, overflow: 'hidden' });
        const fullHeight = panel.offsetHeight;
        gsap.fromTo(
            panel,
            { height: 0, opacity: 0 },
            {
                height: fullHeight,
                opacity: 1,
                duration: 0.36,
                ease: 'power2.out',
                onComplete: () => {
                    panel.style.height = '';
                    panel.style.opacity = '';
                    panel.style.overflow = '';
                    this._tileAnimating[id] = false;
                },
            }
        );
        gsap.from(rows, {
            y: 8,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.out',
            stagger: 0.05,
            delay: 0.06,
        });
    }

    handleEditToResolve(event) {
        event.stopPropagation();
        const id = event.currentTarget?.dataset?.id;
        const row = this._violations.find((v) => v.id === id);
        if (!row) return;
        this._launchActiveAuthoring(row);
    }

    handleApproveAll() {
        // Prototype-only: clear the violations list to signal a bulk
        // approval. The Review-in-Queue CTA owns the richer flow.
        this._violations = [];
    }

    // ── Top Quality Issues cards (Figma 612-71226) ──────────────────
    @track _qualityIssues = seedQualityIssues;

    get qualityIssuesComputed() {
        return this._qualityIssues.map((q) => ({
            ...q,
            showMerge: q.variant === 'similarity',
        }));
    }

    /**
     * Open the Knowledge Article behind a quality-issue column (or a
     * structural-violation tile) in a new workspace tab. Mirrors the
     * list-view hand-off in `knowledgeBase.js`: stash record metadata
     * via `setRecord`, announce the tab on the global strip, then
     * navigate to the parametric record route. Closing the tab returns
     * the user to `/command-center` via the shell's `originPath`.
     */
    _openArticle(id, title) {
        if (!id) return;
        setRecord({
            id,
            title,
            articleRecordType: 'FAQ',
            language: 'English',
            currentVersion: '1',
            isKnowledgeBlock: false,
        });
        const path = `/knowledge-record/${encodeURIComponent(id)}`;
        window.dispatchEvent(new CustomEvent('workspace:addtab', {
            detail: { label: title, path, originPath: '/command-center' },
        }));
        navigate(path);
    }

    handleQualityArticleOpen(event) {
        event.preventDefault();
        const { id, title } = event.currentTarget?.dataset || {};
        this._openArticle(id, title);
    }

    handleIgnoreQualityIssue(event) {
        event.stopPropagation();
        const id = event.currentTarget?.dataset?.id;
        this._qualityIssues = this._qualityIssues.filter((q) => q.id !== id);
    }

    handleMergeArticles(event) {
        event.stopPropagation();
        const id = event.currentTarget?.dataset?.id;
        // Prototype-only: resolving the merge removes the card.
        this._qualityIssues = this._qualityIssues.filter((q) => q.id !== id);
    }

    handleArchiveArticle(event) {
        event.stopPropagation();
        const id = event.currentTarget?.dataset?.id;
        // Prototype-only: archiving an article resolves its issue card.
        this._qualityIssues = this._qualityIssues.filter((q) => q.id !== id);
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
        this._initSmoothScroll(scroller);
    }

    // ── GSAP smooth scrolling ───────────────────────────────────────
    // State + bound handler for the inertial wheel scroll on `.cc-main`.
    _ss = null;
    _wheelHandler = null;
    _scroller = null;

    /**
     * Inertial ("smooth") scrolling for the `.cc-main` viewport, driven
     * by GSAP's ticker. Native wheel events are intercepted and folded
     * into a `target` offset; each animation frame the actual scrollTop
     * is eased toward that target (a classic lerp, à la ScrollSmoother /
     * Lenis) for a weighted, glide-to-rest feel. The ticker is only
     * subscribed while a glide is in flight, so it costs nothing at
     * rest. Honors `prefers-reduced-motion` (falls back to native
     * scrolling) and no-ops when GSAP is unavailable.
     */
    _initSmoothScroll(scroller) {
        const reduce =
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce || !gsap) return;

        const state = {
            target: scroller.scrollTop,
            current: scroller.scrollTop,
            running: false,
            // Per-frame easing factor — higher glides faster / settles
            // sooner, lower feels heavier. 0.12 reads as smooth but
            // responsive at 60fps.
            ease: 0.12,
        };
        this._ss = state;
        this._scroller = scroller;

        const maxScroll = () => scroller.scrollHeight - scroller.clientHeight;

        const tick = () => {
            state.current += (state.target - state.current) * state.ease;
            // Snap to rest once within a sub-pixel of the target so the
            // tween terminates cleanly and we can release the ticker.
            if (Math.abs(state.target - state.current) < 0.5) {
                state.current = state.target;
                scroller.scrollTop = state.current;
                gsap.ticker.remove(tick);
                state.running = false;
                return;
            }
            scroller.scrollTop = state.current;
        };

        const onWheel = (event) => {
            // Defer to the browser for pinch-zoom (ctrl+wheel) and any
            // horizontal-intent gesture so we only smooth vertical scroll.
            if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
                return;
            }
            const max = maxScroll();
            if (max <= 0) return;

            // Normalize line / page delta modes to pixels.
            const factor =
                event.deltaMode === 1
                    ? 16
                    : event.deltaMode === 2
                        ? scroller.clientHeight
                        : 1;
            const delta = event.deltaY * factor;

            event.preventDefault();
            // Re-sync to the live position when starting a fresh glide so
            // scrollbar drags / keyboard scrolls between gestures aren't
            // overridden.
            if (!state.running) state.current = scroller.scrollTop;
            const base = state.running ? state.target : scroller.scrollTop;
            state.target = Math.max(0, Math.min(max, base + delta));

            if (!state.running) {
                state.running = true;
                gsap.ticker.add(tick);
            }
        };

        scroller.addEventListener('wheel', onWheel, { passive: false });
        this._wheelHandler = onWheel;
        this._ssTick = tick;
    }

    disconnectedCallback() {
        if (this._scroller && this._wheelHandler) {
            this._scroller.removeEventListener('wheel', this._wheelHandler);
        }
        if (this._ssTick && gsap) {
            gsap.ticker.remove(this._ssTick);
        }
        this._ss = null;
        this._wheelHandler = null;
        this._ssTick = null;
        this._scroller = null;
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
