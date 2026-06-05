/**
 * In-memory store of article edits made in the Review Article (active
 * authoring) experience. Keyed by article id so multiple article tabs
 * can be edited independently.
 *
 * The Knowledge Record page reads from this store to render any saved
 * overrides (title + body HTML) instead of the static demo content
 * from `articleContent.js`. Edits dispatch a window-level
 * `article:saved` event so open Knowledge Record views can react and
 * refresh without polling.
 *
 * Process-local; a hard refresh clears it (matching `recordSession`).
 */

const _edits = new Map();

/**
 * Save (or replace) the edit payload for an article.
 *
 * @param {string|number} id   Article id (matches recordSession key).
 * @param {{ title?: string, html?: string }} payload
 * @returns {object|null} The stored payload (or null when id was missing).
 */
export function setArticleEdit(id, payload) {
    if (id == null) return null;
    const key = String(id);
    const stored = {
        ...(payload || {}),
        savedAt: Date.now(),
    };
    _edits.set(key, stored);
    if (typeof window !== 'undefined') {
        window.dispatchEvent(
            new CustomEvent('article:saved', { detail: { id: key } })
        );
    }
    return stored;
}

/**
 * Read the saved edit for an article. Returns null when there is no
 * pending edit, so callers can fall back to the original demo content.
 */
export function getArticleEdit(id) {
    if (id == null) return null;
    return _edits.get(String(id)) || null;
}

/** Clear a single edit (e.g. when the user discards changes). */
export function clearArticleEdit(id) {
    if (id == null) return;
    _edits.delete(String(id));
}
