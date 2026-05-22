import { LightningElement, api, track } from 'lwc';
import gsap from 'gsap';
import { inlineAISuggestions } from 'data/knowledge';

const GEMINI_API_KEY = 'AIzaSyC0Xsj-M3OdE43kMK2SkKS-yATTkN0klHU';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const POPOVER_HIDE_DELAY = 220;

const SLASH_ITEMS = [
    { id: 'write-ai', label: 'Write with AI', description: 'Generate or Update content using Agentforce', iconName: 'utility:einstein', iconClass: 'sm__icon sm__icon_ai' },
    { id: 'generate-image', label: 'Generate Image', description: 'Generate or Update image using Agentforce', iconName: 'utility:image', iconClass: 'sm__icon sm__icon_image' },
    { id: 'generate-video', label: 'Generate Video', description: 'Generate or Update video using Agentforce', iconName: 'utility:video', iconClass: 'sm__icon sm__icon_video' },
    { id: 'generate-flow', label: 'Generate Visual Flow', description: 'Generate or Update visual flow using Agentforce', iconName: 'utility:flow', iconClass: 'sm__icon sm__icon_flow' },
    { id: 'insert-knowledge-block', label: 'Insert Knowledge Block', description: 'Insert Knowledge Block', iconName: 'utility:package', iconClass: 'sm__icon sm__icon_block' },
];

export default class ArticleBlock extends LightningElement {
    @api block;
    @api index;
    @api selected = false;

    @track _promptOpen = false;
    @track _promptText = '';
    @track _generating = false;
    @track _slashOpen = false;
    @track _slashItems = SLASH_ITEMS;
    @track _slashActiveIndex = 0;
    @track _slashAbove = false;
    @track _activeSuggestion = null;
    _abortController = null;
    _gsapAnimating = false;
    _gsapEnabled = true;
    _boundGsapToggle = null;
    _dismissedSuggestionIds = new Set();
    _suggestionsAppliedFor = '';
    _popoverHideTimer = null;

    connectedCallback() {
        this._boundGsapToggle = (e) => {
            this._gsapEnabled = e.detail?.enabled !== false;
        };
        window.addEventListener('gsap:toggle', this._boundGsapToggle);
    }

    disconnectedCallback() {
        if (this._boundGsapToggle) {
            window.removeEventListener('gsap:toggle', this._boundGsapToggle);
            this._boundGsapToggle = null;
        }
        if (this._abortController) {
            this._abortController.abort();
        }
    }

    renderedCallback() {
        const el = this.template.querySelector('.ab__editable');
        if (el) {
            const incoming = this.block?.content ?? '';
            if (el.innerText !== incoming) {
                el.innerText = incoming;
                this._suggestionsAppliedFor = '';
            }
            if (incoming && this._suggestionsAppliedFor !== incoming) {
                this._applyInlineSuggestions(el);
                this._suggestionsAppliedFor = incoming;
            }
        }

        if (this._promptOpen && !this._gsapAnimating) {
            const prompt = this.template.querySelector('.ab__prompt');
            if (prompt && prompt.dataset.animated !== 'true') {
                this._animatePromptIn(prompt);
            }
        }
    }

    @api focus() {
        Promise.resolve().then(() => {
            const el = this.template.querySelector('.ab__editable');
            if (!el) return;
            el.focus();
            try {
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(el);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            } catch (_) { /* noop */ }
        });
    }

    get isH1() { return this.block?.type === 'h1'; }
    get isH2() { return this.block?.type === 'h2'; }
    get isH3() { return this.block?.type === 'h3'; }
    get isP() { return this.block?.type === 'p'; }
    get isLi() { return this.block?.type === 'li'; }
    get isBlockquote() { return this.block?.type === 'blockquote'; }
    get isImage() { return this.block?.type === 'image'; }
    get isVideo() { return this.block?.type === 'video'; }
    get isSynced() { return Boolean(this.block?.syncGroupId); }
    get showSyncBadge() {
        const pos = this.syncPosition;
        return pos === 'first' || pos === 'only';
    }

    get syncPosition() {
        return this.block?.syncPosition || null;
    }

    get containerClass() {
        const type = this.block?.type || 'p';
        let cls = `ab ab_${type}`;
        if (this.block?.isNew) cls += ' ab_new';
        if (this.selected) cls += ' ab_selected';
        if (this._generating) cls += ' ab_generating';
        if (this.syncPosition) cls += ` ab_sync ab_sync-${this.syncPosition}`;
        return cls;
    }

    get showPromptBar() {
        return this._promptOpen || this._generating;
    }

