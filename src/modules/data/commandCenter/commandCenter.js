export const seedAIReadiness = {
    overall: 78,
    dimensions: [
        { key: 'completeness', label: 'Completeness', score: 88, description: 'Strong metadata coverage across articles' },
        { key: 'structure', label: 'Structure', score: 72, description: 'Formatting consistency improving this quarter' },
        { key: 'duplication', label: 'Duplication', score: 64, description: 'Performance trending below baseline' },
        { key: 'clarity', label: 'Clarity', score: 85, description: 'Readability above target this quarter' },
        { key: 'conflict', label: 'Conflict', score: 81, description: 'Few contradictions flagged this week' },
    ],
};

export const seedCapabilitySummaries = [
    {
        key: 'agents',
        shortLabel: 'Agents',
        metric: 'Active Agents',
        metricValue: '5',
        healthScore: 80,
        trend: 'up',
        trendValue: '+12% this week',
    },
    {
        key: 'memory',
        shortLabel: 'Memory',
        metric: 'Active Decisions',
        metricValue: '10',
        healthScore: 85,
        trend: 'up',
        trendValue: '+3 decisions this month',
    },
    {
        key: 'healing',
        shortLabel: 'Healing',
        metric: 'Issues Resolved',
        metricValue: '34',
        healthScore: 76,
        trend: 'up',
        trendValue: '+8 healed this week',
    },
    {
        key: 'reasoning',
        shortLabel: 'Reasoning',
        metric: 'Queries Answered',
        metricValue: '127',
        healthScore: 82,
        trend: 'up',
        trendValue: '+15% accuracy this month',
    },
];

export const seedWatchlist = [
    {
        id: 'total-articles',
        title: 'Total Articles',
        cadence: 'Week to Date, Facebook Ads',
        value: '12,323',
        delta: '-10%',
        deltaPositive: false,
        footerLink: 'Go to Content Health',
    },
    {
        id: 'total-searches',
        title: 'Total Searches',
        cadence: 'Week to Date, Facebook Ads',
        value: '134,323',
        delta: '-10%',
        deltaPositive: false,
        footerLink: 'Go to Search Details',
    },
    {
        id: 'total-engaged',
        title: 'Total Engaged Articles',
        cadence: 'Week to Date, Facebook Ads',
        value: '12,235',
        delta: '-10%',
        deltaPositive: false,
        footerLink: 'Go to Engagement Details',
    },
];

export const seedPlatformMetrics = {
    totalEntities: { label: 'Total Knowledge Entities', value: '2,847', trend: 'up', trendValue: '+124 this month' },
    avgFreshness: { label: 'Avg Freshness Score', value: '84%', trend: 'stable', trendValue: 'Holding steady' },
    activeDomains: { label: 'Active Domains', value: '6', trend: 'up', trendValue: '+1 new domain' },
    crossTeamReuse: {
        label: 'Cross-Team Reuse',
        rate: 34,
        trend: 'up',
        trendValue: '+6% this quarter',
        topEntities: [
            { title: 'API Gateway Architecture', reuseCount: 12, domains: ['Engineering', 'Product', 'Billing'] },
            { title: 'SOC 2 Audit Checklist', reuseCount: 9, domains: ['Compliance', 'Engineering', 'Billing'] },
            { title: 'Pricing Model Documentation', reuseCount: 7, domains: ['Billing', 'Product', 'Competitive Intelligence'] },
        ],
    },
};

/**
 * Structural Violations seed data for the Knowledge Health page
 * (Figma frame 612-43216 / 612-70638). Each entry renders as an
 * expandable tile: the collapsed row shows the article title, a
 * "violations" count badge, an "AI Score" badge, a one-line summary,
 * and an "Edit to Resolve" action. Expanding the chevron reveals the
 * per-issue breakdown (`issues`), each with an icon, title, subtitle
 * and two delta metrics (coverage gain + AI confidence gain).
 *
 * `id` doubles as the route id when the user picks "Edit to Resolve"
 * and we hand off to the Review Article (active authoring) experience.
 *
 * Each issue's `tone` selects the leading icon bucket — `warning`
 * renders the amber alert triangle, `list` the metadata list glyph,
 * and `enrich` the enrichment data-graph glyph (Figma 612-70638).
 */
