import { LightningElement, track } from 'lwc';
import { gsap } from 'gsap';
import { navigate, subscribe } from '../../../router';
import { getRecord, setRecord } from 'data/recordSession';
import { setEditSession } from 'data/editSession';
import { getArticleEdit } from 'data/articleEdits';
import { getArticleContent, articleBodyToHtml } from './articleContent';

/**
 * Knowledge Article record view — replicates the Figma frame
 * "Knowledge Record" (node 182:35015). Opened via the Knowledge Base
 * list view as a workspace tab; closing the tab returns the user to
 * `/knowledge-base` via the shell's `originPath` mechanism.
 *
 * Two pieces of state drive the page:
 *   - `_routeId` comes from the parametric `/knowledge-record/:id`
 *     route and changes when the user switches between open article
 *     tabs (subscribe-based, so the single component instance reacts
 *     to navigations without remounting).
 *   - `record` is the metadata stashed by the list-view via
 *     `setRecord({ id, title, ... })`. The page falls back to a
 *     placeholder title if a direct URL load happens before a
 *     row-click.
 *
 * The "Analysis" tab is active by default to match the Figma frame.
 * Information / Details / TOC / Categories sections are collapsible
 * with local @track flags. Body copy is intentionally static demo
 * content from the Figma — the prototype doesn't have per-article
 * bodies yet, but the header always reflects the clicked record.
 */
export default class KnowledgeRecord extends LightningElement {
    static renderMode = 'light';

    @track _routeId = null;
    @track _record = null;
    // Default to Details — matches Figma frame 182:35015. Switching to
    // "Analysis" reveals the AI Readiness dashboard (frame 182:34320).
    @track _activeTab = 'details';
    @track _infoOpen = true;
    @track _detailsOpen = true;
    @track _tocOpen = true;
    @track _categoriesOpen = true;
    @track _inquiryOpen = false;
    @track _feedback = null;
    @track _animatedReadiness = 0;
    _donutAnimated = false;
    // Bumped whenever this article's edits change (Review Article saves
    // via `data/articleEdits`, which fires `article:saved`). Templates
    // that read `_articleEdit` look at `_editTick` so LWC's reactive
    // graph re-runs the getter without us having to mirror the entire
    // edit payload onto a tracked field.
    @track _editTick = 0;

    _unsubscribe = null;
    _boundArticleSavedHandler = null;

    connectedCallback() {
        this._unsubscribe = subscribe((route) => {
            const nextId = route?.params?.id ?? null;
            if (nextId !== this._routeId) {
                this._routeId = nextId;
                this._record = getRecord(nextId);
                this._feedback = null;
                this._editTick = this._editTick + 1;
            }
        });

        // React to saves from the Review Article (active authoring)
        // experience — when the matching article is saved, refresh the
        // record reference (title can change) and bump the edit tick so
        // body/summary getters re-run.
        this._boundArticleSavedHandler = (e) => {
            const savedId = e?.detail?.id;
            if (!savedId || String(savedId) !== String(this._routeId)) return;
            this._record = getRecord(this._routeId) || this._record;
            this._editTick = this._editTick + 1;
        };
        window.addEventListener('article:saved', this._boundArticleSavedHandler);
    }

    disconnectedCallback() {
        if (this._unsubscribe) {
            this._unsubscribe();
            this._unsubscribe = null;
        }
        if (this._boundArticleSavedHandler) {
            window.removeEventListener('article:saved', this._boundArticleSavedHandler);
            this._boundArticleSavedHandler = null;
        }
        if (this._donutTween) {
            this._donutTween.kill();
            this._donutTween = null;
        }
    }