    get videoCaption() {
        return this.block?.title || 'Video';
    }

    get imageCaption() {
        return this.block?.caption || '';
    }

    get imageSrc() {
        return this.block?.src || './images/baggage-measure.jpg';
    }

    get imageAlt() {
        return this.block?.caption || this.block?.content || 'Article image';
    }

    get videoThumbnail() {
        return this.block?.thumbnail || 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=560&h=300&fit=crop&q=80';
    }

    get showConvertButton() {
        return !this.isSynced && !this.isImage && !this.isVideo;
    }

    get slashMenuItems() {
        return this._slashItems.map((item, i) => ({
            ...item,
            itemClass: `sm__row${i === this._slashActiveIndex ? ' sm__row_active' : ''}`,
        }));
    }

    get slashMenuClass() {
        return this._slashAbove ? 'sm sm_above' : 'sm';
    }

    // ─── Slash menu ───────────────────────────────────────────────
    _openSlashMenu() {
        this._slashActiveIndex = 0;
        this._slashItems = SLASH_ITEMS;
        this._slashAbove = false;
        this._slashOpen = true;
        requestAnimationFrame(() => {
            const menu = this.template.querySelector('.sm');
            if (!menu) return;
            this._positionSlashMenu(menu);
            this._animateSlashIn(menu);
        });
    }

    _positionSlashMenu(menu) {
        const MARGIN = 12;
        const block = this.template.querySelector('.ab') || this.template.host;
        if (!block) return;

        const menuHeight = menu.getBoundingClientRect().height || 260;
        const blockRect = block.getBoundingClientRect();
        const scrollParent = block.closest('.ra-article__body');
        let viewportBottom = window.innerHeight;
        let viewportTop = 0;

        if (scrollParent) {
            const sp = scrollParent.getBoundingClientRect();
            viewportBottom = sp.bottom;
            viewportTop = sp.top;
        }

        const spaceBelow = viewportBottom - blockRect.bottom;
        const spaceAbove = blockRect.top - viewportTop;

        if (spaceBelow < menuHeight + MARGIN && spaceAbove > spaceBelow) {
            this._slashAbove = true;
        } else {
            this._slashAbove = false;
        }

        if (scrollParent) {
            requestAnimationFrame(() => {
                const updatedMenu = this.template.querySelector('.sm');
                if (!updatedMenu) return;
                const menuRect = updatedMenu.getBoundingClientRect();
                const spRect = scrollParent.getBoundingClientRect();

                if (menuRect.bottom > spRect.bottom) {
                    scrollParent.scrollBy({ top: menuRect.bottom - spRect.bottom + MARGIN, behavior: 'smooth' });
                } else if (menuRect.top < spRect.top) {
                    scrollParent.scrollBy({ top: menuRect.top - spRect.top - MARGIN, behavior: 'smooth' });
                }
            });
        }
    }

    _closeSlashMenu() {
        if (!this._slashOpen) return;
        const menu = this.template.querySelector('.sm');
        if (menu) {
            this._animateSlashOut(menu).then(() => {
                this._slashOpen = false;
            });
        } else {
            this._slashOpen = false;
        }
    }