export const seedStructuralViolations = [
    {
        id: 'sv-mfa-reset',
        article: 'Resetting two-factor authentication',
        description:
            'Conflicts with 3 sibling articles — agents return inconsistent reset steps to customers.',
        violations: 14,
        aiScore: '9%',
        issues: [
            {
                id: 'sv-mfa-reset-1',
                tone: 'warning',
                title: 'No answer-first structure',
                subtitle: 'First 2 sentences should state the direct answer in the "Reset request" section.',
                coverageDelta: '+6%',
                confidenceDelta: '+2%',
            },
            {
                id: 'sv-mfa-reset-2',
                tone: 'warning',
                title: 'Conflicting reset steps across siblings',
                subtitle: 'Align the recovery-code flow with the 3 linked authentication articles.',
                coverageDelta: '+4%',
                confidenceDelta: '+3%',
            },
            {
                id: 'sv-mfa-reset-3',
                tone: 'list',
                title: '12 Metadata Suggestions',
                subtitle: 'Add canonical tag, product area and audience to improve retrieval.',
                coverageDelta: '+6%',
                confidenceDelta: '+2%',
            },
            {
                id: 'sv-mfa-reset-4',
                tone: 'enrich',
                title: '3 Enrichment Suggestions',
                subtitle: 'Link related troubleshooting blocks so agents resolve in one pass.',
                coverageDelta: '+5%',
                confidenceDelta: '+2%',
            },
        ],
    },
    {
        id: 'sv-refund-international',
        article: 'Refund policy — international orders',
        description:
            'Missing canonical tag and required compliance label; last full review 187 days ago.',
        violations: 11,
        aiScore: '6%',
        issues: [
            {
                id: 'sv-refund-1',
                tone: 'warning',
                title: 'Missing required compliance label',
                subtitle: 'Apply the regional compliance label before this article can be published.',
                coverageDelta: '+5%',
                confidenceDelta: '+3%',
            },
            {
                id: 'sv-refund-2',
                tone: 'list',
                title: '8 Metadata Suggestions',
                subtitle: 'Add a canonical tag and currency metadata to disambiguate regions.',
                coverageDelta: '+4%',
                confidenceDelta: '+2%',
            },
            {
                id: 'sv-refund-3',
                tone: 'enrich',
                title: '2 Enrichment Suggestions',
                subtitle: 'Surface the international shipping timeline block alongside the policy.',
                coverageDelta: '+3%',
                confidenceDelta: '+1%',
            },
        ],
    },
    {
        id: 'sv-workspace-onboarding',
        article: 'Onboarding a new team workspace',
        description:
            "78% content overlap with 'Workspace setup checklist' — duplicate candidate flagged.",
        violations: 9,
        aiScore: '3%',
        issues: [
            {
                id: 'sv-workspace-1',
                tone: 'warning',
                title: 'Duplicate candidate detected',
                subtitle: '78% content overlap with "Workspace setup checklist" — consider merging.',
                coverageDelta: '+5%',
                confidenceDelta: '+2%',
            },
            {
                id: 'sv-workspace-2',
                tone: 'list',
                title: '6 Metadata Suggestions',
                subtitle: 'Tag the workspace tier and admin role to sharpen search results.',
                coverageDelta: '+3%',
                confidenceDelta: '+2%',
            },
            {
                id: 'sv-workspace-3',
                tone: 'enrich',
                title: '4 Enrichment Suggestions',
                subtitle: 'Add the invite-flow block to complete the onboarding journey.',
                coverageDelta: '+4%',
                confidenceDelta: '+2%',
            },
        ],
    },
    {
        id: 'sv-sso-okta',
        article: 'Configuring SSO with Okta',
        description:
            'Heading hierarchy skips H2 → H4; screenshots reference the legacy admin UI.',
        violations: 8,
        aiScore: '2%',
        issues: [
            {
                id: 'sv-sso-1',
                tone: 'warning',
                title: 'Broken heading hierarchy',
                subtitle: 'Heading levels skip H2 → H4 — agents lose the step structure.',
                coverageDelta: '+4%',
                confidenceDelta: '+2%',
            },
            {
                id: 'sv-sso-2',
                tone: 'list',
                title: '5 Metadata Suggestions',
                subtitle: 'Add identity-provider and protocol tags for precise retrieval.',
                coverageDelta: '+3%',
                confidenceDelta: '+1%',
            },
        ],
    },
    {
        id: 'sv-salesforce-crm-connect',
        article: 'Connecting Salesforce to your CRM',
        description:
            '4 broken external links; instructions reference the deprecated v2 API.',
        violations: 6,
        aiScore: '1%',
        issues: [
            {
                id: 'sv-crm-1',
                tone: 'warning',
                title: '4 broken external links',
                subtitle: 'Instructions reference the deprecated v2 API — update to v3 endpoints.',
                coverageDelta: '+3%',
                confidenceDelta: '+2%',
            },
            {
                id: 'sv-crm-2',
                tone: 'enrich',
                title: '2 Enrichment Suggestions',
                subtitle: 'Link the OAuth setup block so the connection flow is self-contained.',
                coverageDelta: '+2%',
                confidenceDelta: '+1%',
            },
        ],
    },
];

