import { LightningElement, track } from 'lwc';
import { animate as motionAnimate, stagger as motionStagger } from 'motion';
import {
    initialArticle,
    articleHealth,
    smartSuggests,
    initialChat,
    recordType,
    dataCategories,
    audiences,
    knowledgeBlocks,
    knowledgeBaseToc,
    freshId,
    inlineAISuggestions,
} from 'data/knowledge';

// Grammarly-style popover dwell time before it closes after a mouse-leave.
const SUGGESTION_POPOVER_HIDE_DELAY = 220;

// Header brand icon per suggestion type, so each kind of suggestion reads
// at a glance. Falls back to the AI sparkles mark for unknown types.
const SUGGESTION_TYPE_ICONS = {
    spelling: 'utility:edit',
    grammar: 'utility:comments',
    readability: 'utility:preview',
    tone: 'utility:announcement',
    addition: 'utility:add',
};
const DEFAULT_SUGGESTION_ICON = 'utility:sparkles';
import { consumeDraftSession } from 'data/draftSession';
import { consumeEditSession } from 'data/editSession';
import { setArticleEdit } from 'data/articleEdits';
import { setRecord, getRecord } from 'data/recordSession';

// Import child components so Vite + LWC register them eagerly
import 'ui/knowledgeAssist';
import 'ui/chatPanel';
import 'ui/collaboratorCursors';
import 'ui/collaboratorAvatars';
import Toast from 'lightning/toast';

/**
 * Review Article page — Unified WYSIWYG Editor.
 *
 * Replaces the block-based editor with a single contenteditable area
 * driven by document.execCommand for formatting. The article's block
 * data is converted to HTML on mount and rendered inside the editor.
 *
 * Preserves:
 *   - Inline Authoring Agent chat that proposes Apply-able actions
 *   - Smart suggestions in the left panel
 *   - Article health metrics that react to edits
 *   - Knowledge Assist panel + chat panel with animations
 */
export default class ReviewArticle extends LightningElement {
    static renderMode = 'light';

    @track article = deepClone(initialArticle);
    @track health = { ...articleHealth };
    // Randomize each card's projected score increase (3–9%) so the panel
    // reads like a live analysis rather than fixed mock numbers. Keep
    // `coverageDelta` in sync so the health boost on accept matches the
    // "+X%" shown on the card.
    @track suggests = smartSuggests.map((s) => {
        const delta = 3 + Math.floor(Math.random() * 7);
        return { ...s, scoreDelta: delta, coverageDelta: delta };
    });
    @track chatMessages = initialChat.map((m) => ({ ...m }));
    @track undoStack = [];
    @track redoStack = [];
    @track knowledgeBlockLibrary = knowledgeBlocks.map((kb) => ({ ...kb }));
    knowledgeToc = knowledgeBaseToc;
    @track showAssistPanel = true;
    @track isAssistCollapsed = false;
    // When true, the Knowledge Assist panel widens beyond its default
    // 379px to give reviewers more reading/action real estate (Figma
    // 140:26133). Mutually exclusive with the collapsed rail state.
    @track isAssistExpanded = false;
    @track showChatPanel = false;
    _chatAnimating = false;
    @track showCollaborators = false;
    @track activeCollaborators = [];
    @track extraCollaboratorCount = 0;
    @track animationEnabled = true;
    @track wordCount = 0;

    // Article tab navigation (Figma 430:55705). AI Preview is no longer a
    // tab — it lives as the "Show AI Preview" toggle in the header.
    @track activeTab = 'editor';
    @track openTabs = [
        { id: 'editor', label: 'Editor', count: 12 },
        { id: 'metadata', label: 'Metadata', count: 8 },
        { id: 'enrichments', label: 'Enrichments', count: 6 },
    ];

    // Header "Show AI Preview" toggle (Figma 430:57332). Off by default to
    // match the design's resting state.
    @track showAiPreview = false;

