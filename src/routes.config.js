/**
 * Routes for the DVS Knowledge Agent Dashboard — Knowledge workspace.
 *
 *   /              → Knowledge home (Service Console workspace)
 *   /new-knowledge → review-article page (reached after the
 *                    Draft-with-Agentforce modal flow). Highlights
 *                    the same Knowledge tab in the workspace nav.
 *   /more          → review-article (reused; placeholder workspace tab)
 */

export const routes = [
    {
        path: '/',
        component: 'page-knowledge-home',
        title: 'Knowledge | Service Console',
        navPage: 'knowledge',
        navLabel: 'Knowledge',
    },
    {
        path: '/new-knowledge',
        component: 'page-review-article',
        title: 'New Knowledge Article',
        navHighlight: 'knowledge',
    },
    {
        path: '/more',
        component: 'page-review-article',
        title: 'More',
        navPage: 'more',
        navLabel: 'More',
    },
    {
        path: '/healing-graph',
        component: 'page-healing-graph',
        title: 'Knowledge Health | Knowledge',
        navHighlight: 'knowledge',
    },
    {
        path: '/knowledge-base',
        component: 'page-knowledge-base',
        title: 'Knowledge Base | Knowledge',
        navHighlight: 'knowledge',
    },
    {
        // Parametric record route opened as a workspace tab from the
        // Knowledge Health "Active Quality Issue" article links (and the
        // Knowledge Base list view). Each article id maps to a distinct
        // tab; the `:id` lookup resolves against `data/recordSession`
        // which the opener populates before navigating.
        path: '/knowledge-record/:id',
        component: 'page-knowledge-record',
        title: 'Knowledge Article',
        navHighlight: 'knowledge',
    },
    {
        // Edit-mode entry into the Review Article (active authoring)
        // page. Knowledge Record's "Edit Article" actions stash a
        // payload via `setEditSession()` and navigate here.
        path: '/edit-article/:id',
        component: 'page-review-article',
        title: 'Edit Knowledge Article',
        navHighlight: 'knowledge',
    },
    {
        path: '/command-center',
        component: 'page-command-center',
        title: 'Command Center | Knowledge',
        navHighlight: 'knowledge',
    },
    {
        path: '/knowledge-agents',
        component: 'page-knowledge-agents',
        title: 'Knowledge Agents | Knowledge',
        navHighlight: 'knowledge',
    },
    {
        path: '/knowledge-blocks',
        component: 'page-knowledge-blocks',
        title: 'Knowledge Blocks | Knowledge',
        navHighlight: 'knowledge',
    },
    {
        // Full "Top Quality Issues" list, opened as a workspace tab from the
        // Knowledge Health dashboard "Explore All" action. Paginated list
        // with Domain/Agent, Issue Type, Priority, and Assigned filters.
        path: '/quality-issues',
        component: 'page-quality-issues',
        title: 'Top Quality Issues | Knowledge',
        navHighlight: 'knowledge',
    },
    {
        // Review Queue workspace tab, opened from the Command Center
        // "Review Article Drafts" CTA on each Knowledge Action row. The
        // launching row's articles are stashed via `setQueueSession()`
        // so the queue's rail + article headers match the table.
        path: '/review-queue',
        component: 'page-review-queue',
        title: 'Review Queue | Knowledge',
        navHighlight: 'knowledge',
    },
];
