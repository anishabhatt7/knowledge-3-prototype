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
 * (Figma frame 214-32880 / 217-48425). Each entry is a row in the
 * compact violations table; ids double as route ids when the user
 * picks "Edit to Resolve" from the row actions menu and we hand off
 * to the Review Article (active authoring) experience.
 *
 * `aiTone` is the colour bucket for the AI Score cell — `positive`
 * renders the figma green (#2e844a), `warning` renders the amber
 * (#a96504). The Last Updated column uses pre-formatted strings so
 * the prototype stays date-shape agnostic.
 */
export const seedStructuralViolations = [
    {
        id: 'sv-mfa-reset',
        article: 'Resetting two-factor authentication',
        description:
            'Conflicts with 3 sibling articles — agents return inconsistent reset steps to customers.',
        violations: 14,
        aiScore: '− 4%',
        aiTone: 'warning',
        lastUpdated: '03/18/2026',
    },
    {
        id: 'sv-refund-international',
        article: 'Refund policy — international orders',
        description:
            'Missing canonical tag and required compliance label; last full review 187 days ago.',
        violations: 11,
        aiScore: '+ 6%',
        aiTone: 'positive',
        lastUpdated: '02/02/2026',
    },
    {
        id: 'sv-workspace-onboarding',
        article: 'Onboarding a new team workspace',
        description:
            "78% content overlap with 'Workspace setup checklist' — duplicate candidate flagged.",
        violations: 9,
        aiScore: '+ 3%',
        aiTone: 'positive',
        lastUpdated: '04/04/2026',
    },
    {
        id: 'sv-sso-okta',
        article: 'Configuring SSO with Okta',
        description:
            'Heading hierarchy skips H2 → H4; screenshots reference the legacy admin UI.',
        violations: 8,
        aiScore: '− 2%',
        aiTone: 'warning',
        lastUpdated: '01/27/2026',
    },
    {
        id: 'sv-salesforce-crm-connect',
        article: 'Connecting Salesforce to your CRM',
        description:
            '4 broken external links; instructions reference the deprecated v2 API.',
        violations: 6,
        aiScore: '− 1%',
        aiTone: 'warning',
        lastUpdated: '12/11/2025',
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
        ctaLabel: 'Approve Article Drafts',
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
        ctaLabel: 'Approve Article Drafts',
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
        ctaLabel: 'Review Updated Drafts',
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
        ctaLabel: 'Review Block Drafts',
        highlighted: false,
        tableData: [
            { articleNumber: '005001', articleTitle: 'Product Spec Update: Q2 2025 Release', views: '4,321', viewers: '3,765', linkedCases: 7, lastModified: '04/19/2025' },
            { articleNumber: '005002', articleTitle: 'API Endpoint Changes for v3.2', views: '6,789', viewers: '5,876', linkedCases: 14, lastModified: '04/11/2025' },
            { articleNumber: '005003', articleTitle: 'New UI Component Library Reference', views: '3,456', viewers: '2,987', linkedCases: 5, lastModified: '04/05/2025' },
            { articleNumber: '005004', articleTitle: 'Updated Authentication Flow Spec', views: '8,123', viewers: '7,234', linkedCases: 16, lastModified: '04/22/2025' },
        ],
    },
];