    renderedCallback() {
        if (this._donutAnimated || !this.isAnalysisTab) return;
        const labelEl = this.querySelector('.kr-donut__label');
        const arcEl = this.querySelector('.kr-donut__arc');
        if (!labelEl) return;
        this._donutAnimated = true;
        const target = this.readinessPercent;
        const circumference = 2 * Math.PI * 52;
        const proxy = { val: 0 };
        this._donutTween = gsap.to(proxy, {
            val: target,
            duration: 1.4,
            ease: 'power2.out',
            onUpdate: () => {
                const current = Math.round(proxy.val);
                labelEl.textContent = `${current}%`;
                if (arcEl) {
                    const dash = (proxy.val / 100) * circumference;
                    arcEl.setAttribute('stroke-dasharray', `${dash} ${circumference}`);
                }
            },
        });
    }

    // ── Header bindings ────────────────────────────────────────────
    get title() {
        return this._record?.title || 'Knowledge Article';
    }

    get overline() {
        return this._record?.isKnowledgeBlock ? 'Knowledge Block' : 'Knowledge';
    }

    // Article number reuses the route id but pads it to a stable 8-
    // digit format so the header still looks like a real article
    // number even when the row id is a small index (`1`..`16`).
    get articleNumber() {
        const id = this._routeId || this._record?.id;
        if (!id) return '—';
        const numeric = Number(String(id).replace(/[^0-9]/g, ''));
        if (!Number.isFinite(numeric) || numeric <= 0) return String(id);
        return String(10002344 + numeric);
    }

    get articleRecordType() {
        return this._record?.articleRecordType || 'FAQ';
    }

    get language() {
        return this._record?.language || 'English';
    }

    get publishedStatus() {
        return 'Published';
    }

    get versionNumber() {
        return this._record?.currentVersion || '1';
    }

    get parentArticleId() {
        // Stable demo parent id derived from the route id (mirrors the
        // Figma where the parent is shown as a blue link record id).
        const id = this._routeId || '1';
        const numeric = Number(String(id).replace(/[^0-9]/g, '')) || 1;
        return String(19092910 + numeric);
    }

    // ── Article body content (Information + Details sections) ──────
    // Resolves the per-title summary and structured body blocks from
    // the demo content map. Unknown titles (e.g. user-saved drafts)
    // fall back to a generic structure so the layout stays populated.
    get _articleContent() {
        return getArticleContent(this.title);
    }

    // Saved edit (if any) overlays the static demo content so changes
    // made in the Review Article editor flow back to this view. Reads
    // `_editTick` so the getter re-runs on `article:saved`.
    get _articleEdit() {
        // Touch the tick to register reactive dependency.
        // eslint-disable-next-line no-unused-vars
        const _ = this._editTick;
        return getArticleEdit(this._routeId);
    }

    get summary() {
        return this._articleEdit?.summary || this._articleContent.summary;
    }

    // True when the user has saved an edited body for this article.
    // The template renders `bodyHtml` via `lightning-formatted-rich-
    // text` in that case, otherwise it falls back to the structured
    // `bodyBlocks` rendering.
    get hasEditedBody() {
        return !!this._articleEdit?.html;
    }

    get bodyHtml() {
        return this._articleEdit?.html || '';
    }

    // Body is rendered as a flat list of blocks; each block carries
    // boolean flags so the template can pick the right markup branch
    // without computing classes per block. List items are pre-keyed
    // for the inner `for:each`.
    get bodyBlocks() {
        return (this._articleContent.body || []).map((block, index) => {
            const key = `b-${index}`;
            const items = (block.items || []).map((text, i) => ({
                key: `${key}-${i}`,
                text,
            }));
            return {
                key,
                text: block.text || '',
                items,
                isLead: block.type === 'lead',
                isSubheading: block.type === 'subheading',
                isMinor: block.type === 'minor',
                isParagraph: block.type === 'paragraph',
                isList: block.type === 'list',
            };
        });
    }

    // ── Tab + section computed classes ─────────────────────────────
    get tabs() {
        const items = [
            { id: 'details', label: 'Details' },
            { id: 'related', label: 'Related Lists' },
            { id: 'versions', label: 'Versions' },
            { id: 'analysis', label: 'Analysis' },
        ];
        return items.map((t) => ({
            ...t,
            tabClass: t.id === this._activeTab
                ? 'kr-tabs__item kr-tabs__item--active'
                : 'kr-tabs__item',
            ariaSelected: t.id === this._activeTab ? 'true' : 'false',
        }));
    }