    _animateSlashIn(el) {
        if (!this._gsapEnabled) {
            el.style.opacity = '1';
            el.style.transform = '';
            return;
        }
        const above = this._slashAbove;
        const origin = above ? 'bottom left' : 'top left';
        const startY = above ? 6 : -6;
        gsap.killTweensOf(el);
        gsap.set(el, { opacity: 0, y: startY, scale: 0.96, transformOrigin: origin });
        gsap.to(el, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.22,
            ease: 'back.out(1.7)',
        });
    }

    _animateSlashOut(el) {
        if (!this._gsapEnabled) {
            el.style.opacity = '0';
            return Promise.resolve();
        }
        const exitY = this._slashAbove ? 4 : -4;
        gsap.killTweensOf(el);
        return new Promise((resolve) => {
            gsap.to(el, {
                opacity: 0,
                y: exitY,
                scale: 0.97,
                duration: 0.15,
                ease: 'power2.in',
                onComplete: resolve,
            });
        });
    }

    handleSlashItemClick(event) {
        const itemId = event.currentTarget.dataset.id;
        this._selectSlashItem(itemId);
    }

    handleSlashItemMouseEnter(event) {
        const itemId = event.currentTarget.dataset.id;
        const idx = this._slashItems.findIndex((i) => i.id === itemId);
        if (idx !== -1) this._slashActiveIndex = idx;
    }

    _selectSlashItem(itemId) {
        this._closeSlashMenu();
        this._clearSlashFromContent();

        if (itemId === 'insert-knowledge-block') {
            this.dispatchEvent(new CustomEvent('slashinsertblock', {
                bubbles: true,
                composed: true,
                detail: { id: this.block.id },
            }));
        } else if (itemId === 'write-ai') {
            this.dispatchEvent(new CustomEvent('blockpromptopen', {
                bubbles: true,
                composed: true,
                detail: { id: this.block.id },
            }));
        } else {
            this.dispatchEvent(new CustomEvent('slashcommand', {
                bubbles: true,
                composed: true,
                detail: { id: this.block.id, command: itemId },
            }));
        }
    }

    _clearSlashFromContent() {
        const el = this.template.querySelector('.ab__editable');
        if (!el) return;
        const text = el.innerText || '';
        if (text.startsWith('/')) {
            const cleaned = text.replace(/^\/\S*/, '').trimStart();
            el.innerText = cleaned;
            this.dispatchEvent(new CustomEvent('blockchange', {
                bubbles: true,
                composed: true,
                detail: { id: this.block.id, content: cleaned },
            }));
        }
    }

    // ─── Block select / deselect ──────────────────────────────────
    handleBlockSelect(event) {
        if (event.target.closest('.ab__prompt') ||
            event.target.closest('.ab__ai') ||
            event.target.closest('.ab__convert') ||
            event.target.closest('.sm') ||
            event.target.closest('.ai-popover') ||
            event.target.closest('.ai-suggest')) {
            return;
        }
        this.dispatchEvent(new CustomEvent('blockselect', {
            bubbles: true,
            composed: true,
            detail: { id: this.block.id },
        }));
    }

    handleConvertClick(event) {
        event.stopPropagation();
        this.dispatchEvent(new CustomEvent('blockconvertrequest', {
            bubbles: true,
            composed: true,
            detail: { id: this.block.id },
        }));
    }

    // ─── AI prompt flow ───────────────────────────────────────────
    handleAiClick(event) {
        event.stopPropagation();
        this.dispatchEvent(new CustomEvent('blockpromptopen', {
            bubbles: true,
            composed: true,
            detail: { id: this.block.id },
        }));
    }

    @api openPrompt() {
        if (this._promptOpen) return;
        this._promptOpen = true;
        this._promptText = '';
    }

    @api closePrompt() {
        if (!this._promptOpen || this._generating) {
            return Promise.resolve();
        }
        const prompt = this.template.querySelector('.ab__prompt');
        if (!prompt) {
            this._promptOpen = false;
            this._promptText = '';
            return Promise.resolve();
        }
        return this._animatePromptOut(prompt).then(() => {
            this._promptOpen = false;
            this._promptText = '';
        });
    }

    handlePromptInput(event) {
        this._promptText = event.target.value;
    }

    handlePromptKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this._submitPrompt();
        } else if (event.key === 'Escape') {
            this._closePrompt();
        }
    }

    handlePromptSubmit() {
        this._submitPrompt();
    }

    handleStop() {
        if (this._abortController) {
            this._abortController.abort();
            this._abortController = null;
        }
        this._stopGenerating();
    }

    _closePrompt() {
        const prompt = this.template.querySelector('.ab__prompt');
        if (prompt) {
            this._animatePromptOut(prompt).then(() => {
                this._promptOpen = false;
                this._promptText = '';
                this._notifyPromptClosed();
            });
        } else {
            this._promptOpen = false;
            this._promptText = '';
            this._notifyPromptClosed();
        }
    }

    _notifyPromptClosed() {
        this.dispatchEvent(new CustomEvent('blockpromptclose', {
            bubbles: true,
            composed: true,
            detail: { id: this.block.id },
        }));
    }

    _animatePromptIn(el) {
        el.dataset.animated = 'true';
        if (!this._gsapEnabled) {
            el.style.opacity = '1';
            el.style.transform = '';
            const input = this.template.querySelector('.ab__prompt-input');
            if (input) input.focus();
            return;
        }
        this._gsapAnimating = true;
        gsap.killTweensOf(el);
        gsap.set(el, { opacity: 0, y: 8, scale: 0.96, transformOrigin: 'center bottom' });
        gsap.to(el, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.35,
            ease: 'back.out(1.4)',
            onComplete: () => {
                this._gsapAnimating = false;
                const input = this.template.querySelector('.ab__prompt-input');
                if (input) input.focus();
            },
        });
    }

    _animatePromptOut(el) {
        if (!this._gsapEnabled) {
            el.style.opacity = '0';
            el.dataset.animated = '';
            return Promise.resolve();
        }
        this._gsapAnimating = true;
        gsap.killTweensOf(el);
        return new Promise((resolve) => {
            gsap.to(el, {
                opacity: 0,
                y: 6,
                scale: 0.97,
                duration: 0.22,
                ease: 'power2.in',
                onComplete: () => {
                    el.dataset.animated = '';
                    this._gsapAnimating = false;
                    resolve();
                },
            });
        });
    }

    async _submitPrompt() {
        const prompt = this._promptText.trim();
        if (!prompt) return;

        this._generating = true;
        this._abortController = new AbortController();

        const originalContent = this.block?.content ?? '';
        const blockType = this.block?.type ?? 'p';

        const systemPrompt = `You are editing a knowledge base article block. The block type is "${blockType}". The current content is:\n\n"${originalContent}"\n\nThe user wants: ${prompt}\n\nReturn ONLY the updated text content for this block. No explanations, no markdown formatting, no quotes — just the raw text.`;

        const minDelay = new Promise((r) => setTimeout(r, 2500));

        try {
            const [response] = await Promise.all([
                fetch(GEMINI_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: this._abortController.signal,
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: systemPrompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 512,
                        },
                    }),
                }),
                minDelay,
            ]);

            if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

            const data = await response.json();
            const newContent = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || originalContent;

            this._stopGenerating();

            this.dispatchEvent(new CustomEvent('blockchange', {
                bubbles: true,
                composed: true,
                detail: { id: this.block.id, content: newContent },
            }));

        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error('Gemini API call failed:', err);
            this._stopGenerating();
        }
    }

    _stopGenerating() {
        this._generating = false;
        const prompt = this.template.querySelector('.ab__prompt');
        if (prompt) {
            this._animatePromptOut(prompt).then(() => {
                this._promptOpen = false;
                this._promptText = '';
                this._notifyPromptClosed();
            });
        } else {
            this._promptOpen = false;
            this._promptText = '';
            this._notifyPromptClosed();
        }
    }

    disconnectedCallback() {
        if (this._abortController) {
            this._abortController.abort();
            this._abortController = null;
        }
        this._slashOpen = false;
        if (this._popoverHideTimer) {
            clearTimeout(this._popoverHideTimer);
            this._popoverHideTimer = null;
        }
        this._activeSuggestion = null;
    }

    // ─── Inline AI suggestions (Grammarly-style) ──────────────────
    _applyInlineSuggestions(el) {
        const blockId = this.block?.id;
        if (!blockId) return;
        const suggestions = inlineAISuggestions.filter(
            (s) => s.blockId === blockId && !this._dismissedSuggestionIds.has(s.id)
        );
        if (!suggestions.length) return;
        suggestions.forEach((s) => this._wrapFirstOccurrence(el, s));
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
            // Stop the click from bubbling to the block-select handler so
            // tapping the underline only opens the popover.
            e.stopPropagation();
            this._openPopoverFor(span, suggestion);
        });
    }

    _openPopoverFor(span, suggestion) {
        if (this._popoverHideTimer) {
            clearTimeout(this._popoverHideTimer);
            this._popoverHideTimer = null;
        }
        const blockEl = this.template.querySelector('.ab');
        if (!blockEl) return;
        const blockRect = blockEl.getBoundingClientRect();
        const spanRect = span.getBoundingClientRect();
        const top = spanRect.bottom - blockRect.top + 8;
        const left = Math.max(0, spanRect.left - blockRect.left);
        this._activeSuggestion = {
            id: suggestion.id,
            type: suggestion.type,
            label: suggestion.label,
            explanation: suggestion.explanation,
            original: suggestion.original,
            replacement: suggestion.replacement,
            popoverClass: `ai-popover ai-popover_${suggestion.type}`,
            style: `top: ${top}px; left: ${left}px;`,
        };
    }

    _schedulePopoverClose() {
        if (this._popoverHideTimer) clearTimeout(this._popoverHideTimer);
        this._popoverHideTimer = setTimeout(() => {
            this._activeSuggestion = null;
            this._popoverHideTimer = null;
        }, POPOVER_HIDE_DELAY);
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
     * Close the popover without dismissing the suggestion. The underline
     * stays in the document and the popover will reopen the next time the
     * user hovers the same span.
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
        const current = this.block?.content ?? '';
        const next = current.replace(s.original, s.replacement);
        this._activeSuggestion = null;
        if (this._popoverHideTimer) {
            clearTimeout(this._popoverHideTimer);
            this._popoverHideTimer = null;
        }
        if (next === current) return;
        this.dispatchEvent(new CustomEvent('blockchange', {
            bubbles: true,
            composed: true,
            detail: { id: this.block.id, content: next },
        }));
    }

    handleSuggestionDismiss(event) {
        event?.stopPropagation();
        const s = this._activeSuggestion;
        if (!s) return;
        this._dismissedSuggestionIds.add(s.id);
        const editable = this.template.querySelector('.ab__editable');
        if (editable) {
            const span = editable.querySelector(
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

    // ─── Editable block events ────────────────────────────────────
    handleInput(event) {
        const content = (event.currentTarget.innerText || '').replace(/ /g, ' ');

        if (content === '/') {
            if (!this._slashOpen) this._openSlashMenu();
        } else if (this._slashOpen) {
            if (content.startsWith('/')) {
                const query = content.slice(1).toLowerCase();
                this._slashItems = SLASH_ITEMS.filter((i) =>
                    i.label.toLowerCase().includes(query)
                );
                this._slashActiveIndex = 0;
                if (this._slashItems.length === 0) this._closeSlashMenu();
            } else {
                this._closeSlashMenu();
            }
        }

        this.dispatchEvent(new CustomEvent('blockchange', {
            bubbles: true,
            composed: true,
            detail: { id: this.block.id, content },
        }));
    }

    handleKeyDown(event) {
        const key = event.key;

        if (this._slashOpen) {
            if (key === 'ArrowDown') {
                event.preventDefault();
                this._slashActiveIndex = (this._slashActiveIndex + 1) % this._slashItems.length;
                return;
            }
            if (key === 'ArrowUp') {
                event.preventDefault();
                this._slashActiveIndex = (this._slashActiveIndex - 1 + this._slashItems.length) % this._slashItems.length;
                return;
            }
            if (key === 'Enter') {
                event.preventDefault();
                const item = this._slashItems[this._slashActiveIndex];
                if (item) this._selectSlashItem(item.id);
                return;
            }
            if (key === 'Escape') {
                event.preventDefault();
                this._closeSlashMenu();
                return;
            }
        }

        const trackedKeys = ['Enter', 'Backspace', ' ', 'ArrowUp', 'ArrowDown'];
        if (!trackedKeys.includes(key)) return;

        const content = event.currentTarget.innerText || '';
        const markdownTriggers = ['#', '##', '###', '-', '>'];

        const willHandle =
            (key === 'Enter' && !event.shiftKey) ||
            (key === 'Backspace' && content === '' && this.index > 0) ||
            (key === ' ' && markdownTriggers.includes(content)) ||
            (key === 'ArrowUp') ||
            (key === 'ArrowDown');

        if (!willHandle) return;

        if (key === 'ArrowUp' || key === 'ArrowDown') {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) {
                event.preventDefault();
            } else {
                const range = sel.getRangeAt(0);
                const atStart = key === 'ArrowUp' && range.startOffset === 0;
                const atEnd = key === 'ArrowDown' && range.endOffset === content.length;
                if (!atStart && !atEnd) return;
                event.preventDefault();
            }
        } else {
            event.preventDefault();
        }

        this.dispatchEvent(new CustomEvent('blockkeydown', {
            bubbles: true,
            composed: true,
            detail: {
                id: this.block.id,
                index: this.index,
                key,
                shiftKey: event.shiftKey,
                content,
            },
        }));
    }

    // ─── Drag-and-drop reordering ───────────────────────────────
    handleDragStart(event) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', this.block.id);
        this.dispatchEvent(new CustomEvent('blockdragstart', {
            bubbles: true,
            composed: true,
            detail: { id: this.block.id, index: this.index },
        }));
    }

    handleDragEnd() {
        this.dispatchEvent(new CustomEvent('blockdragend', {
            bubbles: true,
            composed: true,
        }));
    }

    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        this.dispatchEvent(new CustomEvent('blockdragover', {
            bubbles: true,
            composed: true,
            detail: { id: this.block.id, index: this.index },
        }));
    }

    handleDrop(event) {
        event.preventDefault();
        const sourceId = event.dataTransfer.getData('text/plain');
        if (sourceId && sourceId !== this.block.id) {
            this.dispatchEvent(new CustomEvent('blockdrop', {
                bubbles: true,
                composed: true,
                detail: { sourceId, targetId: this.block.id, targetIndex: this.index },
            }));
        }
    }

    handlePaste(event) {
        const text = (event.clipboardData || window.clipboardData)?.getData('text') || '';
        if (!text.includes('\n')) return;
        event.preventDefault();
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length === 0) return;
        this.dispatchEvent(new CustomEvent('blockpaste', {
            bubbles: true,
            composed: true,
            detail: { id: this.block.id, lines },
        }));
    }
}
