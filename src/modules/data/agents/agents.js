/**
 * Seed data for the Knowledge Agents page.
 *
 * Ported from `knowledge-vision-app/data/agents.ts` (the original
 * Autonomous Knowledge Agents prototype) so the list + detail views
 * keep the same content and shape that the vision app exposes —
 * status, governance, signals, activity timeline, cross-domain links,
 * coordination events, predicted needs, and the feedback learning
 * stats are all preserved.
 *
 * `toTableRow` below derives the row shape the Figma list view
 * renders (status badge, governance pill, activity counts, signal
 * chips, health score) directly from the same vision-app fields,
 * so the list and detail views stay in sync.
 */

const h = (hours) => Date.now() - hours * 3_600_000;
const d = (days) => Date.now() - days * 86_400_000;

export const seedAgents = [
    {
        id: 'agent-billing',
        name: 'Billing Agent',
        domain: 'Billing',
        status: 'active',
        governanceTier: 'auto-publish',
        signalSources: ['cases', 'slack', 'docs'],
        domainHealthScore: 92,
        articlesCreated: 47,
        articlesUpdated: 132,
        gapsIdentified: 8,
        contradictionsFound: 3,
        coveragePercent: 94,
        freshnessPercent: 91,
        avatar: '$',
        crossDomainLinks: [
            { targetDomain: 'Compliance', linkCount: 4, relationship: 'policy-reference' },
            { targetDomain: 'Engineering', linkCount: 2, relationship: 'api-dependency' },
            { targetDomain: 'Product', linkCount: 1, relationship: 'pricing-model' },
        ],
        coordinationEvents: [
            { partnerAgent: 'Compliance Agent', sharedEntity: 'Revenue Recognition Standards', status: 'in-sync', timestamp: h(3) },
            { partnerAgent: 'Engineering Agent', sharedEntity: 'API Rate Limiting Configuration', status: 'pending', timestamp: h(8) },
        ],
        predictedNeeds: [
            { topic: 'Tax calculation rules for EU expansion', confidence: 82, source: 'Slack: 8 threads on EU VAT', dueDate: '2026-05-15' },
            { topic: 'Usage-based billing reconciliation guide', confidence: 76, source: 'Cases: 14 tickets on metered billing', dueDate: '2026-04-30' },
        ],
        feedbackStats: { totalReviewed: 47, accepted: 41, modified: 4, rejected: 2, confidenceTrend: [78, 81, 85, 88, 91, 93] },
        activityLog: [
            { id: 'act-b1', type: 'created', description: 'Created article on new tiered pricing model for enterprise accounts', entityTitle: 'Enterprise Tiered Pricing Guide', timestamp: h(1) },
            { id: 'act-b2', type: 'updated', description: 'Updated invoice dispute workflow to reflect Stripe-to-internal migration changes', entityTitle: 'Invoice Dispute Resolution Process', timestamp: h(4) },
            { id: 'act-b3', type: 'flagged', description: 'Flagged contradiction between billing FAQ and refund policy on proration rules', entityTitle: 'Refund & Proration Policy', timestamp: h(8) },
            { id: 'act-b4', type: 'linked', description: 'Linked revenue recognition doc to SOC 2 compliance requirements', entityTitle: 'Revenue Recognition Standards', timestamp: h(18) },
            { id: 'act-b5', type: 'monitored', description: 'Detected 12 new Slack threads discussing subscription upgrade edge cases', timestamp: d(1) },
        ],
    },
    {
        id: 'agent-product',
        name: 'Product Agent',
        domain: 'Product',
        status: 'active',
        governanceTier: 'human-review',
        signalSources: ['slack', 'docs', 'code-repo'],
        domainHealthScore: 87,
        articlesCreated: 34,
        articlesUpdated: 89,
        gapsIdentified: 12,
        contradictionsFound: 5,
        coveragePercent: 86,
        freshnessPercent: 83,
        avatar: 'P',
        crossDomainLinks: [
            { targetDomain: 'Engineering', linkCount: 5, relationship: 'api-spec' },
            { targetDomain: 'Competitive Intelligence', linkCount: 3, relationship: 'feature-comparison' },
            { targetDomain: 'Onboarding', linkCount: 2, relationship: 'user-flow' },
        ],
        coordinationEvents: [
            { partnerAgent: 'Engineering Agent', sharedEntity: 'Analytics Dashboard v2 Spec', status: 'in-sync', timestamp: h(6) },
            { partnerAgent: 'Competitive Intel Agent', sharedEntity: 'Feature Parity Tracker', status: 'conflict', timestamp: d(1) },
        ],
        predictedNeeds: [
            { topic: 'Mobile app feature parity documentation', confidence: 88, source: 'Roadmap: Q3 mobile launch', dueDate: '2026-06-01' },
            { topic: 'AI assistant integration guide', confidence: 71, source: 'Slack: 5 threads on AI features', dueDate: '2026-07-15' },
            { topic: 'Deprecation notice for legacy dashboard', confidence: 91, source: 'Decision: dec-005 active', dueDate: '2026-04-20' },
        ],
        feedbackStats: { totalReviewed: 34, accepted: 27, modified: 5, rejected: 2, confidenceTrend: [72, 75, 78, 82, 85, 87] },
        activityLog: [
            { id: 'act-p1', type: 'created', description: 'Drafted feature spec article for the new analytics dashboard rebuild', entityTitle: 'Analytics Dashboard v2 Spec', timestamp: h(3) },
            { id: 'act-p2', type: 'updated', description: 'Updated roadmap article with Q2 priority shifts after leadership review', entityTitle: 'Product Roadmap Q2 2026', timestamp: h(10) },
            { id: 'act-p3', type: 'flagged', description: 'Flagged outdated competitor comparison table — missing three new entrants', entityTitle: 'Competitive Landscape Overview', timestamp: d(1) },
            { id: 'act-p4', type: 'linked', description: 'Linked dashboard rebuild decision to React migration ADR', entityTitle: 'Dashboard Technology Decision', timestamp: d(2) },
        ],
    },
    {
        id: 'agent-compliance',
        name: 'Compliance Agent',
        domain: 'Compliance',
        status: 'active',
        governanceTier: 'human-required',
        signalSources: ['docs', 'policy', 'cases'],
        domainHealthScore: 78,
        articlesCreated: 21,
        articlesUpdated: 56,
        gapsIdentified: 15,
        contradictionsFound: 7,
        coveragePercent: 74,
        freshnessPercent: 69,
        avatar: 'C',
        crossDomainLinks: [
            { targetDomain: 'Billing', linkCount: 6, relationship: 'regulatory-requirement' },
            { targetDomain: 'Engineering', linkCount: 3, relationship: 'security-policy' },
            { targetDomain: 'Product', linkCount: 1, relationship: 'data-handling' },
        ],
        coordinationEvents: [
            { partnerAgent: 'Billing Agent', sharedEntity: 'Revenue Recognition Standards', status: 'in-sync', timestamp: h(5) },
            { partnerAgent: 'Engineering Agent', sharedEntity: 'Information Security Policy', status: 'pending', timestamp: h(24) },
            { partnerAgent: 'Billing Agent', sharedEntity: 'PCI-DSS Compliance Requirements', status: 'in-sync', timestamp: d(2) },
        ],
        predictedNeeds: [
            { topic: 'CCPA enforcement guidance update', confidence: 89, source: 'Policy: new enforcement actions detected', dueDate: '2026-04-25' },
            { topic: 'SOC 2 Type II annual renewal checklist', confidence: 94, source: 'Calendar: audit due Q2', dueDate: '2026-05-01' },
        ],
        feedbackStats: { totalReviewed: 21, accepted: 16, modified: 3, rejected: 2, confidenceTrend: [65, 68, 72, 74, 76, 78] },
        activityLog: [
            { id: 'act-c1', type: 'created', description: 'Created draft article for GDPR data retention update effective May 2026', entityTitle: 'GDPR Data Retention Policy v3', timestamp: h(6) },
            { id: 'act-c2', type: 'flagged', description: 'Flagged SOC 2 audit checklist as potentially stale — last review was 90 days ago', entityTitle: 'SOC 2 Type II Audit Checklist', timestamp: h(12) },
            { id: 'act-c3', type: 'updated', description: 'Updated PCI-DSS requirements doc after annual certification renewal', entityTitle: 'PCI-DSS Compliance Requirements', timestamp: d(2) },
            { id: 'act-c4', type: 'monitored', description: 'Detected new regulatory guidance from CCPA enforcement actions', timestamp: d(3) },
            { id: 'act-c5', type: 'linked', description: 'Linked data breach response plan to incident management runbook', entityTitle: 'Data Breach Response Plan', timestamp: d(5) },
        ],
    },
    {
        id: 'agent-engineering',
        name: 'Engineering Agent',
        domain: 'Engineering',
        status: 'active',
        governanceTier: 'human-review',
        signalSources: ['code-repo', 'slack', 'docs'],
        domainHealthScore: 85,
        articlesCreated: 52,
        articlesUpdated: 147,
        gapsIdentified: 9,
        contradictionsFound: 4,
        coveragePercent: 88,
        freshnessPercent: 85,
        avatar: 'E',
        crossDomainLinks: [
            { targetDomain: 'Product', linkCount: 4, relationship: 'api-spec' },
            { targetDomain: 'Compliance', linkCount: 3, relationship: 'security-requirement' },
            { targetDomain: 'Billing', linkCount: 2, relationship: 'integration-dependency' },
            { targetDomain: 'Onboarding', linkCount: 1, relationship: 'infrastructure-guide' },
        ],
        coordinationEvents: [
            { partnerAgent: 'Product Agent', sharedEntity: 'Analytics Dashboard v2 Spec', status: 'in-sync', timestamp: h(4) },
            { partnerAgent: 'Compliance Agent', sharedEntity: 'Information Security Policy', status: 'pending', timestamp: h(24) },
            { partnerAgent: 'Billing Agent', sharedEntity: 'API Rate Limiting Configuration', status: 'conflict', timestamp: h(7) },
        ],
        predictedNeeds: [
            { topic: 'Kubernetes v1.30 migration guide', confidence: 85, source: 'Code: k8s deprecation warnings in CI', dueDate: '2026-05-10' },
            { topic: 'GraphQL gateway monitoring runbook', confidence: 79, source: 'Slack: 6 threads on gateway latency', dueDate: '2026-05-01' },
        ],
        feedbackStats: { totalReviewed: 52, accepted: 45, modified: 5, rejected: 2, confidenceTrend: [80, 82, 84, 86, 88, 90] },
        activityLog: [
            { id: 'act-e1', type: 'created', description: 'Created runbook for PostgreSQL read-replica failover procedure', entityTitle: 'PostgreSQL Failover Runbook', timestamp: h(2) },
            { id: 'act-e2', type: 'updated', description: 'Updated API rate limiting docs after configuration change to 1000 req/min', entityTitle: 'API Rate Limiting Configuration', timestamp: h(7) },
            { id: 'act-e3', type: 'deprecated', description: 'Marked legacy REST API v1 documentation as deprecated', entityTitle: 'REST API v1 Reference', timestamp: d(1) },
            { id: 'act-e4', type: 'flagged', description: 'Flagged inconsistency in microservice dependency map — missing auth-service link', entityTitle: 'Microservice Architecture Map', timestamp: d(3) },
            { id: 'act-e5', type: 'linked', description: 'Linked GraphQL migration ADR to partner API integration guide', entityTitle: 'GraphQL Migration ADR', timestamp: d(4) },
        ],
    },
    {
        id: 'agent-onboarding',
        name: 'Onboarding Agent',
        domain: 'Onboarding',
        status: 'learning',
        governanceTier: 'human-review',
        signalSources: ['cases', 'slack', 'docs'],
        domainHealthScore: 71,
        articlesCreated: 18,
        articlesUpdated: 42,
        gapsIdentified: 19,
        contradictionsFound: 6,
        coveragePercent: 67,
        freshnessPercent: 62,
        avatar: 'O',
        crossDomainLinks: [
            { targetDomain: 'Product', linkCount: 3, relationship: 'user-flow' },
            { targetDomain: 'Engineering', linkCount: 2, relationship: 'setup-dependency' },
            { targetDomain: 'Compliance', linkCount: 1, relationship: 'training-requirement' },
        ],
        coordinationEvents: [
            { partnerAgent: 'Product Agent', sharedEntity: 'Customer Onboarding Flow', status: 'pending', timestamp: h(12) },
            { partnerAgent: 'Engineering Agent', sharedEntity: 'New Hire Technical Setup Guide', status: 'in-sync', timestamp: d(1) },
        ],
        predictedNeeds: [
            { topic: 'Progressive disclosure flow troubleshooting guide', confidence: 83, source: 'Cases: 9 tickets on new flow issues', dueDate: '2026-04-20' },
            { topic: 'SSO setup documentation for new hires', confidence: 77, source: 'Slack: 8 questions from recent cohort', dueDate: '2026-04-18' },
            { topic: 'Mobile onboarding experience guide', confidence: 68, source: 'Roadmap: mobile launch Q3', dueDate: '2026-06-15' },
        ],
        feedbackStats: { totalReviewed: 18, accepted: 12, modified: 4, rejected: 2, confidenceTrend: [58, 62, 65, 68, 70, 71] },
        activityLog: [
            { id: 'act-o1', type: 'created', description: 'Drafted new hire technical setup guide based on recent IT support tickets', entityTitle: 'New Hire Technical Setup Guide', timestamp: h(5) },
            { id: 'act-o2', type: 'flagged', description: 'Flagged outdated onboarding wizard screenshots — UI has changed significantly', entityTitle: 'Customer Onboarding Wizard Guide', timestamp: d(1) },
            { id: 'act-o3', type: 'updated', description: 'Updated employee onboarding checklist with new compliance training requirement', entityTitle: 'Employee Onboarding Checklist', timestamp: d(2) },
            { id: 'act-o4', type: 'monitored', description: 'Detected 8 Slack questions about SSO setup from recent new hires', timestamp: d(3) },
        ],
    },
    {
        id: 'agent-competitive',
        name: 'Competitive Intel Agent',
        domain: 'Competitive Intelligence',
        status: 'active',
        governanceTier: 'auto-publish',
        signalSources: ['docs', 'slack', 'cases'],
        domainHealthScore: 65,
        articlesCreated: 28,
        articlesUpdated: 63,
        gapsIdentified: 22,
        contradictionsFound: 9,
        coveragePercent: 61,
        freshnessPercent: 57,
        avatar: 'CI',
        crossDomainLinks: [
            { targetDomain: 'Product', linkCount: 4, relationship: 'feature-comparison' },
            { targetDomain: 'Billing', linkCount: 3, relationship: 'pricing-comparison' },
            { targetDomain: 'Engineering', linkCount: 1, relationship: 'capability-analysis' },
        ],
        coordinationEvents: [
            { partnerAgent: 'Product Agent', sharedEntity: 'Feature Parity Tracker', status: 'conflict', timestamp: d(1) },
            { partnerAgent: 'Billing Agent', sharedEntity: 'Competitor Pricing Matrix Q1 2026', status: 'in-sync', timestamp: d(2) },
        ],
        predictedNeeds: [
            { topic: 'InsightHub competitor battlecard', confidence: 91, source: 'News: InsightHub raised Series C', dueDate: '2026-04-22' },
            { topic: 'Updated win/loss analysis for APAC', confidence: 74, source: 'Sales data: missing APAC segment', dueDate: '2026-05-15' },
        ],
        feedbackStats: { totalReviewed: 28, accepted: 24, modified: 3, rejected: 1, confidenceTrend: [70, 73, 76, 79, 82, 84] },
        activityLog: [
            { id: 'act-ci1', type: 'created', description: 'Created battlecard for new competitor Acme Analytics entering enterprise tier', entityTitle: 'Acme Analytics Battlecard', timestamp: h(4) },
            { id: 'act-ci2', type: 'updated', description: 'Updated pricing comparison matrix after competitor price changes in Q1', entityTitle: 'Competitor Pricing Matrix Q1 2026', timestamp: d(1) },
            { id: 'act-ci3', type: 'flagged', description: 'Flagged win/loss analysis as incomplete — missing data from APAC region', entityTitle: 'Win/Loss Analysis H1 2026', timestamp: d(3) },
            { id: 'act-ci4', type: 'monitored', description: 'Detected competitor product launch announcement via news monitoring feed', timestamp: d(5) },
            { id: 'act-ci5', type: 'linked', description: 'Linked competitor feature parity tracker to product roadmap decisions', entityTitle: 'Feature Parity Tracker', timestamp: d(7) },
        ],
    },
];

