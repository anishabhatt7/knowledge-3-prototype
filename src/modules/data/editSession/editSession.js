/**
 * Single-shot session used to hand a Knowledge Article off to the
 * Review Article (active authoring) page when the user clicks
 * "Edit Article" or "Edit Article to Resolve" from the Knowledge
 * Record view.
 *
 * The Knowledge Record stashes `{ id, title, html, recordType }` here
 * and navigates to `/edit-article/:id`. Review Article calls
 * `consumeEditSession()` exactly once on mount to seed its title and
 * editor body, then the slot resets so a future direct visit doesn't
 * pick up stale state.
 *
 * Mirrors the existing `data/draftSession` pattern.
 */

let _state = null;

/** Stash an edit payload. Replaces any prior pending payload. */
export function setEditSession(payload) {
    _state = payload && typeof payload === 'object' ? { ...payload } : null;
}

/** Read-and-clear: review-article uses this exactly once on mount. */
export function consumeEditSession() {
    const out = _state;
    _state = null;
    return out;
}

/** Non-destructive peek (debug only). */
export function peekEditSession() {
    return _state ? { ..._state } : null;
}