/**
 * Top Quality Issues seed data for the Knowledge Health page
 * (Figma frame 612-71226). Renders below Structural Violations as a
 * stack of issue cards. Each card surfaces an AI-detected quality
 * problem — a `contradiction` (two articles assert conflicting facts)
 * or a `similarity` (two near-duplicate articles that are merge
 * candidates). The two source articles are shown side by side so a
 * steward can compare and act.
 *
 * `variant` drives the available actions: `contradiction` exposes
 * "Ignore Issue"; `similarity` additionally exposes a brand
 * "Merge Articles" action. Each column's `articleId` doubles as the
 * route id when the steward opens the underlying Knowledge Article.
 */
export const seedQualityIssues = [
    {
        id: 'qi-claims-timeframes',
        title: 'Contradictions Claiming Processing Timeframes',
        variant: 'contradiction',
        typeLabel: 'Contradiction',
        confidence: '98%',
        description:
            'The following information has been identified as a contradiction. Both documents discuss the same topic (Settlement and Payout in insurance claims) and specifically mention the Claims Processing Timeframes. Document A (5-10 days) directly contradicts Document B (20-25 days). These timeframes are mutually exclusive and cannot both be true.',
        columns: [
            {
                label: 'Option A',
                articleId: 'qi-claims-a',
                articleTitle: 'Product Care and Warranty Information',
                text: 'The Claims Processing Timeframe mentioned in the text is 5 to 10 days.',
            },
            {
                label: 'Option B',
                articleId: 'qi-claims-b',
                articleTitle: 'Settlement and Payout Guidelines',
                text: 'The Claims Processing Timeframe mentioned in the text is 20 to 25 days.',
            },
        ],
    },
    {
        id: 'qi-warranty-similarity',
        title: 'Similarity in Warranty Claiming process',
        variant: 'similarity',
        typeLabel: 'Similar Article',
        confidence: '98%',
        description:
            'The following articles have been identified as near-duplicates. Both documents describe the warranty claiming process for the same product family with substantially overlapping steps. Consolidating them into a single canonical article reduces drift and keeps agents aligned.',
        columns: [
            {
                label: 'Article 1',
                articleId: 'qi-warranty-1',
                articleTitle: 'Product Care and Warranty Information',
                text: 'Outlines the warranty claim submission steps and required proof of purchase.',
            },
            {
                label: 'Article 2',
                articleId: 'qi-warranty-2',
                articleTitle: 'How to File a Warranty Claim',
                text: 'Describes the same warranty claim submission flow with minor wording differences.',
            },
        ],
    },
    {
        id: 'qi-return-window',
        title: 'Contradiction in Standard Return Window',
        variant: 'contradiction',
        typeLabel: 'Contradiction',
        confidence: '96%',
        description:
            'Both articles state the standard return window for non-defective items but disagree on the duration. The Returns & Exchanges policy allows 30 days from delivery, while the Online Store FAQ promises 45 days. Agents quoting different windows risk eroding customer trust and triggering escalations.',
        columns: [
            {
                label: 'Option A',
                articleId: 'qi-return-a',
                articleTitle: 'Returns & Exchanges Policy',
                text: 'Customers may return unopened, non-defective items within 30 days of delivery for a full refund.',
            },
            {
                label: 'Option B',
                articleId: 'qi-return-b',
                articleTitle: 'Online Store FAQ',
                text: 'You have 45 days from the delivery date to send back any item you are not satisfied with.',
            },
        ],
    },
    {
        id: 'qi-password-reset',
        title: 'Similarity in Password Reset Instructions',
        variant: 'similarity',
        typeLabel: 'Similar Article',
        confidence: '94%',
        description:
            'These two articles walk users through resetting an account password with nearly identical steps and screenshots. Maintaining both creates duplicate update work and lets the versions drift apart. Merge them into one canonical reset guide and redirect the duplicate.',
        columns: [
            {
                label: 'Article 1',
                articleId: 'qi-password-1',
                articleTitle: 'Reset Your Account Password',
                text: 'Step-by-step guide for resetting a forgotten password from the sign-in screen.',
            },
            {
                label: 'Article 2',
                articleId: 'qi-password-2',
                articleTitle: 'How to Change or Recover Your Password',
                text: 'Covers the same email-link recovery flow plus an in-app password change.',
            },
        ],
    },
    {
        id: 'qi-sla-response',
        title: 'Contradiction in Premier Support Response SLA',
        variant: 'contradiction',
        typeLabel: 'Contradiction',
        confidence: '91%',
        description:
            'The two support articles cite different first-response targets for Premier-tier severity-1 cases. The Support Plans overview commits to a 1-hour response, while the Case Severity Definitions guide lists 4 hours. This conflict can lead to missed commitments and SLA breaches on critical incidents.',
        columns: [
            {
                label: 'Option A',
                articleId: 'qi-sla-a',
                articleTitle: 'Premier Support Plans Overview',
                text: 'Severity 1 cases on Premier Support receive a guaranteed first response within 1 hour, 24/7.',
            },
            {
                label: 'Option B',
                articleId: 'qi-sla-b',
                articleTitle: 'Case Severity Definitions',
                text: 'Initial response time for a Severity 1 (Critical) case is 4 hours during the coverage window.',
            },
        ],
    },
];