    get infoChevron() {
        return this._infoOpen ? 'utility:chevrondown' : 'utility:chevronright';
    }

    get detailsChevron() {
        return this._detailsOpen ? 'utility:chevrondown' : 'utility:chevronright';
    }

    get tocChevron() {
        return this._tocOpen ? 'utility:chevrondown' : 'utility:chevronright';
    }

    get categoriesChevron() {
        return this._categoriesOpen ? 'utility:chevrondown' : 'utility:chevronright';
    }

    get inquiryChevron() {
        return this._inquiryOpen ? 'utility:chevrondown' : 'utility:chevronright';
    }

    // Right-rail Table of Content mirrors the active article body —
    // every `subheading` block becomes a top-level TOC entry, and any
    // `minor` block becomes an indented child entry. Switching to a
    // different article from the Knowledge Base list rebuilds the TOC
    // automatically because `_articleContent` is keyed off the title.
    get tocItems() {
        const blocks = this._articleContent.body || [];
        return blocks
            .filter((b) => b.type === 'subheading' || b.type === 'minor')
            .map((b, i) => {
                const isChild = b.type === 'minor';
                return {
                    id: `toc-${i + 1}`,
                    label: b.text,
                    isChild,
                    chevron: 'utility:chevronright',
                    iconClass: 'kr-toc__chevron',
                    itemClass: isChild
                        ? 'kr-toc__item kr-toc__item--child'
                        : 'kr-toc__item',
                };
            });
    }

    get likeBtnVariant() {
        return this._feedback === 'like' ? 'brand' : 'neutral';
    }

    get dislikeBtnVariant() {
        return this._feedback === 'dislike' ? 'brand' : 'neutral';
    }

    // ── Tab-conditional rendering ──────────────────────────────────
    get isDetailsTab() {
        return this._activeTab === 'details';
    }

    get isAnalysisTab() {
        return this._activeTab === 'analysis';
    }

    // ── Analysis dashboard data ────────────────────────────────────
    // The donut chart hits 78% (Figma 182:34406). We render with two
    // overlapping conic-gradient discs so the dashboard stays static
    // and tooling-free — no chart library, no canvas. The SVG path
    // values are derived directly from the percentage so future
    // articles can carry their own score without code changes.
    get readinessPercent() {
        return 78;
    }

    get readinessLabel() {
        return `${this.readinessPercent}%`;
    }

    // CSS custom property bound on the donut to drive the
    // conic-gradient end-angle.
    get readinessDonutStyle() {
        const deg = Math.round((this.readinessPercent / 100) * 360);
        return `--kr-donut-angle: ${deg}deg;`;
    }

    get metadataCompleteness() {
        return '32%';
    }

    get structuralViolationsCount() {
        return '14';
    }

    get readinessSummary() {
        return 'Detected from a 25% spike in customer cases regarding baggage allowance policy change at various San Francisco airports.';
    }

    // ── Structural Violations (Figma frame 612:43216 / 612:70638) ──
    // The violations now render as a stack of expandable tiles instead
    // of a datatable. Each tile carries a title, a "N Violations" error
    // badge, an "AI Score" success badge, a short description, and a set
    // of nested detail rows revealed by the chevron. `_expandedViolations`
    // maps a tile id → boolean so multiple tiles can be open at once and
    // the open state survives re-renders.
    @track _expandedViolations = {};

