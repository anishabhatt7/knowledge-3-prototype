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
} from 'data/knowledge';
import { consumeDraftSession } from 'data/draftSession';

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
    @track suggests = smartSuggests.map((s) => ({ ...s }));
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

    // Editor state
    @track editorBlockStyle = 'p';
    _editorInitialized = false;

    // Entrance-animation flags
    _arrivedFromDraft = false;
    _didEntranceAnimation = false;

    _boundEscapeHandler = null;

    connectedCallback() {
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
    }

    // Top-level nav/chrome
    recordTypeLabel = recordType.label;
    dataCategoryList = dataCategories.map((d, i) => ({ key: `dc-${i}`, label: d.label }));
    audienceList = audiences.map((a, i) => ({ key: `a-${i}`, label: a.label }));

    get statusLabel() {
        return this.article.status?.charAt(0).toUpperCase() + this.article.status?.slice(1);
    }

    get insertedBlockIds() {
        const ids = new Set();
        for (const b of this.article.blockData || []) {
            if (b.syncGroupId) ids.add(b.syncGroupId);
        }
        return [...ids];
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
    _blocksToHtml(blocks) {
        if (!blocks || !blocks.length) return '<p><br></p>';
        return blocks.map((b) => {
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
                    return `<figure class="ra-editor-figure"><img src="images/baggage-measure.jpg" alt="${b.caption || ''}" /><figcaption>${b.caption || ''}</figcaption></figure>`;
                case 'video':
                    return `<div class="ra-editor-video"><div class="ra-editor-video__icon">&#9654;</div><div class="ra-editor-video__info"><strong>${b.title || ''}</strong><p>${content}</p></div></div>`;
                default:
                    return `<p>${content}</p>`;
            }
        }).join('\n');
    }

    // ─── Editor initialization ────────────────────────────────────────
    renderedCallback() {
        // Play the Motion entrance once
        if (this._arrivedFromDraft && !this._didEntranceAnimation) {
            this._didEntranceAnimation = true;
            this._playEntranceAnimation();
        }

        // Initialize the contenteditable with HTML from block data
        if (!this._editorInitialized) {
            const editorEl = this._getEditorEl();
            if (editorEl) {
                this._editorInitialized = true;
                const html = this._blocksToHtml(this.article.blockData);
                editorEl.innerHTML = html;
                this._updateWordCount();
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
    pushUndo() {
        this.undoStack = [...this.undoStack, deepClone(this.article)].slice(-20);
        this.redoStack = [];
    }

    handleUndo() {
        // Use execCommand undo for the contenteditable
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
        this.addAgentMessage('Article draft saved successfully.');
        this.showToast('Article draft saved');
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

        // Convert the knowledge block's blocks to HTML and insert at cursor
        const html = entry.blocks.map((b) => {
            const content = b.content || '';
            switch (b.type) {
                case 'h1': return `<h1>${content}</h1>`;
                case 'h2': return `<h2>${content}</h2>`;
                case 'h3': return `<h3>${content}</h3>`;
                case 'li': return `<ul><li>${content}</li></ul>`;
                case 'blockquote': return `<blockquote>${content}</blockquote>`;
                default: return `<p>${content}</p>`;
            }
        }).join('');

        this._insertHtmlAtCursor(html);

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
        this.suggests.forEach((s) => {
            if (s.status === 'available') this.applySuggestionById(s.id, false);
        });
        this.applyHealthBoost(12, 5);
        this.addAgentMessage(
            'Applied all Smart Suggests. Article coverage score improved and new blocks were added to the draft.'
        );
    }

    handleApplySuggestion(event) {
        const { id } = event.detail;
        this.applySuggestionById(id, true);
    }

    applySuggestionById(id, announce) {
        const idx = this.suggests.findIndex((s) => s.id === id);
        if (idx === -1) return;
        const suggestion = this.suggests[idx];
        if (suggestion.status === 'applied') return;

        this.pushUndo();

        const htmlChunks = this._htmlForSuggestion(suggestion);
        if (htmlChunks) {
            this._insertHtmlAtCursor(htmlChunks);
        }

        this.suggests = this.suggests.map((s, i) => (i === idx ? { ...s, status: 'applied' } : s));

        this.applyHealthBoost(suggestion.coverageDelta, suggestion.confidenceDelta);

        if (announce) {
            this.addAgentMessage(
                `Applied "${suggestion.label}". Content added to the article draft.`
            );
        }
        this._updateWordCount();
    }

    _htmlForSuggestion(s) {
        switch (s.actionKind) {
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
                return `<figure class="ra-editor-figure"><img src="images/baggage-measure.jpg" alt="Measurement diagram" /><figcaption>Measurement diagram — check both linear inches and weight.</figcaption></figure>`;
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