    // ─── Metadata tab (Figma 437:62640) ──────────────────────────────
    // AI-generated metadata the writer can edit. Multi-value fields keep
    // their selections as removable tag pills; single-value fields show
    // the value inline. `ai` fields get the sparkle "generate" affordance.
    @track metadataFields = [
        { id: 'products', label: 'Products', required: true, ai: true, kind: 'combobox', multi: true, value: '', tags: [{ id: 'products-platform', label: 'Platform' }], extra: 0,
            options: ['Platform', 'Sales Cloud', 'Service Cloud', 'Marketing Cloud', 'Commerce Cloud', 'Data Cloud', 'Slack', 'Tableau', 'MuleSoft'] },
        { id: 'features', label: 'Features', required: true, ai: true, kind: 'combobox', multi: true, value: '', tags: [{ id: 'features-flows', label: 'Flows' }], extra: 0,
            options: ['Flows', 'Apex', 'Lightning Web Components', 'Reports & Dashboards', 'Permissions', 'Automation', 'Einstein'] },
        { id: 'primary-audience', label: 'Primary Audience', required: true, ai: true, kind: 'combobox', multi: false, value: 'Admin', tags: [], extra: 0,
            options: ['Admin', 'Developer', 'End User', 'Architect', 'Business Analyst'] },
        { id: 'content-type', label: 'Content Type', required: true, ai: true, kind: 'combobox', multi: false, value: 'Procedure', tags: [], extra: 0,
            options: ['Procedure', 'Concept', 'Reference', 'Troubleshooting', 'FAQ', 'Release Notes'] },
        { id: 'release-versions', label: 'Release Versions', required: true, ai: true, kind: 'combobox', multi: true, value: '', tags: [{ id: 'rv-spring26', label: "Spring '26" }], extra: 0,
            options: ["Winter '26", "Spring '26", "Summer '26", "Winter '27"] },
        { id: 'use-cases', label: 'Use Cases', required: true, ai: true, kind: 'combobox', multi: true, value: '', tags: [{ id: 'uc-setup', label: 'Setup' }, { id: 'uc-config', label: 'Configuration' }], extra: 0,
            options: ['Setup', 'Configuration', 'Integration', 'Migration', 'Administration', 'Reporting'] },
        { id: 'confidence-level', label: 'Confidence Level', required: true, ai: true, kind: 'combobox', multi: false, value: 'In Review', tags: [], extra: 0,
            options: ['In Review', 'Draft', 'Verified', 'High', 'Medium', 'Low'] },
        { id: 'complexity-level', label: 'Complexity Level', required: true, ai: true, kind: 'combobox', multi: false, value: 'Intermediate', tags: [], extra: 0,
            options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
        { id: 'industry-vertical', label: 'Industry/Vertical', required: true, ai: true, kind: 'combobox', multi: true, value: '', tags: [{ id: 'iv-aviation', label: 'Aviation & Travel' }], extra: 0,
            options: ['Aviation & Travel', 'Financial Services', 'Healthcare', 'Retail', 'Manufacturing', 'Public Sector', 'Education'] },
        { id: 'language-region', label: 'Language/Region', required: false, ai: false, kind: 'input', value: 'English (US)', tags: [], extra: 0 },
        { id: 'article-owner', label: 'Article Owner', required: true, ai: false, kind: 'input', value: 'Jordan Avery', tags: [], extra: 0 },
    ];

    // Combobox dropdown UI state — only one open at a time. `_comboQuery`
    // is the live search text for the open field; it filters `options`.
    @track _openComboId = null;
    @track _comboQuery = '';

    @track metadataProperties = [
        { id: 'article-number', label: 'Article Number', value: '000123456', addable: true },
        { id: 'publication-status', label: 'Publication Status', value: 'Draft', addable: false },
        { id: 'version-number', label: 'Version Number', value: '3', addable: false },
        { id: 'last-modified', label: 'Last Modified Date', value: 'Jun 6, 2026', addable: false },
        { id: 'total-views', label: 'Article Total View Count', value: '12,480', addable: false },
        { id: 'first-published', label: 'First Published Date', value: 'Mar 2, 2026', addable: false },
    ];

    @track metaSectionOpen = true;
    @track propsSectionOpen = true;

    // ─── Enrichments tab (Figma 462:63733) ───────────────────────────
    // AI-derived enrichments: a generated abstract, the top questions the
    // article answers, and related entities (products/features).
    @track aiAbstract = {
        summary:
            'This article summarizes how airline baggage policies impact operational ' +
            'efficiency, passenger satisfaction, and airline revenue. It analyzes the ' +
            '"de-bundling" of ancillary fees and offers a framework for balancing optimal ' +
            'baggage allowance with profitability.',
    };

    @track enrichmentQuestions = [
        { id: 'q1', text: 'What is the standard carry-on baggage allowance?',
            answer: 'Each passenger may bring one carry-on bag plus one personal item that fits in the overhead bin or under the seat in front of them.' },
        { id: 'q2', text: 'How much does it cost to add a checked bag?',
            answer: 'The first checked bag is $35 when added online during booking, or $45 if added at the airport.' },
        { id: 'q3', text: 'What are the size and weight limits for checked luggage?',
            answer: 'Checked luggage must not exceed 62 linear inches (length + width + height) and 50 lbs to avoid additional fees.' },
        { id: 'q4', text: 'Are there fees for overweight or oversized bags?',
            answer: 'Bags between 51–70 lbs incur a $100 overweight fee, and bags exceeding 62 linear inches are charged a $150 oversize fee.' },
        { id: 'q5', text: 'What items are prohibited in carry-on baggage?',
            answer: 'Liquids over 3.4 oz, sharp objects, and flammable materials are not permitted in carry-on bags and must be checked or left behind.' },
        { id: 'q6', text: 'How do I report delayed or lost baggage?',
            answer: 'File a report at the airline’s baggage service desk before leaving the airport, or submit a claim online within 24 hours.' },
    ];

    _expandedQuestions = new Set();
    _editingQuestionId = null;
    // Draft buffer for the question currently in inline-edit mode. The edit
    // inputs are bound to these (controlled), so re-renders never wipe typed
    // text and Save reads a guaranteed-fresh value instead of querying the DOM.
    @track _draftQuestionText = '';
    @track _draftQuestionAnswer = '';

    @track relatedFields = [
        { id: 'related-products', label: 'Related Products', required: true, ai: true, kind: 'combobox', multi: true, value: '', extra: 6,
            tags: [
                { id: 'related-products-checked-baggage', label: 'Checked Baggage' },
                { id: 'related-products-carry-on', label: 'Carry-On Allowance' },
                { id: 'related-products-priority-boarding', label: 'Priority Boarding' },
            ],
            options: ['Checked Baggage', 'Carry-On Allowance', 'Priority Boarding', 'Excess Baggage', 'Travel Insurance', 'Seat Selection', 'Lounge Access', 'Sports Equipment', 'Pet in Cabin'] },
        { id: 'related-features', label: 'Related Features', required: true, ai: true, kind: 'combobox', multi: true, value: '', extra: 6,
            tags: [
                { id: 'related-features-online-checkin', label: 'Online Check-in' },
                { id: 'related-features-baggage-tracking', label: 'Baggage Tracking' },
                { id: 'related-features-bag-fee-calculator', label: 'Bag Fee Calculator' },
            ],
            options: ['Online Check-in', 'Baggage Tracking', 'Bag Fee Calculator', 'Mobile Boarding Pass', 'Lost Baggage Claim', 'Weight Allowance Alerts', 'Fare Rules Lookup', 'Auto Rebooking', 'Trip Notifications'] },
    ];

    @track abstractSectionOpen = true;
    @track questionsSectionOpen = true;
    @track entitiesSectionOpen = true;

    get articleTabs() {
        return this.openTabs.map((t) => ({
            ...t,
            active: t.id === this.activeTab ? 'true' : 'false',
            class: `ra-tab${t.id === this.activeTab ? ' ra-tab_active' : ''}`,
        }));
    }


    handleTabClick(event) {
        const tabId = event.currentTarget.dataset.tab;
        if (!tabId || tabId === this.activeTab) return;
        // The editor lives in the Editor view and is unmounted when the
        // Metadata/Enrichments tabs are shown. Stash its current HTML and clear
        // the init guard so renderedCallback restores it (with edits intact)
        // when the writer returns.
        if (this.activeTab === 'editor') {
            const editorEl = this._getEditorEl();
            if (editorEl) {
                this._seedEditorHtml = editorEl.innerHTML;
                this._editorInitialized = false;
            }
        }
        this.activeTab = tabId;
    }

    get isMetadataTab() {
        return this.activeTab === 'metadata';
    }

    get isEnrichmentsTab() {
        return this.activeTab === 'enrichments';
    }

    // ─── Enrichments getters / handlers ──────────────────────────────
    get relatedEntityFields() {
        return this.relatedFields.map((f) => this._decorateField(f));
    }

    get enrichmentQuestionList() {
        return this.enrichmentQuestions.map((q) => {
            const expanded = this._expandedQuestions.has(q.id);
            const editing = q.id === this._editingQuestionId;
            return {
                ...q,
                expanded,
                editing,
                chevron: expanded ? 'utility:chevrondown' : 'utility:chevronright',
                cardClass: `ra-enrich-q${expanded ? ' ra-enrich-q_expanded' : ''}`,
            };
        });
    }

    get questionsChevron() {
        return this.questionsSectionOpen ? 'utility:chevrondown' : 'utility:chevronright';
    }

    get entitiesChevron() {
        return this.entitiesSectionOpen ? 'utility:chevrondown' : 'utility:chevronright';
    }

    handleToggleQuestionsSection() {
        this.questionsSectionOpen = !this.questionsSectionOpen;
    }

    handleToggleEntitiesSection() {
        this.entitiesSectionOpen = !this.entitiesSectionOpen;
    }

    handleRegenerateAbstract() {
        // Prototype: re-trigger the "AI" summary (no-op refresh affordance).
        this.aiAbstract = { ...this.aiAbstract };
    }

    handleQuestionToggle(event) {
        const id = event.currentTarget.dataset.id;
        const next = new Set(this._expandedQuestions);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        this._expandedQuestions = next;
    }

    handleQuestionDelete(event) {
        const id = event.currentTarget.dataset.id;
        this.enrichmentQuestions = this.enrichmentQuestions.filter((q) => q.id !== id);
    }

    get draftQuestionText() {
        return this._draftQuestionText;
    }

    get draftQuestionAnswer() {
        return this._draftQuestionAnswer;
    }

    handleQuestionEdit(event) {
        // Enter inline edit mode for this question: the title becomes an input
        // and the answer a textarea, with save/discard controls. Seed the draft
        // buffer from the current values so the controlled inputs start correct.
        const id = event.currentTarget.dataset.id;
        const question = this.enrichmentQuestions.find((q) => q.id === id);
        this._draftQuestionText = question ? question.text : '';
        this._draftQuestionAnswer = question ? question.answer : '';
        this._editingQuestionId = id;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        requestAnimationFrame(() => {
            const el = this.template.querySelector(`.ra-enrich-q__qinput[data-id="${id}"]`);
            if (el) el.focus();
        });
    }

    handleQuestionDraftTextChange(event) {
        this._draftQuestionText = event.target.value;
    }

    handleQuestionDraftAnswerChange(event) {
        this._draftQuestionAnswer = event.target.value;
    }

    handleQuestionEditSave(event) {
        const id = event.currentTarget.dataset.id;
        // Read from the controlled draft buffer (kept in sync via onchange), not
        // the DOM, so edits are reliably captured regardless of render timing.
        const text = this._draftQuestionText;
        const answer = this._draftQuestionAnswer;
        this.enrichmentQuestions = this.enrichmentQuestions.map((q) =>
            q.id === id ? { ...q, text, answer } : q
        );
        // Exit edit mode (back to accordion card) and expand the item so the
        // freshly saved answer is visible rather than collapsed behind the header.
        this._editingQuestionId = null;
        const next = new Set(this._expandedQuestions);
        next.add(id);
        this._expandedQuestions = next;
    }

    handleQuestionEditCancel() {
        // Discard changes by leaving edit mode; the draft buffer is reset so
        // any unsaved input is dropped.
        this._editingQuestionId = null;
        this._draftQuestionText = '';
        this._draftQuestionAnswer = '';
    }

    _decorateField(f) {
        const isOpen = f.id === this._openComboId;
        const query = isOpen ? (this._comboQuery || '') : '';
        const selectedLabels = f.multi
            ? new Set((f.tags || []).map((t) => t.label))
            : new Set(f.value ? [f.value] : []);
        let options = f.options || [];
        if (query) {
            const q = query.toLowerCase();
            options = options.filter((o) => o.toLowerCase().includes(q));
        }
        const filteredOptions = options.map((label, i) => {
            const selected = selectedLabels.has(label);
            return {
                id: `${f.id}-opt-${i}`,
                label,
                selected,
                optionClass: `ra-meta-listbox__option${selected ? ' ra-meta-listbox__option_selected' : ''}`,
            };
        });
        // While open, the input doubles as a search box (shows the query).
        // When closed, single-select fields show their committed value;
        // multi-select fields summarize the selection count (or stay empty
        // so the placeholder shows when nothing is selected).
        const selectedCount = f.multi ? (f.tags || []).length : 0;
        let inputValue;
        if (isOpen) {
            inputValue = query;
        } else if (f.multi) {
            inputValue = selectedCount > 0
                ? `${selectedCount} selected`
                : '';
        } else {
            inputValue = f.value || '';
        }
        return {
            ...f,
            isCombobox: f.kind === 'combobox',
            isInput: f.kind === 'input',
            hasTags: (f.tags || []).length > 0,
            showExtra: (f.extra || 0) > 0,
            extraLabel: `+${f.extra || 0} more`,
            isDirty: !!f._original,
            // The "AI generated" sparkle only applies while the value is
            // untouched; once the writer edits the field it's no longer
            // AI-authored, so the sparkle gives way to the undo affordance.
            showSparkle: f.ai && !f._original,
            fieldClass: `ra-meta-field${f._original ? ' ra-meta-field_dirty' : ''}`,
            isOpen,
            inputValue,
            filteredOptions,
            noOptions: isOpen && filteredOptions.length === 0,
        };
    }

    get metadataFieldRows() {
        return this.metadataFields.map((f) => this._decorateField(f));
    }

    get metadataFieldsLeft() {
        return this.metadataFields
            .filter((_, i) => i % 2 === 0)
            .map((f) => this._decorateField(f));
    }

    get metadataFieldsRight() {
        return this.metadataFields
            .filter((_, i) => i % 2 === 1)
            .map((f) => this._decorateField(f));
    }

    get metaChevron() {
        return this.metaSectionOpen ? 'utility:chevrondown' : 'utility:chevronright';
    }

    get propsChevron() {
        return this.propsSectionOpen ? 'utility:chevrondown' : 'utility:chevronright';
    }

    handleToggleMetaSection() {
        this.metaSectionOpen = !this.metaSectionOpen;
    }

    handleTogglePropsSection() {
        this.propsSectionOpen = !this.propsSectionOpen;
    }

    handleMetaInput(event) {
        const id = event.currentTarget.dataset.id;
        const value = event.target.value;
        this.metadataFields = this.metadataFields.map((f) => {
            if (f.id !== id) return f;
            const updated = { ...f, value };
            if (f.ai && !f._original) {
                updated._original = { value: f.value, tags: f.tags ? [...f.tags] : [] };
            }
            return updated;
        });
    }

    // Combobox fields live in two arrays (metadata + related entities);
    // these helpers find/update a field by id in whichever array owns it.
    _findComboField(id) {
        return this.metadataFields.find((f) => f.id === id)
            || this.relatedFields.find((f) => f.id === id);
    }

    _setComboField(id, mapper) {
        if (this.metadataFields.some((f) => f.id === id)) {
            this.metadataFields = this.metadataFields.map((f) => (f.id === id ? mapper(f) : f));
        } else if (this.relatedFields.some((f) => f.id === id)) {
            this.relatedFields = this.relatedFields.map((f) => (f.id === id ? mapper(f) : f));
        }
    }

    handleMetaTagRemove(event) {
        const fieldId = event.currentTarget.dataset.field;
        const tagId = event.currentTarget.dataset.tag;
        this._setComboField(fieldId, (f) => {
            const updated = { ...f, tags: (f.tags || []).filter((t) => t.id !== tagId) };
            if (f.ai && !f._original) {
                updated._original = { value: f.value, tags: f.tags ? [...f.tags] : [] };
            }
            return updated;
        });
    }

    handleMetaUndo(event) {
        const id = event.currentTarget.dataset.id;
        this.metadataFields = this.metadataFields.map((f) => {
            if (f.id !== id || !f._original) return f;
            return { ...f, value: f._original.value, tags: [...f._original.tags], _original: undefined };
        });
    }

    // ─── Combobox dropdown (searchable listbox) ──────────────────────
    handleComboFocus(event) {
        this._openComboId = event.currentTarget.dataset.id;
        this._comboQuery = '';
    }

    handleComboInput(event) {
        this._openComboId = event.currentTarget.dataset.id;
        this._comboQuery = event.target.value;
    }

    handleComboBlur() {
        // Options use mousedown + preventDefault to keep input focus, so a
        // blur here means focus left the combobox entirely — close it.
        this._openComboId = null;
        this._comboQuery = '';
    }

    handleComboChevron(event) {
        // mousedown (not click) so we run before the input's blur and can
        // toggle without the dropdown closing from under us.
        event.preventDefault();
        const id = event.currentTarget.dataset.id;
        if (this._openComboId === id) {
            this._openComboId = null;
            this._comboQuery = '';
        } else {
            this._openComboId = id;
            this._comboQuery = '';
            this._focusComboInput(id);
        }
    }

    handleOptionSelect(event) {
        // Keep focus on the input so the dropdown doesn't blur-close mid-click.
        event.preventDefault();
        const fieldId = event.currentTarget.dataset.field;
        const label = event.currentTarget.dataset.label;
        const field = this._findComboField(fieldId);
        if (!field) return;
        const isMulti = !!field.multi;
        this._setComboField(fieldId, (f) => {
            const updated = { ...f };
            if (f.ai && !f._original) {
                updated._original = { value: f.value, tags: f.tags ? [...f.tags] : [] };
            }
            if (isMulti) {
                const exists = (f.tags || []).some((t) => t.label === label);
                updated.tags = exists
                    ? (f.tags || []).filter((t) => t.label !== label)
                    : [...(f.tags || []), { id: `${f.id}-${this._slug(label)}`, label }];
            } else {
                updated.value = label;
            }
            return updated;
        });
        if (isMulti) {
            // Multi-select stays open for rapid tagging; reset the filter.
            this._comboQuery = '';
            this._focusComboInput(fieldId);
        } else {
            this._openComboId = null;
            this._comboQuery = '';
        }
    }

    _slug(label) {
        return String(label)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    _focusComboInput(id) {
        // Defer until the dropdown has rendered.
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        requestAnimationFrame(() => {
            const input = this.template.querySelector(`input.ra-meta-combobox__input[data-id="${id}"]`);
            if (input) input.focus();
        });
    }

    handleToggleAiPreview(event) {
        this.showAiPreview = event.target.checked;
    }

    // Editor state
    @track editorBlockStyle = 'p';
    _editorInitialized = false;

    // Grammarly-style inline AI suggestions. `_activeSuggestion` is the
    // currently visible popover descriptor (null when hidden);
    // `_dismissedSuggestionIds` keeps ids we've already dismissed so we
    // don't re-wrap them on later renderedCallback passes;
    // `_suggestionsApplied` gates the initial decoration pass.
    @track _activeSuggestion = null;
    _dismissedSuggestionIds = new Set();
    _suggestionsApplied = false;
    _popoverHideTimer = null;

    // Entrance-animation flags
    _arrivedFromDraft = false;
    _didEntranceAnimation = false;

    _boundEscapeHandler = null;

    // Edit-mode state — set when the user enters via Knowledge Record's
    // "Edit Article" / "Edit Article to Resolve" actions. Drives the
    // initial editor seed (`_seedEditorHtml`) and the save write-back.
    _editingArticleId = null;
    _seedEditorHtml = null;

    connectedCallback() {
        // Edit-mode entry from the Knowledge Record page wins over the
        // draft-from-Agentforce flow. The session was stashed by
        // KnowledgeRecord._launchActiveAuthoring before navigating, and
        // is read-and-cleared here so a hard refresh of the editor
        // route doesn't loop.
        const edit = consumeEditSession();
        if (edit && edit.id) {
            this._editingArticleId = String(edit.id);
            this.article = {
                ...this.article,
                id: this._editingArticleId,
                title: edit.title || this.article.title,
                status: 'draft',
                // Empty out blockData — the seed HTML below replaces
                // the demo baggage-allowance content that ships with
                // `initialArticle`.
                blockData: [],
            };
            if (edit.recordType) this.recordTypeLabel = edit.recordType;
            this._seedEditorHtml = edit.html || null;
            this._arrivedFromDraft = true;
            this.classList.add('ra--entering');
        } else {
            const draft = consumeDraftSession();
            if (draft) {
                this.article = {
                    ...this.article,
                    title: draft.title || this.article.title,
                    status: 'draft',
                };
                if (draft.recordType) this.recordTypeLabel = draft.recordType;
                this._arrivedFromDraft = true;
                this.classList.add('ra--entering');
            }
        }

        this._boundEscapeHandler = (e) => {
            if (e.key === 'Escape') {
                // no-op for now, kept for future prompt handling
            }
        };
        document.addEventListener('keydown', this._boundEscapeHandler);

        this._boundAgentforceToggle = (e) => {
            const next = e.detail?.open;
            if (typeof next === 'boolean' && next !== this.showChatPanel) {
                this._animateChatPanel(next);
            }
        };
        window.addEventListener('agentforce:toggle', this._boundAgentforceToggle);
    }

    disconnectedCallback() {
        if (this._boundEscapeHandler) {
            document.removeEventListener('keydown', this._boundEscapeHandler);
            this._boundEscapeHandler = null;
        }
        if (this._boundAgentforceToggle) {
            window.removeEventListener('agentforce:toggle', this._boundAgentforceToggle);
            this._boundAgentforceToggle = null;
        }
        if (this._popoverHideTimer) {
            clearTimeout(this._popoverHideTimer);
            this._popoverHideTimer = null;
        }
        this._activeSuggestion = null;
    }

    // Top-level nav/chrome
    recordTypeLabel = recordType.label;
    dataCategoryList = dataCategories.map((d, i) => ({ key: `dc-${i}`, label: d.label }));
    audienceList = audiences.map((a, i) => ({ key: `a-${i}`, label: a.label }));

    get statusLabel() {
        return this.article.status?.charAt(0).toUpperCase() + this.article.status?.slice(1);
    }

    // Tracks blocks the user explicitly inserts from the Knowledge Assist
    // list during this session. The article may already contain seeded
    // knowledge blocks, but those aren't counted as "inserted from the
    // list" — so the library starts clean (every block shows "Insert
    // Block") and only flips to "Block Inserted" once the user adds it.
    @track _insertedBlockIds = [];

    get insertedBlockIds() {
        return this._insertedBlockIds;
    }

    get assistPanelClass() {
        const base = 'ra-shell__aside ra-shell__aside_left';
        if (!this.showAssistPanel) return `${base} ra-hidden`;
        if (this.isAssistCollapsed) return `${base} ra-shell__aside_collapsed`;
        if (this.isAssistExpanded) return `${base} ra-shell__aside_expanded`;
        return base;
    }

    get shellClass() {
        let cls = 'ra-shell';
        if (!this.showAssistPanel) cls += ' ra-shell_no-left';
        else if (this.isAssistCollapsed) cls += ' ra-shell_assist-collapsed';
        else if (this.isAssistExpanded) cls += ' ra-shell_assist-expanded';
        if (!this.showChatPanel) cls += ' ra-shell_no-right';
        return cls;
    }

    get chatPanelClass() {
        const base = 'ra-shell__aside ra-shell__aside_right';
        return this.showChatPanel ? base : `${base} ra-shell__aside_right_hidden`;
    }

    get mainClass() {
        return `ra-shell__main ${this.showAssistPanel ? '' : 'ra-shell__main_no-left'}`;
    }

    // ─── Convert block data to HTML ───────────────────────────────────
    // Render a single block (heading, paragraph, list item, etc.) to HTML.
    _blockHtml(b) {
        const content = b.content || '';
        switch (b.type) {
            case 'h1':
                return `<h1>${content}</h1>`;
            case 'h2':
                return `<h2>${content}</h2>`;
            case 'h3':
                return `<h3>${content}</h3>`;
            case 'p':
                return `<p>${content}</p>`;
            case 'li':
                return `<ul><li>${content}</li></ul>`;
            case 'blockquote':
                return `<blockquote>${content}</blockquote>`;
            case 'image':
                return `<figure class="ra-editor-figure"><img src="${import.meta.env.BASE_URL}images/baggage-measure.jpg" alt="${b.caption || ''}" /><figcaption>${b.caption || ''}</figcaption></figure>`;
            case 'video':
                return `<div class="ra-editor-video"><div class="ra-editor-video__icon">&#9654;</div><div class="ra-editor-video__info"><strong>${b.title || ''}</strong><p>${content}</p></div></div>`;
            default:
                return `<p>${content}</p>`;
        }
    }

    // Wrap one or more block-HTML strings as a synced Knowledge Block, so
    // the editor shows the same dashed-outline + "Knowledge Block" badge
    // treatment as the V1 authoring experience.
    _wrapKnowledgeBlock(innerHtml, syncGroupId) {
        return `<div class="ra-kb-block" data-sync-group="${syncGroupId || ''}">${innerHtml}</div>`;
    }

    _blocksToHtml(blocks) {
        if (!blocks || !blocks.length) return '<p><br></p>';
        // Consecutive blocks that share a `syncGroupId` are collapsed into a
        // single Knowledge Block wrapper so the dashed outline + badge spans
        // the whole synced group (matching the V1 authoring experience).
        const parts = [];
        let i = 0;
        while (i < blocks.length) {
            const sync = blocks[i].syncGroupId;
            if (sync) {
                const group = [];
                while (i < blocks.length && blocks[i].syncGroupId === sync) {
                    group.push(this._blockHtml(blocks[i]));
                    i += 1;
                }
                parts.push(this._wrapKnowledgeBlock(group.join('\n'), sync));
            } else {
                parts.push(this._blockHtml(blocks[i]));
                i += 1;
            }
        }
        return parts.join('\n');
    }

    // ─── Editor initialization ────────────────────────────────────────
    renderedCallback() {
        // Play the Motion entrance once
        if (this._arrivedFromDraft && !this._didEntranceAnimation) {
            this._didEntranceAnimation = true;
            this._playEntranceAnimation();
        }

        // Initialize the contenteditable with HTML. Edit-mode entries
        // from Knowledge Record stash a pre-built `_seedEditorHtml` so
        // we honour that first; everything else falls back to the
        // block-to-HTML conversion of the article's `blockData`.
        if (!this._editorInitialized) {
            const editorEl = this._getEditorEl();
            if (editorEl) {
                this._editorInitialized = true;
                const html = this._seedEditorHtml
                    ? this._seedEditorHtml
                    : this._blocksToHtml(this.article.blockData);
                editorEl.innerHTML = html;
                this._updateWordCount();
                // If suggestions were already applied before the editor was
                // unmounted (e.g. the writer toggled to the Metadata tab and
                // back), the restored HTML still carries the suggestion spans
                // — just re-bind their popover listeners instead of re-wrapping.
                if (this._suggestionsApplied) {
                    this._rebindInlineSuggestions(editorEl);
                }
            }
        }

        // Decorate the editor with Grammarly-style underlines once the
        // editor has its initial HTML. We guard with _suggestionsApplied
        // so subsequent renderedCallbacks (e.g. when the popover state
        // changes) don't re-wrap and duplicate spans.
        if (this._editorInitialized && !this._suggestionsApplied) {
            const editorEl = this._getEditorEl();
            if (editorEl) {
                this._applyInlineSuggestions(editorEl);
                this._suggestionsApplied = true;
            }
        }
    }

    _getEditorEl() {
        return this.querySelector('.ra-editor[contenteditable]');
    }

    // ─── Editor event handlers ────────────────────────────────────────
    handleEditorInput() {
        this._updateWordCount();
    }

    handleEditorKeyDown(event) {
        // Ctrl/Cmd+B/I/U are handled natively by contenteditable
        // We just track undo for larger changes
        if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
            // Let the browser handle native undo in contenteditable
        }
    }

    handleEditorFocus() {
        // Could be used to show active state on toolbar
    }

    handleEditorBlur() {
        // Could be used to save state
    }

    // The Grammarly-style popover is anchored inside .ra-editor-host (a
    // sibling of the contenteditable), but the underline spans live
    // inside the contenteditable, which scrolls. Once the editor scrolls
    // the popover would visually detach from its underline, so we close
    // it — Grammarly behaves the same way.
    handleEditorScroll() {
        if (this._activeSuggestion) {
            if (this._popoverHideTimer) {
                clearTimeout(this._popoverHideTimer);
                this._popoverHideTimer = null;
            }
            this._activeSuggestion = null;
        }
    }

    // ─── Inline AI suggestions (Grammarly-style) ──────────────────
    /**
     * Walk all text nodes inside the editor and wrap the first
     * occurrence of each suggestion's `original` string with a styled
     * span that carries hover/click listeners. The wrapping happens
     * exactly once per page-mount (see _suggestionsApplied) so user
     * edits don't keep re-wrapping.
     */
    _applyInlineSuggestions(root) {
        if (!root || !inlineAISuggestions || !inlineAISuggestions.length) return;
        const suggestions = inlineAISuggestions.filter(
            (s) => !this._dismissedSuggestionIds.has(s.id)
        );
        suggestions.forEach((s) => this._wrapFirstOccurrence(root, s));
    }

    _wrapFirstOccurrence(root, suggestion) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) =>
                node.parentElement && node.parentElement.closest('.ai-suggest')
                    ? NodeFilter.FILTER_REJECT
                    : NodeFilter.FILTER_ACCEPT,
        });
        let node;
        while ((node = walker.nextNode())) {
            const idx = node.nodeValue.indexOf(suggestion.original);
            if (idx === -1) continue;
            try {
                const range = document.createRange();
                range.setStart(node, idx);
                range.setEnd(node, idx + suggestion.original.length);
                const span = document.createElement('span');
                span.className = `ai-suggest ai-suggest_${suggestion.type}`;
                span.dataset.suggestId = suggestion.id;
                range.surroundContents(span);
                this._attachSuggestionListeners(span, suggestion);
                return true;
            } catch (_e) {
                return false;
            }
        }
        return false;
    }

    _attachSuggestionListeners(span, suggestion) {
        span.addEventListener('mouseenter', () => this._openPopoverFor(span, suggestion));
        span.addEventListener('mouseleave', () => this._schedulePopoverClose());
        span.addEventListener('click', (e) => {
            // Don't let the click bubble — it would steal focus from any
            // inline buttons inside the popover that might be opening.
            e.stopPropagation();
            this._openPopoverFor(span, suggestion);
        });
    }

    // After an Undo restores the editor's innerHTML, the inline-suggestion
    // spans come back but their hover/click listeners are gone (replacing
    // innerHTML discards them). Re-bind each surviving span to its
    // descriptor so the Grammarly-style popovers keep working.
    _rebindInlineSuggestions(root) {
        if (!root) return;
        const spans = root.querySelectorAll('.ai-suggest[data-suggest-id]');
        spans.forEach((span) => {
            const id = span.dataset.suggestId;
            const suggestion = (inlineAISuggestions || []).find((x) => x.id === id);
            if (suggestion) this._attachSuggestionListeners(span, suggestion);
        });
    }

    _openPopoverFor(span, suggestion) {
        if (this._popoverHideTimer) {
            clearTimeout(this._popoverHideTimer);
            this._popoverHideTimer = null;
        }
        const host = this.querySelector('.ra-editor-host');
        if (!host) return;
        const hostRect = host.getBoundingClientRect();
        const spanRect = span.getBoundingClientRect();
        const top = spanRect.bottom - hostRect.top + 8;
        const left = Math.max(0, spanRect.left - hostRect.left);
        const isAddition = suggestion.type === 'addition';
        this._activeSuggestion = {
            id: suggestion.id,
            type: suggestion.type,
            label: suggestion.label,
            explanation: suggestion.explanation,
            original: suggestion.original,
            replacement: suggestion.replacement,
            addition: suggestion.addition,
            isAddition,
            acceptLabel: isAddition ? 'Add' : 'Accept',
            brandIcon: SUGGESTION_TYPE_ICONS[suggestion.type] || DEFAULT_SUGGESTION_ICON,
            popoverClass: `ai-popover ai-popover_${suggestion.type}`,
            style: `top: ${top}px; left: ${left}px;`,
        };
    }

    _schedulePopoverClose() {
        if (this._popoverHideTimer) clearTimeout(this._popoverHideTimer);
        this._popoverHideTimer = setTimeout(() => {
            this._activeSuggestion = null;
            this._popoverHideTimer = null;
        }, SUGGESTION_POPOVER_HIDE_DELAY);
    }

    handlePopoverEnter() {
        if (this._popoverHideTimer) {
            clearTimeout(this._popoverHideTimer);
            this._popoverHideTimer = null;
        }
    }

    handlePopoverLeave() {
        this._schedulePopoverClose();
    }

    /**
     * Close the popover without dismissing the suggestion. The
     * underline stays in the editor and the popover will reopen the
     * next time the user hovers the same span.
     */
    handleSuggestionClose(event) {
        event?.stopPropagation();
        this._activeSuggestion = null;
        if (this._popoverHideTimer) {
            clearTimeout(this._popoverHideTimer);
            this._popoverHideTimer = null;
        }
    }

    handleSuggestionAccept(event) {
        event?.stopPropagation();
        const s = this._activeSuggestion;
        if (!s) return;
        this.pushUndo();
        const editorEl = this._getEditorEl();
        if (editorEl) {
            const span = editorEl.querySelector(
                `.ai-suggest[data-suggest-id="${s.id}"]`
            );
            if (span && span.parentNode) {
                const parent = span.parentNode;
                // Rewrites swap the matched text; additions keep the anchor
                // text and append the new content right after it.
                const newText = s.isAddition
                    ? `${s.original} ${s.addition}`
                    : s.replacement;
                const textNode = document.createTextNode(newText);
                parent.replaceChild(textNode, span);
                if (parent.normalize) parent.normalize();
            }
        }
        this._dismissedSuggestionIds.add(s.id);
        this._activeSuggestion = null;
        if (this._popoverHideTimer) {
            clearTimeout(this._popoverHideTimer);
            this._popoverHideTimer = null;
        }
        this._updateWordCount();
        // Accepting an inline suggestion improves the article — nudge the
        // RAG/AI score up by a small, realistic amount.
        this.applyHealthBoost(2 + Math.floor(Math.random() * 3), 1);
    }

    handleSuggestionDismiss(event) {
        event?.stopPropagation();
        const s = this._activeSuggestion;
        if (!s) return;
        this._dismissedSuggestionIds.add(s.id);
        const editorEl = this._getEditorEl();
        if (editorEl) {
            const span = editorEl.querySelector(
                `.ai-suggest[data-suggest-id="${s.id}"]`
            );
            if (span && span.parentNode) {
                const parent = span.parentNode;
                while (span.firstChild) parent.insertBefore(span.firstChild, span);
                parent.removeChild(span);
                if (parent.normalize) parent.normalize();
            }
        }
        this._activeSuggestion = null;
        if (this._popoverHideTimer) {
            clearTimeout(this._popoverHideTimer);
            this._popoverHideTimer = null;
        }
    }

    _updateWordCount() {
        const editorEl = this._getEditorEl();
        if (!editorEl) {
            this.wordCount = 0;
            return;
        }
        const text = editorEl.innerText || '';
        const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
        this.wordCount = words.length;
    }

    // ─── Undo / Redo ──────────────────────────────────────────────────
    // Snapshot the live editor HTML + health + article metadata before an
    // agent-driven change (applied suggestion, inline accept, inserted
    // block). The browser's native undo stack doesn't track these
    // programmatic edits, so we restore from this snapshot on Undo.
    pushUndo() {
        const editorEl = this._getEditorEl();
        this.undoStack = [
            ...this.undoStack,
            {
                html: editorEl ? editorEl.innerHTML : null,
                health: { ...this.health },
                article: deepClone(this.article),
            },
        ].slice(-30);
        this.redoStack = [];
    }

    handleUndo() {
        // Restore the most recent snapshot (covers applied suggestions,
        // inline accepts, and inserted blocks — including the AI score
        // boost they applied). Fall back to native undo for plain typing.
        if (this.undoStack.length > 0) {
            const snap = this.undoStack[this.undoStack.length - 1];
            this.undoStack = this.undoStack.slice(0, -1);
            if (snap.article) this.article = deepClone(snap.article);
            if (snap.health) this.health = { ...snap.health };
            const editorEl = this._getEditorEl();
            if (editorEl && snap.html != null) {
                editorEl.innerHTML = snap.html;
                this._rebindInlineSuggestions(editorEl);
                this._updateWordCount();
            }
            return;
        }
        try {
            document.execCommand('undo', false, null);
        } catch (_) {
            // fallback: no-op
        }
    }

    handleRedo() {
        // Use execCommand redo for the contenteditable
        try {
            document.execCommand('redo', false, null);
        } catch (_) {
            // fallback: no-op
        }
    }

    handleTitleInput(event) {
        const text = event.target.textContent.replace(/\n/g, '');
        if (text !== this.article.title) {
            this.article = { ...this.article, title: text };
        }
    }

    handleTitleKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            event.target.blur();
        }
    }

    handleSave() {
        this.article = { ...this.article, status: 'draft' };
        // When the user opened this editor via Knowledge Record's
        // "Edit Article" / "Edit Article to Resolve" actions, we have
        // an `_editingArticleId` and need to push the new title + body
        // HTML back into `data/articleEdits`. The Knowledge Record
        // page listens for `article:saved` and re-renders, so the user
        // sees their changes the moment they switch tabs back.
        if (this._editingArticleId) {
            const editorEl = this._getEditorEl();
            const html = editorEl ? editorEl.innerHTML : this._seedEditorHtml || '';
            const title = (this.article.title || '').trim();
            setArticleEdit(this._editingArticleId, {
                title,
                html,
            });
            // Keep the source-of-truth record metadata up to date too,
            // so a fresh visit to /knowledge-record/:id picks up the
            // new title without depending on the in-memory edit map.
            const existing = getRecord(this._editingArticleId) || {};
            setRecord({
                ...existing,
                id: this._editingArticleId,
                title: title || existing.title,
            });
        }
        this.addAgentMessage('Article draft saved successfully.');
        this.showToast('Article draft saved');
    }

    handleSaveDropdown() {
        this.showToast('Save options (prototype)');
    }

    handleSaveMenuSelect(event) {
        const value = event.detail?.value;
        if (value === 'submit-for-approval') {
            this.article = { ...this.article, status: 'in-review' };
            this.addAgentMessage('Submitted for approval — reviewers have been notified.');
            this.showToast('Submitted for approval');
        } else if (value === 'invite-collaborators') {
            this.inviteCollaborators();
        } else if (value === 'edit-sources') {
            this.addAgentMessage('Edit the source materials backing this article.');
            this.showToast('Edit sources');
        } else if (value === 'add-translations') {
            this.addAgentMessage('Add translations for this article in additional locales.');
            this.showToast('Add translations');
        }
    }

    handleIgnorePillRemove(event) {
        event.preventDefault();
    }

    // ─── Editor toolbar (Figma 125:67886) ───────────────────────────
    editorMenuItems = [
        { id: 'file', label: 'File' },
        { id: 'edit', label: 'Edit' },
        { id: 'insert', label: 'Insert' },
        { id: 'view', label: 'View' },
        { id: 'format', label: 'Format' },
        { id: 'table', label: 'Table' },
        { id: 'tools', label: 'Tools' },
        { id: 'help', label: 'Help' },
    ];

    handleEditorMenuClick(event) {
        const menu = event.currentTarget.dataset.menu;
        if (!menu) return;
        this.showToast(`${menu.charAt(0).toUpperCase()}${menu.slice(1)} menu (prototype)`);
    }

    handleEditorMenuHelp() {
        this.showToast('Help (prototype)');
    }

    handleToolbarExpand() {
        if (this.showAssistPanel && !this.isAssistCollapsed) {
            this._animatePanel(true);
        }
        if (this.showChatPanel) {
            this._animateChatPanel(false);
        }
    }

    handleToolbarInsert() {
        // Open the Knowledge Assist panel to let the user insert blocks
        if (!this.showAssistPanel) {
            this.showAssistPanel = true;
            this.isAssistCollapsed = false;
        } else if (this.isAssistCollapsed) {
            this._animatePanel(false);
        }
        this.showToast('Select a Knowledge Block to insert');
    }

    handleToolbarAskAi() {
        if (!this.showChatPanel) {
            this._animateChatPanel(true);
        }
    }

    handleEditorBlockStyle(event) {
        const value = event.target?.value;
        if (!value) return;
        this.editorBlockStyle = value;
        try {
            const tag = value === 'quote' ? 'blockquote' : value;
            document.execCommand('formatBlock', false, tag);
        } catch (_) {
            /* execCommand throws if no selection */
        }
        // Refocus the editor after applying style
        const editorEl = this._getEditorEl();
        if (editorEl) editorEl.focus();
    }

    handleFormatCommand(event) {
        const btn = event.currentTarget;
        const cmd = btn?.dataset?.cmd;
        const arg = btn?.dataset?.arg || null;
        if (!cmd) return;
        try {
            document.execCommand(cmd, false, arg);
        } catch (_) {
            /* execCommand throws if no selection */
        }
        // Refocus the editor after applying format
        const editorEl = this._getEditorEl();
        if (editorEl) editorEl.focus();
    }

    // ─── Knowledge Block insertion ──────────────────────────────────
    handleInsertBlock(event) {
        const { syncGroupId } = event.detail;
        const entry = this.knowledgeBlockLibrary.find((kb) => kb.syncGroupId === syncGroupId);
        if (!entry || !entry.blocks) return;

        this.pushUndo();

        // Convert the knowledge block's blocks to HTML, then wrap the whole
        // group in the synced Knowledge Block treatment (dashed outline +
        // badge) so the inserted block looks like the V1 authoring blocks.
        const inner = entry.blocks.map((b) => this._blockHtml(b)).join('');
        const html = this._wrapKnowledgeBlock(inner, entry.syncGroupId);

        this._insertHtmlAtCursor(html);

        // Flip the library card to "Block Inserted".
        if (entry.syncGroupId && !this._insertedBlockIds.includes(entry.syncGroupId)) {
            this._insertedBlockIds = [...this._insertedBlockIds, entry.syncGroupId];
        }

        this.addAgentMessage(
            `Inserted knowledge block "${entry.title}" — ${entry.blocks.length} synced block(s) added.`
        );
        this.applyHealthBoost(4, 2);
        this.showToast(`"${entry.title}" block inserted`);
        this._updateWordCount();
    }

    /**
     * Insert HTML at the current cursor position in the contenteditable.
     * Falls back to appending at the end if there is no selection inside
     * the editor.
     */
    _insertHtmlAtCursor(html) {
        const editorEl = this._getEditorEl();
        if (!editorEl) return;

        editorEl.focus();
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            // Check if selection is inside our editor
            if (editorEl.contains(range.commonAncestorContainer)) {
                document.execCommand('insertHTML', false, html);
                return;
            }
        }
        // Fallback: append at end
        editorEl.innerHTML += html;
    }

    // ─── Animation toggle ──────────────────────────────────────────
    get animationToggleLabel() {
        return this.animationEnabled ? 'GSAP Animated' : 'No Animation';
    }

    get animationToggleClass() {
        return `ra-anim-toggle${this.animationEnabled ? ' ra-anim-toggle_on' : ''}`;
    }

    handleAnimationToggle() {
        this.animationEnabled = !this.animationEnabled;
        window.dispatchEvent(new CustomEvent('gsap:toggle', {
            detail: { enabled: this.animationEnabled },
        }));
    }

    // ─── Knowledge Assist actions ──────────────────────────────────
    _panelAnimating = false;

    handleAssistClose() {
        if (this._panelAnimating || this.isAssistCollapsed) return;
        this._animatePanel(true);
    }

    handleAssistExpand() {
        if (this._panelAnimating || !this.isAssistCollapsed) return;
        this._animatePanel(false);
    }

    // Toggle between the default 379px panel and the wider 600px panel
    // (Figma 140:26133/140:26134). Only meaningful when the panel is in
    // its non-collapsed state — otherwise the user has to expand from
    // the rail first via handleAssistExpand.
    handleAssistToggleWidth() {
        if (this.isAssistCollapsed) return;
        this._animateAssistWidth(!this.isAssistExpanded);
    }

    _animateAssistWidth(toExpanded) {
        const shell = this.querySelector('.ra-shell');
        const fromWidth = toExpanded ? '379px' : '600px';
        const toWidth = toExpanded ? '600px' : '379px';

        const skipAnimation = !shell ||
            !this.animationEnabled ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (skipAnimation) {
            this.isAssistExpanded = toExpanded;
            return;
        }

        // Flip the @track flag first so the class flip (.ra-shell_assist-expanded)
        // owns the *final* width. Then pin the previous width inline and tween it
        // toward the new width; the cleanup in `.finally()` removes the inline
        // style so the class-driven CSS variable wins again.
        this.isAssistExpanded = toExpanded;
        shell.style.setProperty('--ra-left-col', fromWidth);

        this._panelAnims?.forEach((a) => { try { a.stop?.(); } catch (_) {} });

        const easeTrack = [0.22, 0.61, 0.36, 1];
        const trackAnim = motionAnimate(
            shell,
            { '--ra-left-col': [fromWidth, toWidth] },
            { duration: 0.36, ease: easeTrack },
        );
        this._panelAnims = [trackAnim];

        const awaitDone = (anim) => (anim?.finished ? anim.finished : Promise.resolve(anim));
        awaitDone(trackAnim)
            .catch(() => {})
            .finally(() => {
                shell.style.removeProperty('--ra-left-col');
                this._panelAnims = [];
            });
    }

    _animatePanel(collapse) {
        if (this._panelAnimating) return;
        const shell = this.querySelector('.ra-shell');
        if (!shell) return;

        // Snapshot the expanded state so the collapse tween starts from the
        // right width (600px if we were expanded, else 379px). We DO NOT
        // flip isAssistExpanded here — doing so mid-animation drops the
        // .ra-shell_assist-expanded class, collapses the CSS variable back
        // to the 379px default, and confuses motion's "from" interpolation,
        // leaving the panel stuck at 379px instead of 56px. We clear
        // isAssistExpanded inside `settle()` after isAssistCollapsed flips.
        const wasExpanded = this.isAssistExpanded;

        const skipAnimation = !this.animationEnabled ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (skipAnimation) {
            this.isAssistCollapsed = collapse;
            this._panelAnimating = false;
            return;
        }

        this._panelAnims?.forEach((a) => { try { a.stop?.(); } catch (_) {} });
        this._panelAnims = [];
        this._panelAnimating = true;

        const easeTrack = [0.22, 0.61, 0.36, 1];
        const easeFade = [0.4, 0, 0.2, 1];

        const panel = this.querySelector('.ka-panel');
        const card = this.querySelector('.ka-card');

        const awaitDone = (anim) =>
            anim?.finished ? anim.finished : Promise.resolve(anim);

        const settle = () => {
            this._panelAnimating = false;
            this._panelAnims = [];
            shell.style.removeProperty('--ra-left-col');
            if (card) {
                card.style.opacity = '';
                card.style.transform = '';
            }
            if (panel) {
                panel.style.borderRadius = '';
                panel.style.padding = '';
                panel.style.gap = '';
            }
        };

        if (collapse) {
            const anims = [];
            if (card) {
                anims.push(motionAnimate(
                    card,
                    { opacity: [1, 0], x: [0, -12] },
                    { duration: 0.2, ease: easeFade },
                ));
            }
            // Tween from whichever width the panel is sitting at right
            // now (600px if expanded, otherwise 379px) so the collapse
            // animation never jumps before sliding in.
            const fromCol = wasExpanded ? '600px' : '379px';
            const trackAnim = motionAnimate(
                shell,
                { '--ra-left-col': [fromCol, '56px'] },
                { duration: 0.36, ease: easeTrack, delay: 0.04 },
            );
            anims.push(trackAnim);
            if (panel) {
                anims.push(motionAnimate(
                    panel,
                    {
                        borderRadius: ['20px', '16px'],
                        padding: ['8px', '8px 8px 16px'],
                        gap: ['8px', '0px'],
                    },
                    { duration: 0.36, ease: easeTrack, delay: 0.04 },
                ));
            }
            this._panelAnims = anims;

            awaitDone(trackAnim)
                .catch(() => {})
                .finally(() => {
                    this.isAssistCollapsed = true;
                    // Drop the expanded flag now that the rail has taken
                    // over — when the user reopens, they should land on the
                    // default 379px width, not the prior 600px expanded one.
                    if (wasExpanded) this.isAssistExpanded = false;
                    settle();
                });
            return;
        }

        // Expand path
        this.isAssistCollapsed = false;
        requestAnimationFrame(() => {
            const c = this.querySelector('.ka-card');
            const p = this.querySelector('.ka-panel');

            if (c) {
                c.style.opacity = '0';
                c.style.transform = 'translateX(-12px)';
            }
            if (p) {
                p.style.borderRadius = '16px';
                p.style.padding = '8px 8px 16px';
                p.style.gap = '0px';
            }

            const anims = [];
            const trackAnim = motionAnimate(
                shell,
                { '--ra-left-col': ['56px', '379px'] },
                { duration: 0.42, ease: easeTrack },
            );
            anims.push(trackAnim);
            if (p) {
                anims.push(motionAnimate(
                    p,
                    {
                        borderRadius: ['16px', '20px'],
                        padding: ['8px 8px 16px', '8px'],
                        gap: ['0px', '8px'],
                    },
                    { duration: 0.42, ease: easeTrack },
                ));
            }
            if (c) {
                anims.push(motionAnimate(
                    c,
                    { opacity: [0, 1], x: [-12, 0] },
                    { duration: 0.32, ease: easeTrack, delay: 0.14 },
                ));
            }
            this._panelAnims = anims;

            Promise.all(anims.map(awaitDone))
                .catch(() => {})
                .finally(() => {
                    settle();
                });
        });
    }

    handleAssistOpen() {
        this.showAssistPanel = true;
        this.isAssistCollapsed = false;
    }

    _animateChatPanel(open) {
        if (this._chatAnimating) return;
        const shell = this.querySelector('.ra-shell');
        if (!shell) return;

        const skipAnimation = !this.animationEnabled ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (skipAnimation) {
            this.showChatPanel = open;
            this._chatAnimating = false;
            return;
        }

        this._chatAnims?.forEach((a) => { try { a.stop?.(); } catch (_) {} });
        this._chatAnims = [];
        this._chatAnimating = true;

        const easeTrack = [0.22, 0.61, 0.36, 1];

        const trackToOpen = () => motionAnimate(
            shell,
            { '--ra-right-col': ['0px', '410px'] },
            { duration: 0.42, ease: easeTrack },
        );
        const trackToClose = () => motionAnimate(
            shell,
            { '--ra-right-col': ['410px', '0px'] },
            { duration: 0.4, ease: easeTrack, delay: 0.05 },
        );
        const fadeAside = (aside, [from, to], duration, delay = 0) =>
            motionAnimate(
                aside,
                { opacity: [from, to] },
                { duration, ease: [0.2, 0.8, 0.2, 1], delay },
            );

        const awaitDone = (anim) =>
            anim?.finished ? anim.finished : Promise.resolve(anim);

        if (open) {
            this.showChatPanel = true;
            requestAnimationFrame(() => {
                const aside = this.querySelector('.ra-shell__aside_right');
                if (aside) aside.style.opacity = '0';

                const trackAnim = trackToOpen();
                const fadeAnim = aside ? fadeAside(aside, [0, 1], 0.32, 0.14) : null;
                this._chatAnims = [trackAnim, fadeAnim].filter(Boolean);

                Promise.all(this._chatAnims.map(awaitDone))
                    .catch(() => {})
                    .finally(() => {
                        this._chatAnimating = false;
                        this._chatAnims = [];
                        shell.style.removeProperty('--ra-right-col');
                        if (aside) aside.style.opacity = '';
                    });
            });
            return;
        }

        // Close path
        const aside = this.querySelector('.ra-shell__aside_right');
        const fadeAnim = aside ? fadeAside(aside, [1, 0], 0.22) : null;
        const trackAnim = trackToClose();
        this._chatAnims = [trackAnim, fadeAnim].filter(Boolean);

        awaitDone(trackAnim)
            .catch(() => {})
            .finally(() => {
                this.showChatPanel = false;
                this._chatAnimating = false;
                this._chatAnims = [];
                shell.style.removeProperty('--ra-right-col');
                if (aside) aside.style.opacity = '';
            });
    }

    handleUpdateAll() {
        this.pushUndo();
        // Snapshot the available ids first — applySuggestionById reorders
        // `this.suggests` as it marks each one updated.
        const ids = this.suggests
            .filter((s) => s.status === 'available')
            .map((s) => s.id);
        ids.forEach((id) => this.applySuggestionById(id, false));
        this.applyHealthBoost(12, 5);
        this.addAgentMessage(
            'Applied all structural suggestions. New sections were added to the draft and the coverage score improved.'
        );
    }

    handleApplySuggestion(event) {
        const { id } = event.detail;
        this.applySuggestionById(id, true, true);
    }

    applySuggestionById(id, announce, animate = false) {
        const idx = this.suggests.findIndex((s) => s.id === id);
        if (idx === -1) return;
        const suggestion = this.suggests[idx];
        if (suggestion.status === 'updated') return;

        this.pushUndo();

        const htmlChunks = this._htmlForSuggestion(suggestion);

        // Mark as updated and float the card to the bottom of the list so
        // the remaining actionable suggestions stay at the top. The card
        // movement is animated (GSAP FLIP) inside <ui-knowledge-assist>.
        const updated = { ...suggestion, status: 'updated' };
        const rest = this.suggests.filter((_, i) => i !== idx);
        this.suggests = [...rest, updated];

        this.applyHealthBoost(suggestion.coverageDelta, suggestion.confidenceDelta);

        if (announce) {
            this.addAgentMessage(
                `Added the "${suggestion.section || suggestion.label}" section to the article. Coverage score improved.`
            );
        }

        // Insert the new section into the editor. A single Update click
        // plays a loader → highlight → scroll-into-view sequence so the
        // writer can see exactly what changed; bulk "Update All" appends
        // instantly to avoid stacked loaders.
        if (htmlChunks) {
            if (animate && this.animationEnabled) {
                this._insertSectionWithLoader(htmlChunks, suggestion);
            } else {
                this._appendHtmlToEditor(htmlChunks);
                this._updateWordCount();
            }
        } else {
            this._updateWordCount();
        }
    }

    // Appends a loader where the new section will land, scrolls to it,
    // then swaps in the real content with a flash highlight and re-scrolls
    // so the change is unmistakable.
    _insertSectionWithLoader(html, suggestion) {
        const editorEl = this._getEditorEl();
        if (!editorEl) return;
        const genId = `gen-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const sectionName = suggestion.section || suggestion.label;
        const loaderHtml =
            `<div class="ra-added ra-added_loading" data-gen="${genId}" contenteditable="false">` +
            `<span class="ra-added__spinner" aria-hidden="true"></span>` +
            `<span class="ra-added__loading-text">Agentforce is adding the \u201c${sectionName}\u201d section\u2026</span>` +
            `</div>`;
        editorEl.insertAdjacentHTML('beforeend', loaderHtml);
        const loaderEl = editorEl.querySelector(`[data-gen="${genId}"]`);
        if (loaderEl) this._scrollEditorToEl(loaderEl);

        window.setTimeout(() => {
            const el = editorEl.querySelector(`[data-gen="${genId}"]`);
            if (!el) return;
            const wrapper = document.createElement('div');
            wrapper.className = 'ra-added ra-added_flash';
            wrapper.innerHTML = html;
            el.replaceWith(wrapper);
            this._scrollEditorToEl(wrapper);
            this._updateWordCount();
            // Drop the highlight once the flash finishes so the inserted
            // content settles into normal article styling.
            window.setTimeout(() => {
                wrapper.classList.remove('ra-added_flash');
            }, 1900);
        }, 1100);
    }

    _scrollEditorToEl(el) {
        if (!el || typeof el.scrollIntoView !== 'function') return;
        try {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (_) {
            el.scrollIntoView();
        }
    }

    _htmlForSuggestion(s) {
        switch (s.actionKind) {
            case 'update-section':
                return this._sectionHtml(s);
            case 'update-video':
                return `<div class="ra-editor-video"><div class="ra-editor-video__icon">&#9654;</div><div class="ra-editor-video__info"><strong>Video Explainer: Baggage size and weight</strong><p>A short walkthrough showing how to measure bags and avoid fees.</p></div></div>`;
            case 'add-knowledge-block':
                return `<h3>Login &amp; account basics</h3><p>If you are a returning passenger, sign in to view your saved trip details before checking your baggage allowance. Your frequent-flyer tier may grant additional weight or bag count.</p>`;
            case 'add-wizard':
                return `<h3>Interactive packing wizard</h3><p>Follow the voice-guided steps to size, weigh, and log each bag. The wizard checks your fare rules and flags anything that exceeds your allowance before you leave for the airport.</p>`;
            case 'add-faq':
                return `<h3>Frequently asked questions</h3><ul><li>What counts as a personal item vs a carry-on?</li><li>How are oversized fees calculated?</li><li>Can I pre-pay for extra weight online?</li></ul>`;
            default:
                return null;
        }
    }

    // Answer-first section content for the structural suggestions. Each
    // adds a heading + a short, direct paragraph so the article reads as
    // more comprehensive once the writer accepts the suggestion.
    _sectionHtml(s) {
        const byId = {
            'suggest-structure-open-flow-builder':
                '<p>To open Flow Builder, go to Setup, type Flows in the Quick Find box, select Flows, then click New Flow. Choose the flow type that matches your use case and click Create to open the canvas.</p>',
            'suggest-structure-add-flow-elements':
                '<p>To add elements to a flow, drag them from the Elements tab on the left of the canvas onto the flow path. Connect each element in the order it should run, then configure its settings in the panel that opens.</p>',
            'suggest-structure-activate-the-flow':
                '<p>To activate a flow, open it in Flow Builder and click Activate in the top-right toolbar. Once active, the flow runs automatically for users based on its trigger; click Deactivate at any time to pause it.</p>',
        };
        const heading = s.section || s.label;
        const body = byId[s.id] || `<p>${s.description}</p>`;
        return `<h2>${heading}</h2>${body}`;
    }

    // Always append at the very end of the editor, regardless of where
    // the caret currently sits.
    _appendHtmlToEditor(html) {
        const editorEl = this._getEditorEl();
        if (!editorEl) return;
        editorEl.insertAdjacentHTML('beforeend', html);
    }

    applyHealthBoost(coverageDelta = 0, confidenceDelta = 0) {
        const nextScore = Math.min(100, (this.health.score || 0) + coverageDelta);
        const nextDelta = (this.health.delta || 0) + coverageDelta;
        const nextCases = (this.health.casesAverted || 0) + Math.max(1, Math.floor(coverageDelta / 2));
        this.health = {
            ...this.health,
            score: nextScore,
            delta: nextDelta,
            casesAverted: nextCases,
        };
    }

    // ─── Chat (Authoring Agent) ────────────────────────────────────
    handleChatSend(event) {
        const text = event.detail?.text?.trim();
        if (!text) return;

        this.chatMessages = [
            ...this.chatMessages,
            { id: freshId('msg'), role: 'user', content: text, timestamp: Date.now() },
        ];

        window.setTimeout(() => {
            const suggestion = this.buildSuggestionFromPrompt(text);
            const reply = this.buildAgentReply(text, suggestion);
            this.chatMessages = [
                ...this.chatMessages,
                {
                    id: freshId('msg'),
                    role: 'assistant',
                    content: reply,
                    suggestions: suggestion ? [suggestion] : [],
                    timestamp: Date.now(),
                },
            ];
        }, 400);
    }

    buildAgentReply(prompt, suggestion) {
        const lower = prompt.toLowerCase();
        if (lower.includes('shorter') || lower.includes('shorten') || lower.includes('condense')) {
            return "I can tighten the introduction. Apply the suggestion and I'll condense the opening paragraph to half its length without losing the key numbers.";
        }
        if (lower.includes('simplify') || lower.includes('simpler') || lower.includes('plain')) {
            return "I'll replace complex phrasing with plainer language. Apply the suggestion to update the block.";
        }
        if (lower.includes('expand') || lower.includes('more detail') || lower.includes('elaborate')) {
            return "I'll add a follow-up paragraph with more context. Apply the suggestion to expand the section.";
        }
        if (lower.includes('rewrite') || lower.includes('improve') || lower.includes('update')) {
            return "I'll rewrite the block to strengthen the content. Apply the suggestion to update it in place.";
        }
        if (lower.includes('image') || lower.includes('diagram')) {
            return "Good call. Let's add a measurement diagram showing maximum carry-on dimensions so users can verify at a glance.";
        }
        if (lower.includes('quote')) {
            return "I'll add a short expert quote to strengthen credibility. Review it before publishing.";
        }
        if (lower.includes('list') || lower.includes('bullet')) {
            return "Sure — here's a bulleted list of the top measurement pitfalls we see in customer cases.";
        }
        return `Proposed an update based on your request: "${suggestion?.label || 'New section'}". Click Apply to insert it into the article.`;
    }

    buildSuggestionFromPrompt(text) {
        const lower = text.toLowerCase();
        if (lower.includes('image') || lower.includes('diagram') || lower.includes('photo')) {
            return {
                id: freshId('s'),
                actionKind: 'add-image',
                label: 'Add measurement diagram',
                description: 'Insert a diagram showing carry-on and checked bag dimensions.',
            };
        }
        if (lower.includes('quote')) {
            return {
                id: freshId('s'),
                actionKind: 'add-quote',
                label: 'Add expert quote',
                description: 'Add a short, attributed quote from a travel policy expert.',
            };
        }
        if (lower.includes('list') || lower.includes('bullet') || lower.includes('tips')) {
            return {
                id: freshId('s'),
                actionKind: 'add-list',
                label: 'Add measurement tips list',
                description: 'Insert a bullet list of the most common measuring mistakes.',
            };
        }
        if (lower.includes('shorten') || lower.includes('shorter') || lower.includes('condense')) {
            return {
                id: freshId('s'),
                actionKind: 'rewrite-shorten',
                label: 'Shorten introduction',
                description: 'Rewrite the opening paragraph to be ~50% shorter.',
            };
        }
        if (lower.includes('simplify') || lower.includes('simpler') || lower.includes('plain')) {
            return {
                id: freshId('s'),
                actionKind: 'rewrite-simplify',
                label: 'Simplify language',
                description: 'Rewrite using plainer language and shorter sentences.',
            };
        }
        if (lower.includes('expand') || lower.includes('more detail') || lower.includes('elaborate')) {
            return {
                id: freshId('s'),
                actionKind: 'add-expand',
                label: 'Expand with more detail',
                description: 'Baggage policies can vary further by route, alliance partnerships, and seasonal promotions — always confirm with the airline before departure.',
            };
        }
        if (lower.includes('rewrite') || lower.includes('improve') || lower.includes('update')) {
            return {
                id: freshId('s'),
                actionKind: 'rewrite-general',
                label: 'Rewrite block',
                description: `Improve the content based on: "${text.slice(0, 60)}"`,
            };
        }
        return {
            id: freshId('s'),
            actionKind: 'add-section',
            label: 'Add follow-up section',
            description: `Draft a new section covering: "${text.slice(0, 80)}"`,
        };
    }

    handleApplyChatAction(event) {
        const { messageId, suggestionId } = event.detail;
        const msgIdx = this.chatMessages.findIndex((m) => m.id === messageId);
        if (msgIdx === -1) return;
        const msg = this.chatMessages[msgIdx];
        const suggestion = (msg.suggestions || []).find((s) => s.id === suggestionId);
        if (!suggestion) return;

        this.pushUndo();

        const html = this._htmlForChatSuggestion(suggestion);
        if (html) {
            this._insertHtmlAtCursor(html);
        }

        this.addAgentMessage(`Applied "${suggestion.label}" — content inserted into the article.`);

        // Remove the suggestion from the message
        this.chatMessages = this.chatMessages.map((m, i) =>
            i === msgIdx
                ? {
                      ...m,
                      suggestions: (m.suggestions || []).filter((s) => s.id !== suggestionId),
                  }
                : m
        );

        this.applyHealthBoost(3, 1);
        this._updateWordCount();
    }

    _htmlForChatSuggestion(s) {
        switch (s.actionKind) {
            case 'add-image':
                return `<figure class="ra-editor-figure"><img src="${import.meta.env.BASE_URL}images/baggage-measure.jpg" alt="Measurement diagram" /><figcaption>Measurement diagram — check both linear inches and weight.</figcaption></figure>`;
            case 'add-quote':
                return `<blockquote>"Most overweight fees we see are from bags that missed the limit by under a pound. A cheap luggage scale pays for itself on the first trip." — Travel policy desk</blockquote>`;
            case 'add-list':
                return `<h3>Measurement tips</h3><ul><li>Weigh every bag the night before — at peak travel weight.</li><li>Measure external pockets, wheels, and handles.</li><li>Keep the airline fare rules screenshot handy at check-in.</li></ul>`;
            case 'rewrite-shorten':
                return `<p>Airlines set strict weight and size limits on luggage. Exceeding them can cost 10-12 euros per extra kilogram on budget carriers, turning a cheap trip expensive.</p>`;
            case 'rewrite-simplify':
                return `<p>Airlines limit how heavy and large your bags can be. Going over these limits means extra fees that change based on the airline and where you're flying.</p>`;
            case 'add-expand':
                return `<p>Baggage policies can vary further by route, alliance partnerships, and seasonal promotions — always confirm with the airline before departure.</p>`;
            case 'rewrite-general':
                return `<p>${s.description}</p>`;
            case 'add-section':
                return `<h2>${s.label}</h2><p>${s.description}</p>`;
            default:
                return `<h2>${s.label}</h2><p>${s.description}</p>`;
        }
    }

    handleRejectChatAction(event) {
        const { messageId, suggestionId } = event.detail;
        this.chatMessages = this.chatMessages.map((m) =>
            m.id === messageId
                ? { ...m, suggestions: (m.suggestions || []).filter((s) => s.id !== suggestionId) }
                : m
        );
    }

    addAgentMessage(text) {
        this.chatMessages = [
            ...this.chatMessages,
            { id: freshId('msg'), role: 'assistant', content: text, timestamp: Date.now() },
        ];
    }

    inviteCollaborators() {
        if (this.showCollaborators) return;
        this.activeCollaborators = COLLABORATOR_ROSTER;
        this.extraCollaboratorCount = COLLABORATOR_EXTRA_COUNT;
        this.showCollaborators = true;
        this.chatMessages = [
            ...this.chatMessages,
            {
                id: freshId('msg'),
                role: 'event',
                eventKind: 'collab-joined',
                content:
                    'John Chipchase and 3 others have joined this Article Draft as collaborators',
                timestamp: Date.now(),
            },
        ];
        this.showToast('Collaborators invited');
    }

    showToast(message, variant = 'success') {
        Toast.show(
            {
                label: message,
                variant,
                mode: 'dismissible',
            },
            this
        );

        window.setTimeout(() => closeOldestToast(), TOAST_DISMISS_MS);
    }

    // ─── Entrance animation ───────────────────────────────────────────
    _playEntranceAnimation() {
        const reduce =
            !this.animationEnabled ||
            (typeof window !== 'undefined' &&
                window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        if (reduce) {
            this.classList.remove('ra--entering');
            return;
        }

        const shell = this.querySelector('.ra-shell');
        if (!shell) {
            this.classList.remove('ra--entering');
            return;
        }

        const shellAnim = motionAnimate(
            shell,
            { opacity: [0, 1], y: [16, 0] },
            { duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }
        );

        shellAnim.finished?.then?.(() => {
            this.classList.remove('ra--entering');
        }) ?? this.classList.remove('ra--entering');

        const regions = [
            this.querySelector('.ra-shell__aside_left'),
            this.querySelector('.ra-shell__main'),
            this.querySelector('.ra-shell__aside_right'),
        ].filter(Boolean);
        if (regions.length) {
            motionAnimate(
                regions,
                { opacity: [0, 1], y: [12, 0] },
                {
                    duration: 0.5,
                    ease: 'easeOut',
                    delay: motionStagger(0.08, { startDelay: 0.1 }),
                }
            );
        }

        const head = this.querySelector('.ra-article__head');
        if (head) {
            motionAnimate(
                head,
                { opacity: [0, 1], y: [10, 0] },
                { duration: 0.45, ease: 'easeOut', delay: 0.22 }
            );
        }

        const editorEl = this._getEditorEl();
        if (editorEl) {
            motionAnimate(
                editorEl,
                { opacity: [0, 1], y: [10, 0] },
                { duration: 0.42, ease: 'easeOut', delay: 0.3 }
            );
        }
    }
}

const TOAST_DISMISS_MS = 1500;

function closeOldestToast() {
    const container = document.querySelector('lightning-toast-container');
    if (!container) return;
    const root = container.shadowRoot || container;
    const toasts = root.querySelectorAll('lightning-toast');
    if (!toasts.length) return;
    const oldest = toasts[0];
    oldest.dispatchEvent(
        new CustomEvent('close', {
            bubbles: true,
            detail: { isFocused: false },
        })
    );
}

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

const COLLABORATOR_ROSTER = [
    { id: 'shana', name: 'Shana Goldman', color: 'teal', initials: 'SG' },
    { id: 'laura', name: 'Laura Borghesi', color: 'pink', initials: 'LB' },
    { id: 'daniel', name: 'Daniel Sim', color: 'amber', initials: 'DS' },
];

const COLLABORATOR_EXTRA_COUNT = 1;