    // Raw tile definitions. `structuralViolationTiles` (below) decorates
    // these with the derived chevron icon + expanded flag the template
    // binds to, keeping this list focused on content.
    get _violationTileData() {
        const detail = (id, icon, iconClass, title) => ({
            id,
            icon,
            iconClass,
            title,
            desc: 'First 2 sentences should state the direct answer in "Open Flow Builder" section',
            coverage: '+6%',
            coverageLabel: 'Increase in Coverage',
            confidence: '+2%',
            confidenceLabel: 'AI confidence',
        });
        const makeDetails = (prefix) => [
            detail(`${prefix}-d1`, 'utility:warning', 'kr-sv-detail__icon kr-sv-detail__icon--warning', 'No answer-first structure'),
            detail(`${prefix}-d2`, 'utility:warning', 'kr-sv-detail__icon kr-sv-detail__icon--warning', 'No answer-first structure'),
            detail(`${prefix}-d3`, 'utility:warning', 'kr-sv-detail__icon kr-sv-detail__icon--warning', 'No answer-first structure'),
            detail(`${prefix}-d4`, 'utility:list', 'kr-sv-detail__icon kr-sv-detail__icon--info', '12 Metadata Suggestions'),
            detail(`${prefix}-d5`, 'utility:data_graph', 'kr-sv-detail__icon kr-sv-detail__icon--info', '3 Enrichment Suggestions'),
        ];
        const description =
            'Detected from a 25% spike in customer cases regarding slow charging speeds at various San Francisco charging stations.';
        return [
            {
                id: 'sv1',
                title: 'Filter Replacement: Environmental changes',
                violationsLabel: '12 Violations',
                aiScoreLabel: 'AI Score: 9%',
                description,
                details: makeDetails('sv1'),
            },
            {
                id: 'sv2',
                title: 'Filter Replacement: Environmental changes',
                violationsLabel: '12 Violations',
                aiScoreLabel: 'AI Score: 9%',
                description,
                details: makeDetails('sv2'),
            },
            {
                id: 'sv3',
                title: 'Filter Replacement: Environmental changes',
                violationsLabel: '12 Violations',
                aiScoreLabel: 'AI Score: 9%',
                description,
                details: makeDetails('sv3'),
            },
        ];
    }

    get structuralViolationTiles() {
        return this._violationTileData.map((tile) => {
            const expanded = !!this._expandedViolations[tile.id];
            return {
                ...tile,
                expanded,
                chevron: expanded ? 'utility:chevrondown' : 'utility:chevronright',
                tileClass: expanded ? 'kr-sv-tile kr-sv-tile--open' : 'kr-sv-tile',
            };
        });
    }

    // Chevron toggle — flips the open state for a single tile. A fresh
    // object is assigned so LWC's reactivity picks up the change.
    handleToggleViolation(event) {
        const id = event.currentTarget.dataset.id;
        if (!id) return;
        this._expandedViolations = {
            ...this._expandedViolations,
            [id]: !this._expandedViolations[id],
        };
    }

    // "Edit to Resolve" on a tile → same active-authoring hand-off used
    // throughout the page. We pass the originating tile through so the
    // editor can later scroll to / pre-select the offending block.
    handleEditToResolve(event) {
        const id = event.currentTarget.dataset.id;
        const violation =
            this._violationTileData.find((t) => t.id === id) || null;
        this._launchActiveAuthoring({ violation });
    }

    // Header split-button actions (placeholder hooks).
    handleReviewInQueue() {
        navigate('/review-queue');
    }

    handleApproveAll() {
        // Placeholder — would bulk-approve the queued violations.
    }

