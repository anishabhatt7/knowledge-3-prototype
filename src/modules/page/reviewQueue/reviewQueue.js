import { LightningElement, track } from 'lwc';
import gsap from 'gsap';
import Toast from 'lightning/toast';
import ConfirmDialog from 'ui/confirmDialog';
import { navigate } from '../../../router';
import { seedReviewQueue, buildQueueFromArticles } from 'data/reviewQueue';
import { getQueueSession } from 'data/queueSession';

// LWC's initial mount can saturate the main thread for several
// hundred ms; without this, GSAP interprets that as "lag" and
// stretches every tween started during that window to keep them
// "smooth". Disabling lag smoothing makes durations honor wall-clock
// time, which is what we want for short UI tweens.
gsap.ticker.lagSmoothing(0);

/**
 * Review Queue (page-review-queue) — modeled on Figma frame 270:18173.
 *
 * Workflow: opened in a new workspace tab from the Command Center
 * page's "Review Article Drafts" CTA on each Knowledge Action row.
 * Presents a left-rail list of articles pending review, and a main
 * pane that shows a side-by-side compare of the current article body
 * (left) against the AI-suggested changes (right).
 *
 * The article list (rail + headers) is driven by the Command Center
 * action row the user launched from: that row's table articles are
 * stamped into `data/queueSession`, and this page rebuilds the queue
 * from them (see `connectedCallback`) so the queue's article headers
 * match the headers listed in the table. When no session is set the
 * page falls back to its own `seedReviewQueue`.
 *
 * Interaction model:
 *   - Each error paragraph on the left is paired with a suggestion on
 *     the right via `paragraph.suggestionId` ↔ `suggestion.id`.
 *   - Click an error → scroll the matching suggestion into view + flash
 *     a transient highlight on both cards.
 *   - Click a suggestion → if `paragraphIdRef` is set, scroll the
 *     paragraph into view + flash both. "Addition" suggestions have
 *     no paragraphIdRef; clicking them scrolls within the right pane
 *     to the suggestion itself (no left-side jump).
 *   - "Reject Suggestion" toggles the suggestion's status to rejected
 *     and recomputes AI score, metadata completeness, and structural
 *     violations in real time. A rejected suggestion exposes a
 *     "Restore" affordance to undo.
 *   - "Save & Next" advances to the next article in the queue (wraps
 *     around at the end). Clicking a rail row jumps directly.
 *
 * Score model lives entirely in the seed data (data/reviewQueue) —
 * each article carries baseline scores plus per-suggestion impact
 * deltas. This component only mutates a per-article working copy;
 * the seed remains immutable.
 */
export default class ReviewQueue extends LightningElement {
    static renderMode = 'light';

    /**
     * The active queue list for this page mount. Defaults to the seed
     * data and is replaced in `connectedCallback` with a list built
     * from the launching action row's articles (when a queue session
     * is present). All queue lookups read this — never the imported
     * seed directly — so the page works in both modes.
     */
    @track _queue = seedReviewQueue;

    /** @type {string|null} id of the currently active article. */
    @track _activeId = null;

    /**
     * Deep-cloned working copy of the currently active queue article.
     * Accept/reject mutations only touch this in-memory copy; the seed
     * (data/reviewQueue) stays immutable.
     */
    @track _activeArticle = null;

    /** Active tab id — only "content" is interactive in the prototype. */
    @track _activeTab = 'content';

    /** Persistent selection ids set by handleParagraphClick / handle
     *  SuggestedItemClick. Drive `.is-highlight` classes via the
     *  *Rendered getters. The selected pair stays highlighted until
     *  (a) the user picks a different error / suggestion, or
     *  (b) the user clicks outside any error paragraph / suggestion
     *  card (see `_onDocumentClick`), or
     *  (c) the article is switched. */
    @track _highlightParagraphId = null;
    @track _highlightSuggestionId = null;

    /** Document-level click listener used to clear selection on
     *  outside clicks. Bound in connectedCallback / removed in
     *  disconnectedCallback. */
    _docClickHandler = null;