export const seedActionItems = [
    {
        id: 'action-1',
        category: 'Suggestion',
        icon: 'standard:topic',
        title: 'Unpublished Product Launch Manuals',
        timestamp: 'Created 45 mins ago',
        domain: 'Product Documentation',
        priority: 'high',
        ctaLabel: 'Review Article Drafts',
        highlighted: false,
        tableData: [
            { articleNumber: '001001', articleTitle: 'What are the benefits of modular UPS systems?', views: '14,543', viewers: '12,321', linkedCases: 5, lastModified: '01/09/2025' },
            { articleNumber: '001002', articleTitle: 'Resolving Battery System Discharge Problems', views: '23,456', viewers: '21,123', linkedCases: 7, lastModified: '02/04/2025' },
            { articleNumber: '001003', articleTitle: 'Understanding Common Issues with Electrical Fuses', views: '2,121', viewers: '1,112', linkedCases: 29, lastModified: '02/21/2025' },
            { articleNumber: '001004', articleTitle: 'How do I choose the right solar installer?', views: '1,111', viewers: '876', linkedCases: 15, lastModified: '3/31/2025' },
        ],
    },
    {
        id: 'action-2',
        category: 'Suggestion',
        icon: 'standard:related_list',
        title: 'Disconnected Topics around Roadmap, Technical, Search',
        timestamp: 'Created yesterday',
        domain: 'Search & Discovery',
        priority: null,
        ctaLabel: 'Review Article Drafts',
        highlighted: false,
        tableData: [
            { articleNumber: '002001', articleTitle: 'Roadmap Q3 Feature Rollout Overview', views: '8,231', viewers: '7,012', linkedCases: 9, lastModified: '04/14/2025' },
            { articleNumber: '002002', articleTitle: 'Technical Architecture Diagram for Search Index', views: '5,678', viewers: '4,890', linkedCases: 12, lastModified: '03/27/2025' },
            { articleNumber: '002003', articleTitle: 'Search Ranking Signals Quick Reference', views: '11,420', viewers: '9,765', linkedCases: 18, lastModified: '04/02/2025' },
            { articleNumber: '002004', articleTitle: 'Roadmap-to-Implementation Handoff Guide', views: '3,209', viewers: '2,654', linkedCases: 4, lastModified: '02/18/2025' },
        ],
    },
    {
        id: 'action-3',
        category: 'Suggestion',
        icon: 'standard:topic2',
        title: 'Shallow Content Depth: 7 articles lack sufficient depth for readers to act on',
        timestamp: 'Created 2 hours ago',
        domain: 'Customer Support',
        priority: null,
        ctaLabel: 'Review Article Drafts',
        highlighted: false,
        tableData: [
            { articleNumber: '003001', articleTitle: 'Configuring Single Sign-On', views: '6,234', viewers: '5,021', linkedCases: 22, lastModified: '03/12/2025' },
            { articleNumber: '003002', articleTitle: 'Setting Up MFA for Admin Users', views: '9,887', viewers: '8,432', linkedCases: 31, lastModified: '04/01/2025' },
            { articleNumber: '003003', articleTitle: 'Password Policy Best Practices', views: '4,567', viewers: '3,890', linkedCases: 11, lastModified: '02/25/2025' },
            { articleNumber: '003004', articleTitle: 'Onboarding New Team Members', views: '7,765', viewers: '6,234', linkedCases: 8, lastModified: '03/30/2025' },
            { articleNumber: '003005', articleTitle: 'Resolving Login Errors on Mobile', views: '12,345', viewers: '10,987', linkedCases: 27, lastModified: '04/15/2025' },
            { articleNumber: '003006', articleTitle: 'Configuring Email Notifications', views: '3,876', viewers: '3,201', linkedCases: 6, lastModified: '02/09/2025' },
            { articleNumber: '003007', articleTitle: 'Managing API Tokens Securely', views: '5,432', viewers: '4,765', linkedCases: 14, lastModified: '03/22/2025' },
        ],
    },
    {
        id: 'action-4',
        category: 'Suggestion',
        icon: 'standard:scan_card',
        title: 'Content Refresh required for foundational product guides',
        timestamp: 'Created yesterday',
        domain: 'Onboarding & Setup',
        priority: null,
        ctaLabel: 'Review Article Drafts',
        highlighted: false,
        tableData: [
            { articleNumber: '004001', articleTitle: 'Getting Started with the Platform', views: '28,123', viewers: '24,567', linkedCases: 42, lastModified: '11/15/2024' },
            { articleNumber: '004002', articleTitle: 'Platform Overview and Core Concepts', views: '19,876', viewers: '17,234', linkedCases: 33, lastModified: '09/22/2024' },
            { articleNumber: '004003', articleTitle: 'Installation and Setup Guide', views: '15,432', viewers: '13,876', linkedCases: 25, lastModified: '10/08/2024' },
            { articleNumber: '004004', articleTitle: 'First-Time User Walkthrough', views: '22,109', viewers: '19,654', linkedCases: 19, lastModified: '12/03/2024' },
        ],
    },
    {
        id: 'action-5',
        category: 'Suggestion',
        icon: 'standard:shipment',
        title: '22 Knowledge Blocks created around updated product specs',
        timestamp: 'Created 2 days ago',
        domain: 'API & Developer Docs',
        priority: null,
        ctaLabel: 'Review Article Drafts',
        highlighted: false,
        tableData: [
            { articleNumber: '005001', articleTitle: 'Product Spec Update: Q2 2025 Release', views: '4,321', viewers: '3,765', linkedCases: 7, lastModified: '04/19/2025' },
            { articleNumber: '005002', articleTitle: 'API Endpoint Changes for v3.2', views: '6,789', viewers: '5,876', linkedCases: 14, lastModified: '04/11/2025' },
            { articleNumber: '005003', articleTitle: 'New UI Component Library Reference', views: '3,456', viewers: '2,987', linkedCases: 5, lastModified: '04/05/2025' },
            { articleNumber: '005004', articleTitle: 'Updated Authentication Flow Spec', views: '8,123', viewers: '7,234', linkedCases: 16, lastModified: '04/22/2025' },
        ],
    },
];
