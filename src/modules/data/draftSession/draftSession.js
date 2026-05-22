/**
 * Tiny in-memory session for the "Draft with Agentforce" flow.
 *
 * The Knowledge home page collects { title, recordType, language } in the
 * Draft-with-Agentforce modal, then navigates to the existing review-article
 * page. The review-article page picks up the values once via
 * `consumeDraftSession()` to seed its article header.
 *
 * The module is a value-only sibling of `data/knowledge` (no LWC component),
 * so it stays out of the router-component graph and there's no need to
 * register it in app.js.
 */

let _state = null;

/** Stash a draft payload from the home modal. Replaces any prior pending payload. */
export function setDraftSession(payload) {
    _state = payload && typeof payload === 'object' ? { ...payload } : null;
}

/** Read-and-clear: review-article uses this exactly once on mount. */
export function consumeDraftSession() {
    const out = _state;
    _state = null;
    return out;
}

/** Non-destructive peek (e.g. for log/debug). */
export function peekDraftSession() {
    return _state ? { ..._state } : null;
}