    /** Set of article ids the user has explicitly "Save & Next"-ed.
     *  Used by `handleSelectArticle` to decide whether to raise a
     *  Lightning confirm before discarding the working copy of the
     *  current article. Not @track — read only inside imperative
     *  handlers, never in a template/getter. */
    _savedArticleIds = new Set();

    // ── Donut score animation (GSAP) ────────────────────────────────
    //
    // `aiScoreCurrent` is the source of truth (computed from accepted
    // suggestions). The visible donut is driven by GSAP, which mutates
    // the value `<span>` and the SVG ring's `stroke-dashoffset`
    // directly to keep all ~60 frames out of LWC's render pipeline.
    // Only the settled value lands back on `_displayedScore`; while a
    // tween is in flight `_inFlightScore` holds the current animated
    // value so unrelated re-renders can re-paint the DOM without
    // snapping the donut back to the stale settled value.
    _displayedScore = 0;
    _scoreTarget = null;
    _scoreTween = null;
    _inFlightScore = null;

    // ── Click-to-jump scroll (GSAP) ─────────────────────────────────
    //
    // The Current Article (left) and Suggested Changes (right) panes
    // scroll fully independently — free scrolling on one pane never
    // moves the other. The only programmatic scroll is the
    // click-to-jump tween: selecting an error / suggestion scrolls
    // the matching counterpart on the opposite pane into view via
    // `_tweenPaneTo`. `_scrollTween` holds that single in-flight
    // GSAP tween so a new click can interrupt it cleanly.
    _scrollTween = null;

    connectedCallback() {
        // Prefer the queue list handed over by the launching Command
        // Center action row, so the rail + article headers mirror the
        // articles listed in that action's table. Falls back to the
        // page's own seed when no session is set (e.g. deep link).
        const session = getQueueSession();
        if (session && Array.isArray(session.articles) && session.articles.length) {
            const built = buildQueueFromArticles(session.articles);
            if (built.length) this._queue = built;
        }
        if (!this._activeId && this._queue.length) {
            this._switchTo(this._queue[0].id);
        }
        // Outside-click deselect. Bound on document so clicks anywhere
        // in the page (shell chrome included) collapse the selection
        // unless they land on a paragraph row or suggestion card.
        this._docClickHandler = (e) => this._onDocumentClick(e);
        document.addEventListener('click', this._docClickHandler, true);
    }

    renderedCallback() {
        this._syncScoreAnimation();
        this._playPageEntrance();
    }

    disconnectedCallback() {
        if (this._scoreTween) {
            this._scoreTween.kill();
            this._scoreTween = null;
        }
        if (this._docClickHandler) {
            document.removeEventListener('click', this._docClickHandler, true);
            this._docClickHandler = null;
        }
        if (this._scrollTween) {
            this._scrollTween.kill();
            this._scrollTween = null;
        }
    }

    // ── Working-copy helpers ────────────────────────────────────────

    /** Look up an article in the active queue by id, returning a deep
     *  clone so accept/reject mutations never pollute the queue list. */
    _getArticleById(id) {
        const found = this._queue.find((a) => a.id === id);
        if (!found) return null;
        return JSON.parse(JSON.stringify(found));
    }

    _switchTo(id) {
        const next = this._getArticleById(id);
        if (!next) return;
        this._activeId = id;
        this._activeArticle = next;
    }

    /** Single source of truth for everything that depends on the
     *  current article. Reads the @track property directly so LWC's
     *  reactivity wires up on each render. */
    get _active() {
        return this._activeArticle;
    }

    // ── Rail (queue list) ───────────────────────────────────────────

    get queueItems() {
        return this._queue.map((a) => {
            const isActive = a.id === this._activeId;
            return {
                id: a.id,
                title: a.title,
                violationsLabel: `${a.violations} Violations`,
                rowClass: `rq-rail__item${isActive ? ' rq-rail__item--active' : ''}`,
                ariaCurrent: isActive ? 'true' : 'false',
            };
        });
    }

