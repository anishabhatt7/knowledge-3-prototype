import { LightningElement, api, track } from 'lwc';

/**
 * Draft-with-Agentforce modal.
 *
 * Three internal steps:
 *   1. 'form'      — title + record type + language inputs
 *   2. 'similarity'— preview of similar existing articles, with checkboxes
 *   3. 'generating'— full-card spinner while we "generate the draft"
 *
 * Emits:
 *   - cancel   → user dismissed (X / backdrop / Cancel)
 *   - generate → user clicked "Generate Draft"; detail = { title, recordType, language }
 */
export default class DraftAgentforceModal extends LightningElement {
    static renderMode = 'light';

    /** When false, the host renders nothing (component is mounted but inert). */
    @api open = false;

    @track _step = 'form';
    @track _title = '';
    @track _recordType = 'faq';
    @track _language = 'en_US';
    @track _selectedSimilar = new Set();

    // ── Step 1: Form options ──────────────────────────────────────────
    recordTypeOptions = [
        { value: 'faq', label: 'Frequently Asked Questions (FAQs)' },
        { value: 'how-to', label: 'How-To Guide' },
        { value: 'troubleshooting', label: 'Troubleshooting' },
        { value: 'reference', label: 'Reference Article' },
    ];

    languageOptions = [
        { value: 'en_US', label: 'English' },
        { value: 'es', label: 'Spanish' },
        { value: 'fr', label: 'French' },
        { value: 'de', label: 'German' },
        { value: 'ja', label: 'Japanese' },
    ];

    // ── Step 2: Similar articles (mocked to match the Figma frame) ────
    similarArticles = [
        {
            id: 'sim-1',
            title: 'Common exclusions or limitations in solar panel warranties for homeowners',
            source: 'Confluence',
            sourceIcon: 'utility:knowledge_base',
            updated: '4/13/2025',
            status: 'Draft',
            statusVariant: 'draft',
            score: 56,
            aspects: ['Login Information', 'Repair Steps', 'Battery Usage factors'],
        },
        {
            id: 'sim-2',
            title: 'Common exclusions or limitations in solar panel warranties for homeowners',
            source: 'Confluence',
            sourceIcon: 'utility:knowledge_base',
            updated: '4/13/2025',
            status: 'Published',
            statusVariant: 'published',
            score: 45,
            aspects: ['Login Information', 'Repair Steps', 'Battery Usage factors'],
        },
        {
            id: 'sim-3',
            title: 'Common exclusions or limitations in solar panel warranties for homeowners',
            source: 'Confluence',
            sourceIcon: 'utility:knowledge_base',
            updated: '4/13/2025',
            status: 'Draft',
            statusVariant: 'draft',
            score: 40,
            aspects: ['Login Information', 'Repair Steps', 'Battery Usage factors'],
        },
    ];

    // ── Reactive UI state derivations ─────────────────────────────────
    get isFormStep() { return this._step === 'form'; }
    get isSimilarityStep() { return this._step === 'similarity'; }
    get isGenerating() { return this._step === 'generating'; }

    /** Subtitle on the similarity step uses the user-entered title verbatim. */
    get similaritySubtitle() {
        return this._title?.trim() || 'this article';
    }

    /** Each similar-article row needs reactive `selected` + `statusClass`. */
    get displaySimilarArticles() {
        return this.similarArticles.map((a) => ({
            ...a,
            selected: this._selectedSimilar.has(a.id),
            statusClass: `da-status-pill da-status-pill--${a.statusVariant}`,
            scoreLabel: `${a.score}%`,
        }));
    }

    /** Two-dot stepper (1 of 2) used as a footer indicator. */
    get progressDot1Class() {
        return this.isSimilarityStep ? 'da-progress__dot da-progress__dot--complete'
                                     : 'da-progress__dot da-progress__dot--active';
    }
    get progressDot2Class() {
        return this.isSimilarityStep ? 'da-progress__dot da-progress__dot--active'
                                     : 'da-progress__dot';
    }
    get progressBarFillClass() {
        return this.isSimilarityStep ? 'da-progress__fill da-progress__fill--full'
                                     : 'da-progress__fill';
    }

    // ── Lifecycle: reset to step 1 every time the modal is reopened ───
    @api
    reset() {
        this._step = 'form';
        this._selectedSimilar = new Set();
        this._title = '';
        this._recordType = 'faq';
        this._language = 'en_US';
    }

    // ── Step 1: form handlers ─────────────────────────────────────────
    handleTitleChange(event) {
        this._title = event.target.value;
    }

    handleRecordTypeChange(event) {
        this._recordType = event.detail?.value ?? event.target.value;
    }

    handleLanguageChange(event) {
        this._language = event.detail?.value ?? event.target.value;
    }

    // ── Footer actions ────────────────────────────────────────────────
    handleCancel() {
        this.dispatchEvent(new CustomEvent('cancel'));
    }

    handleNext() {
        if (this.isFormStep) {
            this._step = 'similarity';
        }
    }

    handleBack() {
        if (this.isSimilarityStep) {
            this._step = 'form';
        }
    }

    handleGenerate() {
        if (!this.isSimilarityStep) return;
        this._step = 'generating';
        // Brief spinner before bubbling up — feels like an LLM call.
        this._generateTimer = window.setTimeout(() => {
            const recordTypeLabel =
                this.recordTypeOptions.find((o) => o.value === this._recordType)?.label ??
                this._recordType;
            const languageLabel =
                this.languageOptions.find((o) => o.value === this._language)?.label ??
                this._language;
            this.dispatchEvent(new CustomEvent('generate', {
                detail: {
                    title: this._title?.trim() || 'Untitled Article',
                    recordType: recordTypeLabel,
                    recordTypeValue: this._recordType,
                    language: languageLabel,
                    languageValue: this._language,
                },
            }));
        }, 1400);
    }

    // ── Step 2: row selection ─────────────────────────────────────────
    handleSimilarToggle(event) {
        const id = event.currentTarget?.dataset?.id;
        if (!id) return;
        const next = new Set(this._selectedSimilar);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        this._selectedSimilar = next;
    }

    // ── Backdrop dismissal ────────────────────────────────────────────
    handleBackdropClick() {
        if (this.isGenerating) return;
        this.handleCancel();
    }

    // Stop click propagation inside the dialog itself.
    handleDialogClick(event) {
        event.stopPropagation();
    }

    disconnectedCallback() {
        if (this._generateTimer) {
            window.clearTimeout(this._generateTimer);
            this._generateTimer = null;
        }
    }
}
