import { LightningElement, api, track } from 'lwc';

/**
 * Right panel — Authoring Agent chat.
 *
 * Functionality mirrors the React AuthoringAgent:
 *  - Chat feed with user + assistant turns
 *  - Assistant turns can include inline suggestions that apply blocks
 *    back to the article (bubbled to parent via `applyaction`)
 *  - Article preview card (locked-in reference to the current article)
 *  - Composer with enterprise knowledge chip + attach + send
 *
 * Props:
 *   messages: ChatMessage[]
 * Events:
 *   send       — detail: { text }
 *   applyaction — detail: { actionKind, label, description, targetBlockId? }
 *   rejectaction — detail: { messageId, suggestionId }
 */
export default class ChatPanel extends LightningElement {
    static renderMode = 'light';

    @api messages = [];
    @track input = '';
    @track isSending = false;

    get enrichedMessages() {
        return (this.messages || []).map((m) => ({
            ...m,
            isUser: m.role === 'user',
            isAssistant: m.role === 'assistant',
            isEvent: m.role === 'event',
            hasPreview: Boolean(m.articlePreview),
            hasText: Boolean(m.content),
            hasSuggestions: Array.isArray(m.suggestions) && m.suggestions.length > 0,
            timeLabel: relativeTime(m.timestamp),
            rowClass:
                m.role === 'user'
                    ? 'cp-row cp-row_user'
                    : m.role === 'event'
                        ? 'cp-row cp-row_event'
                        : 'cp-row',
            suggestionRows: (m.suggestions || []).map((s) => ({ ...s })),
            previewRecordTypeLabel: m.articlePreview?.recordType,
            previewCategories: (m.articlePreview?.dataCategories || []).map((c, i) => ({
                key: `${m.id}-cat-${i}`,
                label: c,
            })),
            previewAudiences: (m.articlePreview?.audiences || []).map((c, i) => ({
                key: `${m.id}-aud-${i}`,
                label: c,
            })),
        }));
    }

    handleInput(event) {
        this.input = event.target.value;
    }

    handleKeydown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.submit();
        }
    }

    handleSend() {
        this.submit();
    }

    submit() {
        const text = (this.input || '').trim();
        if (!text || this.isSending) return;
        this.dispatchEvent(new CustomEvent('send', { detail: { text } }));
        this.input = '';
        const ta = this.querySelector('.cp-composer__input');
        if (ta) ta.value = '';
    }

    handleApply(event) {
        const { messageId, suggestionId } = event.currentTarget.dataset;
        this.dispatchEvent(
            new CustomEvent('applyaction', {
                detail: { messageId, suggestionId },
            })
        );
    }

    handleReject(event) {
        const { messageId, suggestionId } = event.currentTarget.dataset;
        this.dispatchEvent(
            new CustomEvent('rejectaction', {
                detail: { messageId, suggestionId },
            })
        );
    }

    handleClose() {
        window.dispatchEvent(
            new CustomEvent('agentforce:toggle', { detail: { open: false } })
        );
    }
}

function relativeTime(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}