/**
 * Map an agent record to the columns rendered by the list view.
 *
 * The columns mirror the data points the React `AutonomousAgents`
 * card in `knowledge-vision-app` exposes — name + status badge,
 * governance tier, articles created/updated, gaps identified, signal
 * sources, and the numeric domain health score — so the v2 table
 * shows the same per-agent information without rebuilding the card
 * layout.
 */
export function toTableRow(agent) {
    const signalChips = (agent.signalSources || []).map((source) => ({
        key: source,
        label: SIGNAL_LABELS[source] || source,
    }));

    return {
        id: agent.id,
        name: agent.name,
        domain: agent.domain,
        avatar: agent.avatar,

        statusLabel: STATUS_LABELS[agent.status] || agent.status,
        statusClass: `ka-status-badge ka-status-badge--${agent.status}`,

        govLabel: GOVERNANCE_LABELS[agent.governanceTier] || agent.governanceTier,
        govClass: `ka-gov-pill ka-gov-pill--${agent.governanceTier}`,

        articlesCreated: agent.articlesCreated,
        articlesUpdated: agent.articlesUpdated,
        gapsIdentified: agent.gapsIdentified,

        signalChips,

        healthScore: agent.domainHealthScore,
        healthClass: healthScoreClass(agent.domainHealthScore),
    };
}

