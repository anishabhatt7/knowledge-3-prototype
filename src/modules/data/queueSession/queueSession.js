/**
 * Queue session — a lightweight, module-scoped hand-off used to carry
 * the selected Command Center action item's article list into the
 * Review Queue page (page-review-queue).
 *
 * The Command Center "Review Article Drafts" CTA stamps the action's
 * title + table rows here via `setQueueSession`, then navigates to
 * `/review-queue`. The Review Queue reads the session in its
 * `connectedCallback` so the queue rail + article headers match the
 * exact articles listed in that action row's table.
 *
 * Mirrors the `draftSession` pattern already used in this repo: a
 * single in-memory slot, no persistence. If no session is set, the
 * Review Queue falls back to its own seed data.
 *
 * Shape:
 *   {
 *     title: string,                 // the action item's headline
 *     articles: [                    // the action row's table rows
 *       { id, article, description, violations, aiScore, aiTone, lastUpdated },
 *       ...
 *     ]
 *   }
 */

let _session = null;

export function setQueueSession(session) {
    _session = session || null;
}

export function getQueueSession() {
    return _session;
}

export function clearQueueSession() {
    _session = null;
}