    async handleSelectArticle(event) {
        const id = event.currentTarget?.dataset?.id;
        if (!id || id === this._activeId) return;

        // Guard: leaving an unsaved article (never went through
        // Save & Next) requires explicit confirmation, otherwise the
        // working copy — including any rejected suggestions and the
        // score state that depends on them — would be silently lost.
        if (this._activeId && !this._savedArticleIds.has(this._activeId)) {
            const currentTitle = this._active?.title || 'this article';
            const proceed = await ConfirmDialog.open({
                size: 'small',
                label: 'Discard unsaved review changes?',
                message: `You have unsaved review changes on "${currentTitle}". Switching articles will discard them. Continue?`,
                confirmLabel: 'Yes, continue',
                theme: 'warning',
            });
            if (!proceed) return;
        }

        this._switchTo(id);
        this._activeTab = 'content';
        this._clearHighlights();
    }

    // ── Header / status row ─────────────────────────────────────────

    get activeArticle() {
        return this._active || this._queue[0];
    }

    get pendingCountLive() {
        const a = this._active;
        if (!a) return 0;
        // pending = remaining suggestions still in `accepted` state
        // (the AI hasn't been rejected yet)
        const accepted = a.suggestions.filter((s) => s.status === 'accepted').length;
        return accepted;
    }

    // ── Score card ──────────────────────────────────────────────────

    get aiScoreCurrent() {
        const a = this._active;
        if (!a) return 0;
        const delta = a.suggestions
            .filter((s) => s.status === 'accepted')
            .reduce((sum, s) => sum + (s.aiImpact || 0), 0);
        return Math.min(100, Math.max(0, Math.round(a.aiScoreOriginal + delta)));
    }

    get metadataLive() {
        const a = this._active;
        if (!a) return 0;
        const delta = a.suggestions
            .filter((s) => s.status === 'accepted')
            .reduce((sum, s) => sum + (s.metadataImpact || 0), 0);
        return Math.min(100, Math.max(0, Math.round(a.metadataCompletenessOriginal + delta)));
    }

    get structuralLive() {
        const a = this._active;
        if (!a) return 0;
        const removed = a.suggestions
            .filter((s) => s.status === 'accepted')
            .reduce((sum, s) => sum + (s.violationsImpact || 0), 0);
        const remaining = Math.max(0, a.structuralViolationsOriginal - removed);
        return remaining;
    }

    get donutCircumference() {
        // SVG circle r=50 → C = 2πr ≈ 314.159
        return 2 * Math.PI * 50;
    }

    /** Score the donut currently shows (animated value, 0–100). */
    get aiScoreDisplay() {
        return Math.round(this._displayedScore);
    }

    /** Ring fill — derived from the animated score so the ring and the
     *  text tween together. */
    get donutOffset() {
        const fillRatio = this._displayedScore / 100;
        return this.donutCircumference * (1 - fillRatio);
    }

    get donutAriaLabel() {
        // ARIA reflects the *true* current score so assistive tech reads
        // the final value rather than tween midpoints.
        return `AI Score after changes: ${this.aiScoreCurrent} percent`;
    }

    /**
     * Called from `renderedCallback`. Tweens the donut from the
     * currently-painted value toward the live `aiScoreCurrent`
     * whenever the target changes:
     *   - On first paint, target was null → animates from 0.
     *   - On suggestion reject / restore, target moves → animates up/down.
     *   - On article switch (Save & Next / rail click), new target →
     *     animates between articles.
     *
     * GSAP mutates the value span and SVG `stroke-dashoffset` directly
     * to keep all ~60 frames out of LWC's render pipeline. Only the
     * settled value lands back on `_displayedScore`.
     */
    _syncScoreAnimation() {
        const valueEl = this.querySelector('.rq-donut__value');
        const ringEl = this.querySelector('.rq-donut__fg');
        if (!valueEl || !ringEl) return;

        const target = this.aiScoreCurrent;

        // Same target — either no animation needed, or a render just
        // happened mid-tween. In the latter case the template has
        // clobbered our directly-mutated DOM with the stale
        // `_displayedScore` value, so re-apply the in-flight frame.
        if (target === this._scoreTarget) {
            if (this._inFlightScore !== null) {
                this._paintDonut(valueEl, ringEl, this._inFlightScore);
            }
            return;
        }

        const isInitial = this._scoreTarget === null;
        const start =
            this._inFlightScore !== null
                ? this._inFlightScore
                : this._displayedScore;
        this._scoreTarget = target;
        this._inFlightScore = start;

        if (this._scoreTween) this._scoreTween.kill();
        const proxy = { v: start };
        this._scoreTween = gsap.to(proxy, {
            v: target,
            duration: isInitial ? 1.1 : 0.6,
            ease: isInitial ? 'power3.out' : 'power2.out',
            onUpdate: () => {
                this._inFlightScore = proxy.v;
                this._paintDonut(valueEl, ringEl, proxy.v);
            },
            onComplete: () => {
                this._displayedScore = target;
                this._inFlightScore = null;
                this._paintDonut(valueEl, ringEl, target);
            },
        });
    }

