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
        component: 'page-review-article',
        title: 'New Knowledge Article',
        navPage: 'knowledge',
        navLabel: 'Knowledge',
    },
    {
        // Alias route used by the workspace tab system. Command Center's
        // "Review Draft" (and similar Healing Graph / Knowledge Home flows)
        // stash a payload via `setDraftSession()` and then
        // `navigate('/new-knowledge')` so the review-article page mounts
        // fresh, picks up the draft title via `consumeDraftSession()`, and
        // is tracked as a closable tab in <shell-global-navigation>.
        // Mirrors V1's `/new-knowledge` route.
        path: '/new-knowledge',
        component: 'page-review-article',
        title: 'New Knowledge Article',
        navHighlight: 'knowledge',
    },
    {
        path: '/home',
        component: 'page-knowledge-home',
        title: 'Knowledge | Service Console',
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
        title: 'Healing Graph | Knowledge',
        navHighlight: 'knowledge',
    },
    {
        path: '/knowledge-base',
        component: 'page-knowledge-base',
        title: 'Knowledge Base | Knowledge',
        navHighlight: 'knowledge',
    },
    {
        // Parametric record route opened from the Knowledge Base list
        // view. Each article id maps to a distinct workspace tab whose
        // close action returns to `/knowledge-base` via the shell's
        // `originPath` mechanism. The `:id` lookup resolves against
        // `data/recordSession` which the table populates on row-click.
        path: '/knowledge-record/:id',
        component: 'page-knowledge-record',
        title: 'Knowledge Article',
        navHighlight: 'knowledge',
    },
    {
        // Edit-mode entry into the Review Article (active authoring)
        // page. Knowledge Record's "Edit Article" / "Edit Article to
        // Resolve" actions stash a payload via `setEditSession()` and
        // then `navigate('/edit-article/:id')`. The page consumes the
        // payload once on mount, reuses the same `page-review-article`
        // component as the new-knowledge flow, and writes back to
        // `data/articleEdits` on save so the Knowledge Record reflects
        // the changes immediately.
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
];
