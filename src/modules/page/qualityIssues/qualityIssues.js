import { LightningElement, track } from 'lwc';
import { gsap } from 'gsap';
import { navigate } from '../../../router';
import { setRecord } from 'data/recordSession';
import { setDraftSession } from 'data/draftSession';
import {
    seedQualityIssues,
    assigneeForIssue,
    QUALITY_ISSUE_ASSIGNEES,
} from 'data/healingGraph';

const PAGE_SIZE = 5;

/**
 * Top Quality Issues — full, paginated list opened as a workspace tab from
 * the Knowledge Health dashboard's "Explore All" action. Mirrors the
 * dashboard tile layout (contradiction / similar-article cards with
 * clickable article links and per-option actions) and adds Domain/Agent,
 * Issue Type, Priority, and Assigned filters plus pagination. Closing the
 * tab returns to `/healing-graph` via the shell's `originPath` mechanism.
 */
export default class QualityIssues extends LightningElement {
    static renderMode = 'light';

    @track _filters = { domain: '', type: '', priority: '', assigned: '' };
    @track _page = 1;
    @track _ignoredIds = [];
    _issues = seedQualityIssues;
    _rendered = false;

    // ── Filter options ──────────────────────────────────────────────
    get domainFilterOptions() {
        const seen = [];
        this._issues.forEach((q) => {
            if (q.domain && !seen.includes(q.domain)) seen.push(q.domain);
        });
        return [
            { label: 'All Domains/Agents', value: '' },
            ...seen.map((v) => ({ label: v, value: v })),
        ];
    }

    get typeFilterOptions() {
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

    get assignedFilterOptions() {
        const used = new Set(this._issues.map((q) => assigneeForIssue(q.id)));
        const ordered = QUALITY_ISSUE_ASSIGNEES.filter((a) => used.has(a));
        return [
            { label: 'All Assignees', value: '' },
            ...ordered.map((v) => ({ label: v === 'You' ? 'Assigned to me' : v, value: v })),
        ];
    }

    // ── Filtering + pagination ───────────────────────────────────────
    get _openIssues() {
        return this._issues.filter((q) => !this._ignoredIds.includes(q.id));
    }

    get _filtered() {
        const f = this._filters;
        return this._openIssues.filter((q) =>
            (!f.domain || q.domain === f.domain) &&
            (!f.type || q.type === f.type) &&
            (!f.priority || q.priority === f.priority) &&
            (!f.assigned || assigneeForIssue(q.id) === f.assigned));
    }

    get totalCount() {
        return this._filtered.length;
    }

    get totalPages() {
        return Math.max(1, Math.ceil(this.totalCount / PAGE_SIZE));
    }

    get _safePage() {
        return Math.min(this._page, this.totalPages);
    }

    get pagedIssues() {
        const start = (this._safePage - 1) * PAGE_SIZE;
        return this._filtered.slice(start, start + PAGE_SIZE).map((q) => this._mapIssue(q));
    }

    get hasResults() {
        return this.totalCount > 0;
    }

    get showPagination() {
        return this.totalPages > 1;
    }

    get rangeLabel() {
        if (!this.totalCount) return '0 issues';
        const start = (this._safePage - 1) * PAGE_SIZE + 1;
        const end = Math.min(this._safePage * PAGE_SIZE, this.totalCount);
        return `${start}\u2013${end} of ${this.totalCount} issues`;
    }

    get pageButtons() {
        return Array.from({ length: this.totalPages }, (_, i) => {
            const page = i + 1;
            return {
                page,
                label: `${page}`,
                key: `pg-${page}`,
                btnClass: page === this._safePage
                    ? 'qi-pagination__page qi-pagination__page--active'
                    : 'qi-pagination__page',
            };
        });
    }

    get prevDisabled() {
        return this._safePage <= 1;
    }

    get nextDisabled() {
        return this._safePage >= this.totalPages;
    }

    _mapIssue(q) {
        const isContradiction = q.type === 'contradiction';
        const assignedTo = assigneeForIssue(q.id);
        return {
            id: q.id,
            domain: q.domain,
            title: q.title,
            description: q.description,
            isContradiction,
            isSimilarity: !isContradiction,
            typeBadgeLabel: isContradiction ? 'Contradiction' : 'Similar Article',
            confidenceLabel: `Confidence: ${q.confidence}%`,
            priority: q.priority,
            priorityBadgeClass: this._priorityClass(q.priority),
            assignedLabel: assignedTo === 'You' ? 'Assigned to you' : `Assigned to ${assignedTo}`,
            assignedInitials: this._initials(assignedTo),
            itemALabel: isContradiction ? 'Option A' : 'Article 1',
            itemBLabel: isContradiction ? 'Option B' : 'Article 2',
            itemA: { ...q.itemA },
            itemB: { ...q.itemB },
        };
    }

    _priorityClass(priority) {
        const map = {
            Critical: 'slds-theme_error',
            High: 'slds-theme_warning',
            Medium: 'slds-badge_lightest',
            Low: 'slds-badge_lightest',
        };
        return `qi-priority-badge ${map[priority] || 'slds-badge_lightest'}`;
    }

    _initials(name) {
        if (name === 'You') return 'You';
        return name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    }

    // ── Filter / pagination handlers ─────────────────────────────────
    handleFilterChange(event) {
        const field = event.target?.name;
        if (!field) return;
        this._filters = { ...this._filters, [field]: event.detail?.value ?? '' };
        this._page = 1;
    }

    handlePrev() {
        if (this._safePage > 1) this._page = this._safePage - 1;
    }

    handleNext() {
        if (this._safePage < this.totalPages) this._page = this._safePage + 1;
    }

    handleGotoPage(event) {
        const page = parseInt(event.currentTarget?.dataset?.page, 10);
        if (page) this._page = page;
    }

    // ── Article / issue actions (mirror the dashboard tile) ──────────
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
            detail: { label: title, path, originPath: '/quality-issues' },
        }));
        navigate(path);
    }

    handlePickOption(event) {
        const title = event.currentTarget?.dataset?.title;
        if (!title) return;
        this._addArticleTab(title);
        this._navigateToArticle(title);
    }

    handleMergeArticles(event) {
        const title = event.currentTarget?.dataset?.title || 'Merged Article';
        this._addArticleTab(title);
        this._navigateToArticle(title);
    }

    handleArchiveArticle(event) {
        this._ignore(event);
    }

    handleIgnoreIssue(event) {
        this._ignore(event);
    }

    _ignore(event) {
        const id = event.currentTarget?.dataset?.id;
        if (!id) return;
        this._ignoredIds = [...this._ignoredIds, id];
    }

    _addArticleTab(title) {
        window.dispatchEvent(new CustomEvent('workspace:addtab', {
            detail: { label: title, path: '/new-knowledge', originPath: '/quality-issues' },
        }));
    }

    _navigateToArticle(title) {
        setDraftSession({ title });
        navigate('/new-knowledge');
    }

    // ── Entrance motion ──────────────────────────────────────────────
    renderedCallback() {
        if (this._rendered) return;
        this._rendered = true;
        this._playEntrance();
    }

    _playEntrance() {
        const reduce =
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;

        const targets = [
            this.querySelector('.qi-header'),
            this.querySelector('.qi-filterbar'),
            ...this.querySelectorAll('.qi-tile'),
        ].filter(Boolean);
        if (!targets.length) return;

        gsap.from(targets, {
            opacity: 0,
            y: 16,
            duration: 0.5,
            ease: 'power2.out',
            stagger: 0.06,
            clearProps: 'opacity,transform',
        });
    }
}
