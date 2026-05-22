import { LightningElement, track } from 'lwc';
import { gsap } from 'gsap';
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
import 'ui/articleBlock';
import 'ui/collaboratorCursors';
import 'ui/collaboratorAvatars';
import ConvertBlockModal from 'ui/convertBlockModal';
import Toast from 'lightning/toast';

/**
 * Review Article page — Figma DVS frame.
 *
 * Preserves the core Authoring Agent functionality from the React
 * Knowledge Builder app:
 *   - Block-based article editor (h1..h3 / p / li / blockquote / image / video)
 *   - Inline Authoring Agent chat that proposes Apply-able actions
 *   - Smart suggestions in the left panel that insert / replace blocks
 *   - Article health metrics that react to edits
 *
 * No backend — this is an offline-editable demo. All chat/suggestion
 * "AI" behavior is implemented as deterministic local logic so the
 * UX matches the original app without an API key.
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
    @track showChatPanel = false;
    _chatAnimating = false;
    @track selectedBlockId = null;
    @track showCollaborators = false;
    @track activeCollaborators = [];
    @track extraCollaboratorCount = 0;
    @track animationEnabled = true;

    // Drag-and-drop state
    _dragSourceId = null;

    // Prompt exclusivity — only one prompt bar open at a time
    _promptBlockId = null;
    _boundEscapeHandler = null;

    // Entrance-animation flags. `_arrivedFromDraft` flips on if the
    // user just came through the Draft-with-Agentforce modal flow,
    // so renderedCallback can play the Motion entry exactly once.
    _arrivedFromDraft = false;
    _didEntranceAnimation = false;

    connectedCallback() {
        // Pick up { title, recordType, language } from the Draft-with-
        // Agentforce flow on the home page (Flow 3 entry point). Read
        // exactly once — subsequent visits to /new-knowledge fall back
        // to the default initialArticle.
        const draft = consumeDraftSession();
        if (draft) {
            this.article = {
                ...this.article,
                title: draft.title || this.article.title,
                status: 'draft',
            };
            if (draft.recordType) this.recordTypeLabel = draft.recordType;
            // Mark the host so CSS hides the shell on first paint —
            // prevents a one-frame flash before Motion takes over.
            this._arrivedFromDraft = true;
            this.classList.add('ra--entering');
        }

        this._boundEscapeHandler = (e) => {
            if (e.key === 'Escape' && this._promptBlockId) {
                this._dismissActivePrompt();
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

    get enrichedBlocks() {
        const blocks = this.article.blockData || [];
        return blocks.map((b, i) => {
            let syncPosition = null;
            if (b.syncGroupId) {
                const prevSame = i > 0 && blocks[i - 1].syncGroupId === b.syncGroupId;
                const nextSame = i < blocks.length - 1 && blocks[i + 1].syncGroupId === b.syncGroupId;
                if (prevSame && nextSame) syncPosition = 'middle';
                else if (prevSame) syncPosition = 'last';
                else if (nextSame) syncPosition = 'first';
                else syncPosition = 'only';
            }
            return {
                ...b,
                isSelected: b.id === this.selectedBlockId,
                syncPosition,
            };
        });
    }

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
        return this.isAssistCollapsed ? `${base} ra-shell__aside_collapsed` : base;
    }

    get shellClass() {
        let cls = 'ra-shell';
        if (!this.showAssistPanel) cls += ' ra-shell_no-left';
        else if (this.isAssistCollapsed) cls += ' ra-shell_assist-collapsed';
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

    // ─── Block edits ───────────────────────────────────────────────
    // Pending focus target: after a render the child <ui-article-block>
    // with this id is asked to focus its contenteditable. Consumed in
    // renderedCallback() so we never double-focus.
    focusBlockId = null;

    handleBlockChange(event) {
        const { id, content } = event.detail;
        // Don't push undo on every keystroke — the contenteditable emits
        // `input` events per character. Mutate in place so state stays
        // in sync without resetting the DOM selection.
        const idx = this.article.blockData.findIndex((b) => b.id === id);
        if (idx === -1) return;
        const current = this.article.blockData[idx];
        if (current.content === content) return;
        const nextBlocks = this.article.blockData.slice();
        nextBlocks[idx] = { ...current, content };
        this.article = { ...this.article, blockData: nextBlocks };
    }

    handleBlockRemove(event) {
        const { id } = event.detail;
        this.pushUndo();
        this.article = {
            ...this.article,
            blockData: this.article.blockData.filter((b) => b.id !== id),
        };
    }

    // ─── Notion-like block editor key handling ─────────────────────
    // Ported from the React Knowledge Builder (components/ArticleView.tsx
    // handleKeyDown). Enter → new block, Backspace on empty → merge,
    // Space after markdown prefix → change type, Arrow → navigate.
    handleBlockKeyDown(event) {
        const { id, index, key, shiftKey, content } = event.detail;
        const blocks = this.article.blockData;

        if (key === 'Enter' && !shiftKey) {
            this.pushUndo();
            const newBlock = { id: freshId('b'), type: 'p', content: '' };
            const next = blocks.slice();
            next.splice(index + 1, 0, newBlock);
            this.article = { ...this.article, blockData: next };
            this.focusBlockId = newBlock.id;
        } else if (key === 'Backspace' && content === '' && index > 0) {
            this.pushUndo();
            const prevId = blocks[index - 1].id;
            this.article = {
                ...this.article,
                blockData: blocks.filter((b) => b.id !== id),
            };
            this.focusBlockId = prevId;
        } else if (key === ' ') {
            const map = { '#': 'h1', '##': 'h2', '###': 'h3', '-': 'li', '>': 'blockquote' };
            const nextType = map[content];
            if (nextType) {
                this.pushUndo();
                this.article = {
                    ...this.article,
                    blockData: blocks.map((b, i) =>
                        i === index ? { ...b, type: nextType, content: '' } : b
                    ),
                };
                this.focusBlockId = id;
            }
        } else if (key === 'ArrowUp' && index > 0) {
            this.focusBlockId = blocks[index - 1].id;
        } else if (key === 'ArrowDown' && index < blocks.length - 1) {
            this.focusBlockId = blocks[index + 1].id;
        }
    }

    handleBlockPaste(event) {
        const { id, lines } = event.detail;
        if (!lines || lines.length <= 1) return;
        const blocks = this.article.blockData;
        const idx = blocks.findIndex((b) => b.id === id);
        if (idx === -1) return;
        this.pushUndo();
        const parsed = lines.map((line) => parseLineToBlock(line));
        this.article = {
            ...this.article,
            blockData: [...blocks.slice(0, idx), ...parsed, ...blocks.slice(idx + 1)],
        };
        this.focusBlockId = parsed[parsed.length - 1].id;
    }

    // ─── Drag-and-drop block reordering ──────────────────────────
    handleBlockDragStart(event) {
        this._dragSourceId = event.detail.id;
    }

    handleBlockDragOver(event) {
        if (!this._dragSourceId) return;
        const { id: targetId } = event.detail;
        if (targetId === this._dragSourceId) return;

        const blocks = this.article.blockData;
        const srcIdx = blocks.findIndex((b) => b.id === this._dragSourceId);
        const tgtIdx = blocks.findIndex((b) => b.id === targetId);
        if (srcIdx === -1 || tgtIdx === -1 || srcIdx === tgtIdx) return;

        const next = blocks.slice();
        const [moved] = next.splice(srcIdx, 1);
        next.splice(tgtIdx, 0, moved);
        this.article = { ...this.article, blockData: next };
    }

    handleBlockDrop() {
        if (this._dragSourceId) {
            this.pushUndo();
        }
        this._dragSourceId = null;
    }

    handleBlockDragEnd() {
        this._dragSourceId = null;
    }

    handleSlashInsertBlock() {
        if (!this.showAssistPanel) {
            this.showAssistPanel = true;
            this.isAssistCollapsed = false;
        } else if (this.isAssistCollapsed) {
            this._animatePanel(false);
        }
    }

    handleSlashCommand(event) {
        const { command } = event.detail;
        this.addAgentMessage(
            `Slash command "${command}" triggered — this feature is coming soon.`
        );
    }

    handleBlockAiEdit(event) {
        const { id, content, type } = event.detail;
        const preview = content?.slice(0, 60) || type;
        this.handleChatSend({
            detail: { text: `Improve this ${type} block: "${preview}…"` },
        });
    }

    handleBlockSelect(event) {
        const { id } = event.detail;
        this.selectedBlockId = this.selectedBlockId === id ? null : id;
        this._dismissActivePrompt();
    }

    _dismissActivePrompt() {
        if (!this._promptBlockId) return;
        const el = this._getBlockEl(this._promptBlockId);
        if (el) el.closePrompt();
        this._promptBlockId = null;
    }

    handleBlockPromptOpen(event) {
        const { id } = event.detail;
        if (this._promptBlockId === id) return;

        const closeOld = this._promptBlockId
            ? this._getBlockEl(this._promptBlockId)?.closePrompt() || Promise.resolve()
            : Promise.resolve();

        this._promptBlockId = id;
        this.selectedBlockId = id;

        closeOld.then(() => {
            const newEl = this._getBlockEl(id);
            if (newEl) newEl.openPrompt();
        });
    }

    handleBlockPromptClose(event) {
        const { id } = event.detail;
        if (this._promptBlockId === id) {
            this._promptBlockId = null;
        }
    }

    async handleBlockConvertRequest(event) {
        const { id } = event.detail;
        const block = this.article.blockData.find((b) => b.id === id);
        if (!block || block.syncGroupId) return;

        const result = await ConvertBlockModal.open({
            size: 'small',
            blockContent: block.content,
        });

        if (!result || !result.title) return;

        this.pushUndo();

        const newSyncGroupId = freshId('kb');

        this.article = {
            ...this.article,
            blockData: this.article.blockData.map((b) =>
                b.id === id ? { ...b, syncGroupId: newSyncGroupId } : b
            ),
        };

        this.knowledgeBlockLibrary = [
            ...this.knowledgeBlockLibrary,
            {
                syncGroupId: newSyncGroupId,
                title: result.title,
                description: result.description || '',
                content: block.content,
                instanceCount: 1,
                blocks: [
                    {
                        id: freshId('kb-block'),
                        type: block.type,
                        content: block.content,
                        syncGroupId: newSyncGroupId,
                    },
                ],
            },
        ];

        this.addAgentMessage(
            `Converted block to Knowledge Block "${result.title}" — it now appears in your Sources library.`
        );
        this.applyHealthBoost(3, 1);
        this.showToast(`Knowledge Block "${result.title}" created`);
    }

    _getBlockEl(blockId) {
        return this.querySelector(`ui-article-block[data-id="${blockId}"]`);
    }

    renderedCallback() {
        // Play the Motion entrance once — the first render after we
        // arrived from the Draft-with-Agentforce flow. Runs before the
        // focus pass below so the page composes into view before any
        // contenteditable focus jumps the cursor.
        if (this._arrivedFromDraft && !this._didEntranceAnimation) {
            this._didEntranceAnimation = true;
            this._playEntranceAnimation();
        }

        if (!this.focusBlockId) return;
        const el = this.querySelector(
            `ui-article-block[data-id="${this.focusBlockId}"]`
        );
        this.focusBlockId = null;
        if (el && typeof el.focus === 'function') {
            // Defer to next tick so LWC finishes committing any attribute
            // changes before we read the contenteditable child.
            Promise.resolve().then(() => el.focus());
        }
    }

    /**
     * Smooth Motion-driven entry for the new authoring experience.
     * Triggered the first render after a Draft-with-Agentforce
     * generation completes. Plays a 3-stage layered reveal:
     *   1. The whole shell fades + glides up (sets the canvas).
     *   2. Left assist / center article / right chat columns
     *      stagger in for a layered feel.
     *   3. Article header + body blocks ripple in last so the
     *      content lands on top of the structure.
     */
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

        // Stage 1 — shell glides up + fades in.
        const shellAnim = motionAnimate(
            shell,
            { opacity: [0, 1], y: [16, 0] },
            { duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }
        );

        // Once the shell starts settling, drop the gating class so any
        // future rerender doesn't clamp opacity back to 0.
        shellAnim.finished?.then?.(() => {
            this.classList.remove('ra--entering');
        }) ?? this.classList.remove('ra--entering');

        // Stage 2 — major regions stagger in alongside the shell.
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

        // Stage 3 — article head + each body block ripple in last.
        const head = this.querySelector('.ra-article__head');
        if (head) {
            motionAnimate(
                head,
                { opacity: [0, 1], y: [10, 0] },
                { duration: 0.45, ease: 'easeOut', delay: 0.22 }
            );
        }

        const blocks = this.querySelectorAll('.ra-article__body ui-article-block');
        if (blocks.length) {
            motionAnimate(
                blocks,
                { opacity: [0, 1], y: [10, 0] },
                {
                    duration: 0.42,
                    ease: 'easeOut',
                    delay: motionStagger(0.04, { startDelay: 0.3 }),
                }
            );
        }
    }

    pushUndo() {
        this.undoStack = [...this.undoStack, deepClone(this.article)].slice(-20);
        this.redoStack = [];
    }

    handleUndo() {
        if (this.undoStack.length === 0) return;
        const prev = this.undoStack[this.undoStack.length - 1];
        this.redoStack = [...this.redoStack, deepClone(this.article)];
        this.undoStack = this.undoStack.slice(0, -1);
        this.article = prev;
    }

    handleRedo() {
        if (this.redoStack.length === 0) return;
        const next = this.redoStack[this.redoStack.length - 1];
        this.undoStack = [...this.undoStack, deepClone(this.article)];
        this.redoStack = this.redoStack.slice(0, -1);
        this.article = next;
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

    // ─── Knowledge Block insertion ──────────────────────────────────
    handleInsertBlock(event) {
        const { syncGroupId } = event.detail;
        const entry = this.knowledgeBlockLibrary.find((kb) => kb.syncGroupId === syncGroupId);
        if (!entry || !entry.blocks) return;

        this.pushUndo();

        const newBlocks = entry.blocks.map((b) => ({
            ...b,
            id: freshId('b'),
            syncGroupId: entry.syncGroupId,
            isNew: true,
        }));

        const insertIdx = this.selectedBlockId
            ? this.article.blockData.findIndex((b) => b.id === this.selectedBlockId) + 1
            : this.article.blockData.length;

        const next = this.article.blockData.slice();
        next.splice(insertIdx, 0, ...newBlocks);
        this.article = { ...this.article, blockData: next };

        this.addAgentMessage(
            `Inserted knowledge block "${entry.title}" — ${newBlocks.length} synced block(s) added.`
        );
        this.applyHealthBoost(4, 2);
        this.showToast(`"${entry.title}" block inserted`);

        window.setTimeout(() => {
            this.article = {
                ...this.article,
                blockData: this.article.blockData.map((b) => ({ ...b, isNew: false })),
            };
        }, 800);
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

    /**
     * Collapse / expand the Knowledge Assist (left) panel using Motion.
     *
     * The grid track width is driven by the `--ra-left-col` CSS variable
     * on `.ra-shell` (see reviewArticle.css). Motion tweens that variable
     * frame-by-frame so `grid-template-columns` interpolates smoothly,
     * and concurrently morphs the panel's border-radius / padding / gap
     * plus the inner card's opacity + slight x-shift for a layered feel.
     *
     * Collapse → fade card out, shrink track 379px → 56px, morph panel.
     * Expand   → grow track 56px → 379px, morph panel back, fade card in.
     *
     * Honors prefers-reduced-motion + the in-app animation toggle.
     */
    _animatePanel(collapse) {
        if (this._panelAnimating) return;
        const shell = this.querySelector('.ra-shell');
        if (!shell) return;

        const skipAnimation = !this.animationEnabled ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (skipAnimation) {
            this.isAssistCollapsed = collapse;
            this._panelAnimating = false;
            return;
        }

        // Cancel any in-flight tweens so a rapid re-toggle doesn't pile up
        // callbacks competing over --ra-left-col / panel styles.
        this._panelAnims?.forEach((a) => { try { a.stop?.(); } catch (_) {} });
        this._panelAnims = [];
        this._panelAnimating = true;

        // Same easing curve used for the Agentforce panel — keeps both
        // side-panels feeling like part of the same motion language.
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
            const trackAnim = motionAnimate(
                shell,
                { '--ra-left-col': ['379px', '56px'] },
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

            // The track tween defines the visible "done" moment; commit
            // state once it lands so the class swap to assist-collapsed
            // happens at the same instant.
            awaitDone(trackAnim)
                .catch(() => {})
                .finally(() => {
                    this.isAssistCollapsed = true;
                    settle();
                });
            return;
        }

        // Expand path
        this.isAssistCollapsed = false;
        // Wait one frame so the collapsed-class style is removed before
        // we apply our inline starting state, then animate up to 379px.
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

    /**
     * Slide the Agentforce (chat) panel open or closed using Motion.
     *
     * Implementation note: animating `grid-template-columns` directly
     * doesn't interpolate reliably across browsers, so we drive the
     * track width via the `--ra-right-col` CSS variable on `.ra-shell`
     * (see reviewArticle.css). Motion tweens the variable, the grid
     * picks up the new width every frame, and the aside content fades
     * in / out slightly offset for a layered feel.
     *
     * Open  → mount aside, expand track 0 → 410px, fade aside in (delay).
     * Close → fade aside out, collapse track 410 → 0px, then unmount.
     *
     * Honors prefers-reduced-motion + the in-app animation toggle.
     */
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

        // Cancel any in-flight micro-animations from a previous toggle so we
        // don't pile up callbacks fighting over --ra-right-col / opacity.
        this._chatAnims?.forEach((a) => { try { a.stop?.(); } catch (_) {} });
        this._chatAnims = [];
        this._chatAnimating = true;

        // Smooth, slightly emphatic ease for the track expansion (matches
        // the "smart, swift" feel of the Agentforce surface elsewhere).
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
            // Wait one frame so the aside is in the DOM before Motion grabs it.
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
                        // Drop the inline var so the CSS fallback (410px) takes over.
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
                // Re-apply the closed state via class (`ra-shell_no-right`),
                // which sets --ra-right-col: 0px in CSS, then drop our inline
                // override so the cascade keeps the panel collapsed.
                this.showChatPanel = false;
                this._chatAnimating = false;
                this._chatAnims = [];
                shell.style.removeProperty('--ra-right-col');
                if (aside) aside.style.opacity = '';
            });
    }

    handleUpdateAll() {
        this.pushUndo();
        // Apply every available suggestion in sequence.
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

        const newBlocks = this.blocksForSuggestion(suggestion);
        if (newBlocks.length > 0) {
            this.article = {
                ...this.article,
                blockData: [...this.article.blockData, ...newBlocks.map((b) => ({ ...b, isNew: true }))],
            };
        }

        // Mark suggestion as applied
        this.suggests = this.suggests.map((s, i) => (i === idx ? { ...s, status: 'applied' } : s));

        this.applyHealthBoost(suggestion.coverageDelta, suggestion.confidenceDelta);

        if (announce) {
            this.addAgentMessage(
                `Applied "${suggestion.label}". ${newBlocks.length} block${newBlocks.length === 1 ? '' : 's'} added to the article draft.`
            );
        }

        // Remove the "isNew" highlight after animation
        window.setTimeout(() => {
            this.article = {
                ...this.article,
                blockData: this.article.blockData.map((b) => ({ ...b, isNew: false })),
            };
        }, 800);
    }

    blocksForSuggestion(s) {
        switch (s.actionKind) {
            case 'update-video':
                return [
                    {
                        id: freshId('b'),
                        type: 'video',
                        title: 'Video Explainer: Baggage size and weight',
                        content: 'A short walkthrough showing how to measure bags and avoid fees.',
                    },
                ];
            case 'add-knowledge-block':
                return [
                    { id: freshId('b'), type: 'h3', content: 'Login & account basics' },
                    {
                        id: freshId('b'),
                        type: 'p',
                        content:
                            'If you are a returning passenger, sign in to view your saved trip details before checking your baggage allowance. Your frequent-flyer tier may grant additional weight or bag count.',
                    },
                ];
            case 'add-wizard':
                return [
                    { id: freshId('b'), type: 'h3', content: 'Interactive packing wizard' },
                    {
                        id: freshId('b'),
                        type: 'p',
                        content:
                            'Follow the voice-guided steps to size, weigh, and log each bag. The wizard checks your fare rules and flags anything that exceeds your allowance before you leave for the airport.',
                    },
                ];
            case 'add-faq':
                return [
                    { id: freshId('b'), type: 'h3', content: 'Frequently asked questions' },
                    { id: freshId('b'), type: 'li', content: 'What counts as a personal item vs a carry-on?' },
                    { id: freshId('b'), type: 'li', content: 'How are oversized fees calculated?' },
                    { id: freshId('b'), type: 'li', content: 'Can I pre-pay for extra weight online?' },
                ];
            default:
                return [];
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

        // Append user turn
        this.chatMessages = [
            ...this.chatMessages,
            { id: freshId('msg'), role: 'user', content: text, timestamp: Date.now() },
        ];

        // Generate a deterministic agent response with Apply-able suggestions.
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
                actionKind: 'rewrite',
                label: 'Shorten introduction',
                description: 'Rewrite the opening paragraph to be ~50% shorter.',
                targetBlockId: 'b-p-1',
            };
        }
        if (lower.includes('simplify') || lower.includes('simpler') || lower.includes('plain')) {
            return {
                id: freshId('s'),
                actionKind: 'rewrite',
                label: 'Simplify language',
                description: 'Rewrite using plainer language and shorter sentences.',
                targetBlockId: 'b-p-1',
            };
        }
        if (lower.includes('expand') || lower.includes('more detail') || lower.includes('elaborate')) {
            const targetBlock = this.selectedBlockId || 'b-p-2';
            return {
                id: freshId('s'),
                actionKind: 'expand',
                label: 'Expand with more detail',
                description: 'Baggage policies can vary further by route, alliance partnerships, and seasonal promotions — always confirm with the airline before departure.',
                targetBlockId: targetBlock,
            };
        }
        if (lower.includes('rewrite') || lower.includes('improve') || lower.includes('update')) {
            const targetBlock = this.selectedBlockId || 'b-p-1';
            return {
                id: freshId('s'),
                actionKind: 'rewrite',
                label: 'Rewrite block',
                description: `Improve the content based on: "${text.slice(0, 60)}"`,
                targetBlockId: targetBlock,
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

        if (suggestion.actionKind === 'rewrite' && suggestion.targetBlockId) {
            this.applyRewrite(suggestion);
        } else if (suggestion.actionKind === 'expand' && suggestion.targetBlockId) {
            this.applyExpand(suggestion);
        } else {
            const blocks = this.blocksForChatSuggestion(suggestion);
            this.article = {
                ...this.article,
                blockData: [...this.article.blockData, ...blocks.map((b) => ({ ...b, isNew: true }))],
            };
            this.addAgentMessage(`Applied "${suggestion.label}" — ${blocks.length} block(s) added to the draft.`);
        }

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

        window.setTimeout(() => {
            this.article = {
                ...this.article,
                blockData: this.article.blockData.map((b) => ({ ...b, isNew: false })),
            };
        }, 800);
    }

    applyRewrite(suggestion) {
        const targetId = suggestion.targetBlockId;
        const idx = this.article.blockData.findIndex((b) => b.id === targetId);
        if (idx === -1) return;
        const original = this.article.blockData[idx];
        const rewritten = this.rewriteContent(original.content, suggestion);
        this.article = {
            ...this.article,
            blockData: this.article.blockData.map((b, i) =>
                i === idx ? { ...b, content: rewritten, isNew: true } : b
            ),
        };
        this.addAgentMessage(`Rewrote the "${original.type}" block: "${suggestion.label}".`);
    }

    applyExpand(suggestion) {
        const targetId = suggestion.targetBlockId;
        const idx = this.article.blockData.findIndex((b) => b.id === targetId);
        const insertIdx = idx !== -1 ? idx + 1 : this.article.blockData.length;
        const newBlocks = [
            { id: freshId('b'), type: 'p', content: suggestion.description, isNew: true },
        ];
        const next = this.article.blockData.slice();
        next.splice(insertIdx, 0, ...newBlocks);
        this.article = { ...this.article, blockData: next };
        this.addAgentMessage(`Expanded content after block — 1 block added.`);
    }

    rewriteContent(original, suggestion) {
        const label = (suggestion.label || '').toLowerCase();
        if (label.includes('shorten') || label.includes('condense')) {
            const sentences = original.split('. ').filter(Boolean);
            return sentences.slice(0, Math.ceil(sentences.length / 2)).join('. ') + '.';
        }
        if (label.includes('simplify')) {
            return original
                .replace(/utilize/gi, 'use')
                .replace(/approximately/gi, 'about')
                .replace(/in order to/gi, 'to')
                .replace(/a large number of/gi, 'many');
        }
        return `${original} Additionally, ${suggestion.description.toLowerCase()}`;
    }

    blocksForChatSuggestion(s) {
        switch (s.actionKind) {
            case 'add-image':
                return [
                    {
                        id: freshId('b'),
                        type: 'image',
                        content: '',
                        caption: 'Measurement diagram — check both linear inches and weight.',
                    },
                ];
            case 'add-quote':
                return [
                    {
                        id: freshId('b'),
                        type: 'blockquote',
                        content:
                            '"Most overweight fees we see are from bags that missed the limit by under a pound. A cheap luggage scale pays for itself on the first trip." — Travel policy desk',
                    },
                ];
            case 'add-list':
                return [
                    { id: freshId('b'), type: 'h3', content: 'Measurement tips' },
                    { id: freshId('b'), type: 'li', content: 'Weigh every bag the night before — at peak travel weight.' },
                    { id: freshId('b'), type: 'li', content: 'Measure external pockets, wheels, and handles.' },
                    { id: freshId('b'), type: 'li', content: 'Keep the airline fare rules screenshot handy at check-in.' },
                ];
            case 'rewrite':
                return [];
            default:
                return [
                    { id: freshId('b'), type: 'h2', content: s.label },
                    { id: freshId('b'), type: 'p', content: s.description },
                ];
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
        // The platform default lifetime for lightning-toast is 4800ms
        // (no link) / 9600ms (with link) and is not configurable
        // through the public API. We want every toast in this app to
        // feel snappy (~2.2s), so after handing the toast off to the
        // platform we look it up inside the global toast container's
        // shadow root and trigger the same `close` flow the close
        // button does. The container listens for `close` on each
        // toast element, so dispatching it cleans up `_displayToasts`
        // and surfaces the next queued toast — no leak.
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
}

const TOAST_DISMISS_MS = 1500;

function closeOldestToast() {
    const container = document.querySelector('lightning-toast-container');
    if (!container) return;
    // Synthetic shadow exposes `shadowRoot`; native shadow does too.
    // Fall back to the host in the rare case neither is present.
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

// Visible cursors + avatars. Each entry uses a `color` token that both
// `ui-collaborator-cursors` and `ui-collaborator-avatars` map to their
// own per-component class (e.g. `cc-cursor_teal`, `cca-avatar_teal`).
const COLLABORATOR_ROSTER = [
    { id: 'shana', name: 'Shana Goldman', color: 'teal', initials: 'SG' },
    { id: 'laura', name: 'Laura Borghesi', color: 'pink', initials: 'LB' },
    { id: 'daniel', name: 'Daniel Sim', color: 'amber', initials: 'DS' },
];

// Off-screen invitee — surfaces in the avatar stack as "+1" and in the
// agent-panel notice as "John Chipchase and 3 others have joined…".
const COLLABORATOR_EXTRA_COUNT = 1;

/**
 * Turn a single line of user-pasted text into a block. Ported from
 * `components/ArticleView.tsx` in the parent React Knowledge Builder
 * so the dvs editor recognises the same markdown-style shortcuts when
 * pasting multi-line content.
 */
function parseLineToBlock(line) {
    let type = 'p';
    let content = line;

    const imgMatch = line.match(/^!\[([^\]]*)\]\((.+)\)$/);
    if (imgMatch) {
        return { id: freshId('b'), type: 'image', content: imgMatch[2], caption: imgMatch[1] };
    }

    if (line.startsWith('### ')) {
        type = 'h3';
        content = line.slice(4);
    } else if (line.startsWith('## ')) {
        type = 'h2';
        content = line.slice(3);
    } else if (line.startsWith('# ')) {
        type = 'h1';
        content = line.slice(2);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
        type = 'li';
        content = line.slice(2);
    } else if (line.startsWith('> ')) {
        type = 'blockquote';
        content = line.slice(2);
    }

    content = content.replace(/^\*\*(.+)\*\*$/, '$1');
    return { id: freshId('b'), type, content };
}