/**
 * Bucket a 0–100 health score into a Tailwind-like badge class so
 * the table can colour the number consistently with the React
 * `HealthScore` component (green ≥ 85, lime ≥ 70, amber ≥ 50, red below).
 */
export function healthScoreClass(score) {
    if (score >= 85) return 'ka-table-health ka-table-health--excellent';
    if (score >= 70) return 'ka-table-health ka-table-health--healthy';
    if (score >= 50) return 'ka-table-health ka-table-health--attention';
    return 'ka-table-health ka-table-health--risk';
}

export function formatRelativeTime(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

export const GOVERNANCE_LABELS = {
    'auto-publish': 'Auto-publish',
    'human-review': 'Human Review',
    'human-required': 'Human Required',
};

export const GOVERNANCE_DESCRIPTIONS = {
    'auto-publish':
        'This agent can autonomously publish changes without human approval. All actions are logged and auditable.',
    'human-review':
        'Changes are drafted by the agent but require human review and approval before publishing.',
    'human-required':
        'This agent operates in a high-sensitivity domain. All actions require explicit human authorization before execution.',
};

export const SIGNAL_LABELS = {
    cases: 'Cases',
    slack: 'Slack',
    'code-repo': 'Code',
    docs: 'Docs',
    policy: 'Policy',
};

export const STATUS_LABELS = {
    active: 'Active',
    learning: 'Learning',
    paused: 'Paused',
    error: 'Error',
};