    // ── Top Quality Issues (Figma frame 612:71226) ────────────────
    // Two issue cards: a contradiction between two source articles and a
    // similarity/merge candidate. The second card surfaces a "Merge
    // Articles" brand action via `showMerge`.
    get qualityIssues() {
        const summary =
            'The following information has been identified as a contradiction. Both documents are discussing the same topic (Settlement and Payout in insurance claims) and specifically mention the Claims Processing Timeframes. The information in Document A (5-10 days) directly contradicts the information in Document B (20-25 days). These timeframes are mutually exclusive and cannot both be true';
        const articleText = 'The Claims Processing Timeframe mentioned in the text is 5 to 10 days.';
        return [
            {
                id: 'qi1',
                title: 'Contradictions Claiming Processing Timeframes',
                typeBadge: 'Contradiction',
                confidence: 'Confidence: 98%',
                showMerge: false,
                summaryTitle: 'Contradictions Claiming Processing Timeframes',
                summary,
                leftLabel: 'Option A',
                rightLabel: 'Option B',
                leftArticle: 'Product Care and Warranty Information',
                rightArticle: 'Product Care and Warranty Information',
                leftText: articleText,
                rightText: articleText,
            },
            {
                id: 'qi2',
                title: 'Similarity in Warranty Claiming process',
                typeBadge: 'Similar Article',
                confidence: 'Confidence: 98%',
                showMerge: true,
                summaryTitle: 'Similarity Claiming Processing Timeframes',
                summary,
                leftLabel: 'Article 1',
                rightLabel: 'Article 2',
                leftArticle: 'Product Care and Warranty Information',
                rightArticle: 'Product Care and Warranty Information',
                leftText: articleText,
                rightText: articleText,
            },
        ];
    }

    handleViewAllQuality() {
        // Placeholder — would route to the full Quality Issues list.
    }

    handleIgnoreIssue() {
        // Placeholder — would dismiss the issue from the queue.
    }

    handleMergeArticles() {
        // Placeholder — would open the article-merge workflow.
    }

    handleArchiveArticle() {
        // Placeholder — would archive the selected source article.
    }

    /**
     * Hand-off used by every "Edit Article" entry-point on this page
     * (violations CTA, violations row buttons, future header actions).
     * Stashes the article context in `data/editSession`, opens a new
     * workspace tab via `workspace:addtab` (kind: 'editor'), and
     * navigates to the parametric `/edit-article/:id` route.
     */
    _launchActiveAuthoring({ violation } = {}) {
        const id = this._routeId;
        if (!id) return;

        const title = this.title;
        // Prefer any in-flight edit so the editor opens with the user's
        // most recent draft. Otherwise seed from the demo content map
        // converted to HTML.
        const existingEdit = getArticleEdit(id);
        const seedHtml =
            existingEdit?.html ||
            articleBodyToHtml(this._articleContent.body);

        setEditSession({
            id,
            title,
            html: seedHtml,
            recordType: this.articleRecordType,
            originPath: `/knowledge-record/${encodeURIComponent(id)}`,
            violation,
        });

        // Keep recordSession in sync so a later return to this record
        // (e.g. via the workspace tab) finds the same metadata even on
        // a hard reload of the editor route.
        const current = getRecord(id) || {};
        setRecord({
            ...current,
            id,
            title,
            articleRecordType: this.articleRecordType,
            language: this.language,
            currentVersion: this.versionNumber,
            isKnowledgeBlock: !!this._record?.isKnowledgeBlock,
        });

        const path = `/edit-article/${encodeURIComponent(id)}`;
        const tabLabel = `Edit: ${title}`;
        window.dispatchEvent(
            new CustomEvent('workspace:addtab', {
                detail: { label: tabLabel, path, kind: 'editor' },
            })
        );
        navigate(path);
    }

    handleReviewSuggestions() {
        // Placeholder hook — would open the suggestions side panel.
    }

    // ── Handlers ───────────────────────────────────────────────────
    handleTabClick(event) {
        const id = event.currentTarget.dataset.id;
        if (!id) return;
        this._activeTab = id;
    }

    handleToggleInfo() {
        this._infoOpen = !this._infoOpen;
    }

    handleToggleDetails() {
        this._detailsOpen = !this._detailsOpen;
    }

    handleToggleToc() {
        this._tocOpen = !this._tocOpen;
    }

    handleToggleCategories() {
        this._categoriesOpen = !this._categoriesOpen;
    }

    handleToggleInquiry() {
        this._inquiryOpen = !this._inquiryOpen;
    }

    handleLike() {
        this._feedback = this._feedback === 'like' ? null : 'like';
    }

    handleDislike() {
        this._feedback = this._feedback === 'dislike' ? null : 'dislike';
    }
}
