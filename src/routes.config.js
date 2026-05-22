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
];
