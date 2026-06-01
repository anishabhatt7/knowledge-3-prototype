/**
 * In-memory cache of Knowledge Article records the user has opened from
 * the Knowledge Base list view. Unlike `data/draftSession`, this is a
 * keyed map (not a single read-and-clear slot) because multiple article
 * tabs can be open at once in the workspace — switching between them
 * must always be able to resolve the matching title and metadata, even
 * after the page component has already mounted once.
 *
 * The Knowledge Base table calls `setRecord({ id, title, ... })` on row
 * click before navigating to `/knowledge-record/:id`; the
 * `page-knowledge-record` component then reads `getRecord(id)` for its
 * header. The map is process-local — a hard refresh clears it, which is
 * acceptable for a prototype (the page falls back to the URL id and
 * generic copy in that case).
 */

const _records = new Map();

/** Stash (or replace) the descriptor for a single article id. */
export function setRecord(payload) {
    if (!payload || payload.id == null) return;
    const key = String(payload.id);
    _records.set(key, { ...payload, id: key });
}

/** Read a previously stashed record. Returns null when the id is unknown. */
export function getRecord(id) {
    if (id == null) return null;
    return _records.get(String(id)) || null;
}

/** Used by tests / debugging; not consumed by the app at runtime. */
export function peekAllRecords() {
    return Array.from(_records.values()).map((r) => ({ ...r }));
}