    _paintDonut(valueEl, ringEl, value) {
        valueEl.textContent = `${Math.round(value)}%`;
        ringEl.setAttribute(
            'stroke-dashoffset',
            String(this.donutCircumference * (1 - value / 100))
        );
    }

    // ── Page entrance ───────────────────────────────────────────────
    //
    // Counterpart to the Command Center "Review Article Drafts" exit
    // fade. Runs once per mount: the page container fades in and lifts
    // up into place so the route hand-off feels like one continuous
    // motion instead of a jump cut. The score-card row gets a small
    // staggered settle on top so the donut + metric column feels alive
    // on arrival.
    _pageEntered = false;

    _playPageEntrance() {
        if (this._pageEntered) return;
        const page = this.querySelector('.rq-page');
        if (!page) return;
        this._pageEntered = true;

        const reduce =
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;

        gsap.fromTo(
            page,
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 0.42, ease: 'power3.out', clearProps: 'transform' }
        );

        const scoreChildren = this.querySelectorAll(
            '.rq-score-card > .rq-score-card__body > *'
        );
        if (scoreChildren && scoreChildren.length) {
            gsap.fromTo(
                scoreChildren,
                { opacity: 0, y: 8 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.36,
                    ease: 'power2.out',
                    stagger: 0.06,
                    delay: 0.18,
                    clearProps: 'transform',
                }
            );
        }
    }

    // ── Tabs ────────────────────────────────────────────────────────

    get tabs() {
        const items = [
            { id: 'content', label: 'Content' },
            { id: 'metadata', label: 'Metadata' },
            { id: 'enrichments', label: 'Enrichments' },
        ];
        return items.map((t) => {
            const isActive = t.id === this._activeTab;
            return {
                ...t,
                className: `rq-tab${isActive ? ' rq-tab--active' : ''}`,
                ariaSelected: isActive ? 'true' : 'false',
            };
        });
    }

    handleSelectTab(event) {
        const id = event.currentTarget?.dataset?.id;
        if (!id) return;
        this._activeTab = id;
    }

    // ── Current Article paragraphs ──────────────────────────────────

    get paragraphsRendered() {
        const a = this._active;
        if (!a) return [];
        return a.paragraphs.map((p) => {
            const isError = !!p.isError;
            const isHl = isError && this._highlightParagraphId === p.id;
            return {
                ...p,
                isHeading: p.kind === 'heading',
                isPara: p.kind === 'para',
                isList: p.kind === 'list',
                isImage: p.kind === 'image',
                // Current Article violations all render in a single red
                // tone — Figma comp doesn't differentiate severity here,
                // so `errorReason` is dropped from the class list.
                rowClass: [
                    'rq-paragraph',
                    `rq-paragraph--${p.kind}`,
                    isError ? 'rq-paragraph--error' : '',
                    isHl ? 'is-highlight' : '',
                ]
                    .filter(Boolean)
                    .join(' '),
                suggestionId: p.suggestionId || '',
            };
        });
    }

    handleParagraphClick(event) {
        const paragraphId = event.currentTarget?.dataset?.paragraphId;
        const suggestionId = event.currentTarget?.dataset?.suggestionId;
        if (!suggestionId) return; // non-error paragraph — nothing to jump to
        this._scrollToSuggestion(suggestionId);
        this._flashPair(paragraphId, suggestionId);
    }

    // ── Suggested Changes ───────────────────────────────────────────

    /**
     * Right-pane content as a unified, ordered flow that reads like a
     * real article: stable paragraphs (headings, prose, lists, images)
     * pass through verbatim and the AI's rewrites slot in at the
     * position of the original error paragraphs. "Addition" suggestions
     * (no `paragraphIdRef`) append at the end.
     *
     * Each item carries either `isParagraph` or `isSuggestion` (mutually
     * exclusive) so the template can branch on a single `for:each`.
     */
    get suggestedItemsRendered() {
        const a = this._active;
        if (!a) return [];

        const sugById = {};
        a.suggestions.forEach((s) => {
            sugById[s.id] = s;
        });

        const items = [];

        a.paragraphs.forEach((p) => {
            if (p.isError && p.suggestionId && sugById[p.suggestionId]) {
                items.push(this._buildSuggestionItem(sugById[p.suggestionId]));
            } else {
                items.push(this._buildPlainParagraphItem(p));
            }
        });

        a.suggestions.forEach((s) => {
            if (!s.paragraphIdRef) {
                items.push(this._buildSuggestionItem(s));
            }
        });

        return items;
    }

    _buildPlainParagraphItem(p) {
        return {
            id: p.id,
            text: p.text || '',
            items: p.items || [],
            src: p.src || '',
            alt: p.alt || '',
            caption: p.caption || '',
            isParagraph: true,
            isSuggestion: false,
            isHeading: p.kind === 'heading',
            isPara: p.kind === 'para',
            isList: p.kind === 'list',
            isImage: p.kind === 'image',
            // Data attrs: plain paragraphs are inert. Empty
            // `dataSuggestionId` makes `handleSuggestedItemClick`
            // early-return so we don't flash/scroll on stable text.
            dataParagraphId: p.id,
            dataSuggestionId: '',
            dataParagraphIdRef: '',
            rowClass: `rq-suggested-item rq-suggested-item--paragraph rq-suggested-item--${p.kind}`,
        };
    }

    _buildSuggestionItem(s) {
        const isHl = this._highlightSuggestionId === s.id;
        const isRejected = s.status === 'rejected';
        const isAddition = s.category === 'Addition';
        const categoryKey = s.category.replace(/\s+/g, '-').toLowerCase();
        return {
            id: s.id,
            number: s.number,
            category: s.category,
            body: s.body,
            aiImpact: s.aiImpact,
            isParagraph: false,
            isSuggestion: true,
            // Data attrs: suggestion id drives the click handler;
            // paragraphIdRef points at the left-pane paragraph this
            // rewrite replaces (empty for "Addition" suggestions).
            dataParagraphId: '',
            dataSuggestionId: s.id,
            dataParagraphIdRef: s.paragraphIdRef || '',
            rowClass: [
                'rq-suggested-item',
                'rq-suggestion',
                `rq-suggestion--${categoryKey}`,
                isAddition ? 'rq-suggestion--addition' : '',
                isRejected ? 'rq-suggestion--rejected' : '',
                isHl ? 'is-highlight' : '',
            ]
                .filter(Boolean)
                .join(' '),
            categoryClass: `rq-suggestion__category rq-suggestion__category--${categoryKey}`,
            numberedTitle: `${s.number}. ${s.title}`,
            actionLabel: isRejected ? 'Restore' : 'Reject Suggestion',
        };
    }

    handleSuggestedItemClick(event) {
        // Reject button has its own handler (stopPropagation there).
        if (event.target?.classList?.contains('rq-suggestion__action')) {
            return;
        }
        const card = event.currentTarget;
        const suggestionId = card?.dataset?.suggestionId;
        if (!suggestionId) return; // plain paragraph — inert
        const paragraphIdRef = card?.dataset?.paragraphIdRef;
        if (paragraphIdRef) {
            this._scrollToParagraph(paragraphIdRef);
            this._flashPair(paragraphIdRef, suggestionId);
        } else {
            // Addition: no left-side counterpart. Still scroll the
            // suggestion to the top of the right pane so the user sees
            // it clearly, and flash just the right-side card.
            this._scrollToSuggestion(suggestionId);
            this._flashPair(null, suggestionId);
        }
    }

    /** Reject / Restore toggle on a suggestion card. */
    handleSuggestionAction(event) {
        event.stopPropagation();
        // Walk up to find the button carrying the data-id payload —
        // event.target may be a child text node depending on click
        // position, and `currentTarget` is unreliable across light-DOM
        // re-binds.
        let el = event.target;
        while (el && !el.dataset?.id) el = el.parentElement;
        const id = el?.dataset?.id;
        if (!id) return;
        const a = this._activeArticle;
        if (!a) return;
        this._activeArticle = {
            ...a,
            suggestions: a.suggestions.map((s) =>
                s.id === id
                    ? { ...s, status: s.status === 'accepted' ? 'rejected' : 'accepted' }
                    : s
            ),
        };
    }

    // ── Save & Next ─────────────────────────────────────────────────

    handleSaveNext() {
        const idx = this._queue.findIndex((a) => a.id === this._activeId);
        if (idx < 0) return;
        const current = this._queue[idx];
        const nextIdx = (idx + 1) % this._queue.length;
        const next = this._queue[nextIdx];

        // Mark the article as saved BEFORE switching, so the rail-row
        // confirm guard in `handleSelectArticle` recognises it as
        // saved on any future revisit.
        this._savedArticleIds.add(current.id);

        // SLDS 2 success toast announces what was saved and where we
        // are going. `dismissible` mirrors the auto-close pattern
        // used by `reviewArticle.js`.
        this._showSavedToast(current.title, next.title);

        this._switchTo(next.id);
        this._activeTab = 'content';
        this._clearHighlights();
        // Reset both panes to the top — each scrolls independently,
        // so we want the new article to read from the start on both
        // sides. Kill any in-flight click-to-jump tween first so it
        // doesn't fight the manual reset.
        if (this._scrollTween) {
            this._scrollTween.kill();
            this._scrollTween = null;
        }
        const left = this._getLeftPane();
        const right = this._getRightPane();
        if (left) left.scrollTop = 0;
        if (right) right.scrollTop = 0;
    }

    /**
     * Split-button menu router. The chevron half of the Save & Next
     * group exposes a few related save flows; this dispatches by the
     * `value` carried on each `<lightning-menu-item>`.
     *
     *   - `save-stay`        → mark current as saved but stay on
     *                          the article; no pane reset, no switch.
     *   - `skip-next`        → advance to the next article WITHOUT
     *                          marking the current one as saved, so
     *                          revisiting it later will re-prompt the
     *                          unsaved-changes confirm.
     *   - `submit-approval`  → prototype-only stub: show an info toast
     *                          explaining the flow isn't wired here.
     */
    handleSaveMenuSelect(event) {
        const value = event.detail?.value;
        if (value === 'save-stay') {
            this._handleSaveAndStay();
        } else if (value === 'skip-next') {
            this._handleSkipToNext();
        } else if (value === 'submit-approval') {
            this._showSubmitApprovalToast();
        }
    }

    /**
     * "Save & Stay" — same save accounting as Save & Next (mark the
     * current article as saved, fire a success toast) but skip the
     * article switch and pane scroll-reset so the reviewer keeps
     * working on the same article.
     */
    _handleSaveAndStay() {
        const idx = this._queue.findIndex((a) => a.id === this._activeId);
        if (idx < 0) return;
        const current = this._queue[idx];
        this._savedArticleIds.add(current.id);
        this._showStayedToast(current.title);
    }

    /**
     * "Skip to next article without saving" — advance to the next
     * article in the queue but do NOT add the current one to
     * `_savedArticleIds`, so the rail-row confirm guard will still
     * fire if the reviewer comes back to it. Skips the success toast
     * (it isn't a save) and emits a quiet info toast instead.
     */
    _handleSkipToNext() {
        const idx = this._queue.findIndex((a) => a.id === this._activeId);
        if (idx < 0) return;
        const current = this._queue[idx];
        const nextIdx = (idx + 1) % this._queue.length;
        const next = this._queue[nextIdx];

        this._showSkippedToast(current.title, next.title);

        this._switchTo(next.id);
        this._activeTab = 'content';
        this._clearHighlights();
        if (this._scrollTween) {
            this._scrollTween.kill();
            this._scrollTween = null;
        }
        const left = this._getLeftPane();
        const right = this._getRightPane();
        if (left) left.scrollTop = 0;
        if (right) right.scrollTop = 0;
    }

    /**
     * Show an SLDS 2 success toast confirming the save + the next
     * article that's being loaded. Auto-closes the oldest toast
     * after `TOAST_DISMISS_MS` so a fast user mashing Save & Next
     * doesn't end up with a tower of stacked notifications.
     */
    _showSavedToast(savedTitle, nextTitle) {
        // Guard the toast call: any failure here (missing toast
        // container at first call, module resolution glitch, etc.)
        // must NOT block the article-switch logic that runs after
        // `_showSavedToast` returns.
        try {
            Toast.show(
                {
                    label: 'Article saved',
                    message: `"${savedTitle}" saved. Reviewing next: "${nextTitle}".`,
                    variant: 'success',
                    mode: 'dismissible',
                },
                this
            );
            window.setTimeout(() => closeOldestToast(), TOAST_DISMISS_MS);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('reviewQueue: Toast.show failed', err);
        }
    }

    /**
     * Sibling of `_showSavedToast` for the "Save & Stay" branch:
     * confirms the save without implying a switch. Same auto-dismiss
     * semantics so multiple saves on the same article don't stack.
     */
    _showStayedToast(savedTitle) {
        try {
            Toast.show(
                {
                    label: 'Article saved',
                    message: `"${savedTitle}" saved. Staying on this article.`,
                    variant: 'success',
                    mode: 'dismissible',
                },
                this
            );
            window.setTimeout(() => closeOldestToast(), TOAST_DISMISS_MS);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('reviewQueue: Toast.show failed', err);
        }
    }

    /**
     * Quiet info toast for "Skip to next article without saving". We
     * intentionally don't claim a save happened — this branch leaves
     * the working copy un-persisted on purpose.
     */
    _showSkippedToast(skippedTitle, nextTitle) {
        try {
            Toast.show(
                {
                    label: 'Skipped without saving',
                    message: `Skipped "${skippedTitle}" without saving. Reviewing next: "${nextTitle}".`,
                    variant: 'info',
                    mode: 'dismissible',
                },
                this
            );
            window.setTimeout(() => closeOldestToast(), TOAST_DISMISS_MS);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('reviewQueue: Toast.show failed', err);
        }
    }

    /**
     * Prototype-only stub for "Submit for Approval". Mirrors the
     * pattern other un-wired actions in this codebase use: surface
     * an info toast that explains the flow isn't implemented in the
     * prototype, instead of silently no-op'ing or pretending.
     */
    _showSubmitApprovalToast() {
        try {
            Toast.show(
                {
                    label: 'Submit for Approval',
                    message: 'Submit for Approval flow is not wired in this prototype.',
                    variant: 'info',
                    mode: 'dismissible',
                },
                this
            );
            window.setTimeout(() => closeOldestToast(), TOAST_DISMISS_MS);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('reviewQueue: Toast.show failed', err);
        }
    }

    // ── Scroll + highlight plumbing ─────────────────────────────────

    _scrollToParagraph(id) {
        const pane = this._getLeftPane();
        const el = pane?.querySelector(`[data-paragraph-id="${id}"]`);
        if (!pane || !el) return;
        this._tweenPaneTo(pane, el, 'center');
    }

    _scrollToSuggestion(id) {
        const pane = this._getRightPane();
        const el = pane?.querySelector(
            `.rq-suggestion[data-suggestion-id="${id}"]`
        );
        if (!pane || !el) return;
        this._tweenPaneTo(pane, el, 'center');
    }

    /**
     * Tween `pane.scrollTop` so `el` sits at `align` within the pane
     * (`'start'` parks it at the top, `'center'` puts it vertically
     * mid-pane). Sole programmatic scroller for the page — the free
     * scroll on each pane is unbound, so no echo-suppression is
     * needed. Any in-flight tween is killed before a new one starts
     * so back-to-back clicks always honour the latest target.
     */
    _tweenPaneTo(pane, el, align = 'start') {
        const paneRect = pane.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const currentTop = pane.scrollTop;
        const elTopInPane = elRect.top - paneRect.top + currentTop;
        let target = elTopInPane;
        if (align === 'center') {
            target = elTopInPane - pane.clientHeight / 2 + el.offsetHeight / 2;
        }
        target = Math.max(0, Math.min(target, pane.scrollHeight - pane.clientHeight));
        if (this._scrollTween) this._scrollTween.kill();
        const proxy = { y: pane.scrollTop };
        this._scrollTween = gsap.to(proxy, {
            duration: 0.45,
            ease: 'power3.out',
            y: target,
            onUpdate: () => {
                pane.scrollTop = proxy.y;
            },
        });
    }

    // ── Pane DOM lookups ────────────────────────────────────────────

    _getLeftPane() {
        return this.querySelector('.rq-pane--current .rq-pane__body');
    }

    _getRightPane() {
        return this.querySelector('.rq-pane--suggested .rq-pane__body');
    }

    /**
     * Mark a paragraph + its paired suggestion as the active selection.
     * Unlike the previous flash semantics, selection is persistent:
     * it stays until the user picks a different pair, clicks outside,
     * or switches articles. Either id may be null (e.g. Addition
     * suggestions have no paragraph counterpart).
     */
    _flashPair(paragraphId, suggestionId) {
        this._highlightParagraphId = paragraphId || null;
        this._highlightSuggestionId = suggestionId || null;
    }

    _clearHighlights() {
        this._highlightParagraphId = null;
        this._highlightSuggestionId = null;
    }

    /**
     * Document-level click listener. If the click lands on an error
     * paragraph or a suggestion card, the local handler will set the
     * new selection — leave it alone. Otherwise, collapse the
     * selection (it's an "outside" click).
     *
     * Uses `composedPath()` so synthetic shadow DOM doesn't hide the
     * real target, and short-circuits when there's nothing selected.
     */
    _onDocumentClick(event) {
        if (!this._highlightParagraphId && !this._highlightSuggestionId) {
            return;
        }
        const path = typeof event.composedPath === 'function'
            ? event.composedPath()
            : [event.target];
        for (const node of path) {
            if (!node || node.nodeType !== 1) continue;
            const cl = node.classList;
            if (!cl) continue;
            if (cl.contains('rq-paragraph--error') || cl.contains('rq-suggestion')) {
                return;
            }
        }
        this._clearHighlights();
    }

    /**
     * Esc closes the workspace tab (returns to Command Center) —
     * mirrors the Review Article (active authoring) shortcut.
     */
    handleEscape(event) {
        if (event.key !== 'Escape') return;
        navigate('/command-center');
    }
}

// ── Toast dismissal ─────────────────────────────────────────────────
//
// `lightning/toast` ships its own container that lives at the document
// root; we just borrow its DOM to fire a synthetic `close` on the
// oldest visible toast. Kept short so a reviewer rattling through
// Save & Next doesn't accumulate stacked notifications.
const TOAST_DISMISS_MS = 1500;

function closeOldestToast() {
    const container = document.querySelector('lightning-toast-container');
    if (!container) return;
    const root = container.shadowRoot || container;
    const toasts = root.querySelectorAll('lightning-toast');
    if (!toasts.length) return;
    toasts[0].dispatchEvent(
        new CustomEvent('close', {
            bubbles: true,
            detail: { isFocused: false },
        })
    );
}
