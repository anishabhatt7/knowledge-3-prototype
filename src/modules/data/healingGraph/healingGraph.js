const h = (hours) => Date.now() - hours * 3600000;
const d = (days) => Date.now() - days * 86400000;

export const CAPABILITY_COLORS = {
    C1: '#1e3a5f',
    C2: '#1e40af',
    C4: '#2563eb',
    C5: '#111827',
    C6: '#3b82f6',
    shared: '#1f2937',
};

export const CAPABILITY_LABELS = {
    C1: 'Agents',
    C2: 'Memory',
    C4: 'Routing',
    C5: 'Healing',
    C6: 'Reasoning',
    shared: 'Shared',
};

export const SEVERITY_COLORS = {
    critical: '#dc2626',
    high: '#f59e0b',
    medium: '#f97316',
};

export const HEALING_RING_COLORS = {
    'auto-healed': '#2563eb',
    'pending-review': '#f59e0b',
    escalated: '#ef4444',
    'rolled-back': '#6b7280',
};

export function formatRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export function edgeKey(a, b) {
    return [a, b].sort().join('::');
}

export const seedGraphNodes = [
    { id: 'dom-billing', label: 'Employee Onboarding', type: 'domain', capability: 'shared', size: 20 },
    { id: 'dom-product', label: 'Relocation & Mobility', type: 'domain', capability: 'shared', size: 20 },
    { id: 'dom-compliance', label: 'HR Compliance', type: 'domain', capability: 'shared', size: 20 },
    { id: 'dom-engineering', label: 'Benefits & Payroll', type: 'domain', capability: 'shared', size: 20 },
    { id: 'dom-onboarding', label: 'Travel & Expense', type: 'domain', capability: 'shared', size: 20 },
    { id: 'dom-competitive', label: 'Workplace & Facilities', type: 'domain', capability: 'shared', size: 20 },
    { id: 'agent-billing', label: 'Onboarding Concierge', type: 'agent', capability: 'C1', size: 15 },
    { id: 'agent-product', label: 'Relocation Agent', type: 'agent', capability: 'C1', size: 15 },
    { id: 'agent-compliance', label: 'Compliance Agent', type: 'agent', capability: 'C1', size: 15 },
    { id: 'agent-engineering', label: 'Benefits Agent', type: 'agent', capability: 'C1', size: 15 },
    { id: 'agent-onboarding', label: 'Travel & Expense Agent', type: 'agent', capability: 'C1', size: 15 },
    { id: 'agent-competitive', label: 'Workplace Agent', type: 'agent', capability: 'C1', size: 15 },
    { id: 'dec-001', label: 'Stripe to Internal Billing', type: 'decision', capability: 'C2', size: 10 },
    { id: 'dec-002', label: 'PostgreSQL over MySQL', type: 'decision', capability: 'C2', size: 10 },
    { id: 'dec-003', label: 'SOC 2 Type II Compliance', type: 'decision', capability: 'C2', size: 10 },
    { id: 'dec-004', label: 'Deprecate Legacy Wizard', type: 'decision', capability: 'C2', size: 10 },
    { id: 'dec-005', label: 'React for Dashboard', type: 'decision', capability: 'C2', size: 10 },
    { id: 'dec-006', label: 'REST to GraphQL', type: 'decision', capability: 'C2', size: 10 },
    { id: 'dec-007', label: 'Datadog Observability', type: 'decision', capability: 'C2', size: 10 },
    { id: 'dec-010', label: 'Progressive Disclosure Onboarding', type: 'decision', capability: 'C2', size: 10 },
    { id: 'exp-001', label: 'Sarah Chen', type: 'expert', capability: 'C4', size: 10 },
    { id: 'exp-002', label: 'James Morrison', type: 'expert', capability: 'C4', size: 10 },
    { id: 'exp-003', label: 'Elena Kowalski', type: 'expert', capability: 'C4', size: 10 },
    { id: 'exp-004', label: 'Priya Patel', type: 'expert', capability: 'C4', size: 10 },
    { id: 'exp-005', label: 'Alex Huang', type: 'expert', capability: 'C4', size: 10 },
    { id: 'exp-006', label: 'Marcus Rivera', type: 'expert', capability: 'C4', size: 10 },
    { id: 'exp-007', label: 'Lisa Chang', type: 'expert', capability: 'C4', size: 10 },
    { id: 'exp-008', label: 'Tom Nakamura', type: 'expert', capability: 'C4', size: 10 },
    { id: 'ent-billing-arch', label: 'Billing Architecture Overview', type: 'entity', capability: 'C5', size: 8 },
    { id: 'ent-pricing-model', label: 'Pricing Model Documentation', type: 'entity', capability: 'C5', size: 8 },
    { id: 'ent-refund-policy', label: 'Customer Refund Policy', type: 'entity', capability: 'C5', size: 8 },
    { id: 'ent-billing-faq', label: 'Billing FAQ', type: 'entity', capability: 'C5', size: 8 },
    { id: 'ent-api-gateway', label: 'API Gateway Architecture', type: 'entity', capability: 'C6', size: 8 },
    { id: 'ent-partner-integration', label: 'Partner Integration Guide', type: 'entity', capability: 'C6', size: 8 },
    { id: 'ent-api-rate-limit', label: 'API Rate Limiting Configuration', type: 'entity', capability: 'C5', size: 8 },
    { id: 'ent-soc2-checklist', label: 'SOC 2 Audit Checklist', type: 'entity', capability: 'C5', size: 8 },
    { id: 'ent-security-policy', label: 'Information Security Policy', type: 'entity', capability: 'C5', size: 8 },
    { id: 'ent-gdpr-policy', label: 'GDPR Data Retention Policy', type: 'entity', capability: 'C5', size: 8 },
    { id: 'ent-onboarding-flow', label: 'Customer Onboarding Flow', type: 'entity', capability: 'C6', size: 8 },
    { id: 'ent-dashboard-spec', label: 'Analytics Dashboard v2 Spec', type: 'entity', capability: 'C6', size: 8 },
    { id: 'ent-ci-battlecards', label: 'Acme Analytics Battlecard', type: 'entity', capability: 'C5', size: 8 },
    { id: 'ent-pricing-matrix', label: 'Competitor Pricing Matrix', type: 'entity', capability: 'C5', size: 8 },
    { id: 'ent-deploy-runbook', label: 'Deployment Runbook', type: 'entity', capability: 'C5', size: 8 },
    { id: 'ent-monitoring-arch', label: 'Monitoring Architecture', type: 'entity', capability: 'C6', size: 8 },
    { id: 'ent-db-arch', label: 'Database Architecture', type: 'entity', capability: 'C6', size: 8 },
    { id: 'ent-feature-flags', label: 'Feature Flag Configuration', type: 'entity', capability: 'C5', size: 8 },
    { id: 'ent-wizard-legacy', label: 'Legacy Onboarding Wizard', type: 'entity', capability: 'C5', size: 8 },
    { id: 'ent-design-system', label: 'Design System', type: 'entity', capability: 'C6', size: 8 },
];

export const seedGraphEdges = [
    { source: 'agent-billing', target: 'dom-billing', relationship: 'curates', weight: 9 },
    { source: 'agent-product', target: 'dom-product', relationship: 'curates', weight: 9 },
    { source: 'agent-compliance', target: 'dom-compliance', relationship: 'curates', weight: 9 },
    { source: 'agent-engineering', target: 'dom-engineering', relationship: 'curates', weight: 9 },
    { source: 'agent-onboarding', target: 'dom-onboarding', relationship: 'curates', weight: 9 },
    { source: 'agent-competitive', target: 'dom-competitive', relationship: 'curates', weight: 9 },
    { source: 'agent-billing', target: 'ent-billing-faq', relationship: 'monitors', weight: 7 },
    { source: 'agent-billing', target: 'ent-refund-policy', relationship: 'monitors', weight: 7 },
    { source: 'agent-billing', target: 'ent-pricing-model', relationship: 'monitors', weight: 8 },
    { source: 'agent-engineering', target: 'ent-api-rate-limit', relationship: 'monitors', weight: 7 },
    { source: 'agent-engineering', target: 'ent-deploy-runbook', relationship: 'monitors', weight: 6 },
    { source: 'agent-compliance', target: 'ent-soc2-checklist', relationship: 'monitors', weight: 8 },
    { source: 'agent-compliance', target: 'ent-gdpr-policy', relationship: 'monitors', weight: 8 },
    { source: 'agent-competitive', target: 'ent-ci-battlecards', relationship: 'monitors', weight: 7 },
    { source: 'agent-competitive', target: 'ent-pricing-matrix', relationship: 'monitors', weight: 7 },
    { source: 'agent-onboarding', target: 'ent-onboarding-flow', relationship: 'monitors', weight: 7 },
    { source: 'agent-onboarding', target: 'ent-wizard-legacy', relationship: 'monitors', weight: 5 },
    { source: 'agent-product', target: 'ent-dashboard-spec', relationship: 'monitors', weight: 7 },
    { source: 'dec-001', target: 'dom-billing', relationship: 'decided-by', weight: 8 },
    { source: 'dec-002', target: 'dom-engineering', relationship: 'decided-by', weight: 8 },
    { source: 'dec-003', target: 'dom-compliance', relationship: 'decided-by', weight: 8 },
    { source: 'dec-004', target: 'dom-onboarding', relationship: 'decided-by', weight: 7 },
    { source: 'dec-005', target: 'dom-product', relationship: 'decided-by', weight: 8 },
    { source: 'dec-006', target: 'dom-engineering', relationship: 'decided-by', weight: 8 },
    { source: 'dec-007', target: 'dom-engineering', relationship: 'decided-by', weight: 7 },
    { source: 'dec-010', target: 'dom-onboarding', relationship: 'decided-by', weight: 8 },
    { source: 'dec-001', target: 'dec-003', relationship: 'depends-on', weight: 6 },
    { source: 'dec-006', target: 'dec-002', relationship: 'depends-on', weight: 7 },
    { source: 'dec-005', target: 'dec-006', relationship: 'depends-on', weight: 5 },
    { source: 'dec-010', target: 'dec-004', relationship: 'depends-on', weight: 9 },
    { source: 'dec-007', target: 'dec-002', relationship: 'enables', weight: 5 },
    { source: 'exp-001', target: 'dom-billing', relationship: 'expert-in', weight: 9 },
    { source: 'exp-001', target: 'dom-compliance', relationship: 'expert-in', weight: 5 },
    { source: 'exp-002', target: 'dom-engineering', relationship: 'expert-in', weight: 10 },
    { source: 'exp-002', target: 'dom-product', relationship: 'expert-in', weight: 7 },
    { source: 'exp-003', target: 'dom-compliance', relationship: 'expert-in', weight: 10 },
    { source: 'exp-003', target: 'dom-billing', relationship: 'expert-in', weight: 6 },
    { source: 'exp-004', target: 'dom-product', relationship: 'expert-in', weight: 9 },
    { source: 'exp-004', target: 'dom-onboarding', relationship: 'expert-in', weight: 7 },
    { source: 'exp-005', target: 'dom-engineering', relationship: 'expert-in', weight: 9 },
    { source: 'exp-006', target: 'dom-competitive', relationship: 'expert-in', weight: 9 },
    { source: 'exp-006', target: 'dom-billing', relationship: 'expert-in', weight: 7 },
    { source: 'exp-007', target: 'dom-onboarding', relationship: 'expert-in', weight: 9 },
    { source: 'exp-007', target: 'dom-product', relationship: 'expert-in', weight: 8 },
    { source: 'exp-008', target: 'dom-engineering', relationship: 'expert-in', weight: 8 },
    { source: 'ent-billing-arch', target: 'dom-billing', relationship: 'depends-on', weight: 8 },
    { source: 'ent-pricing-model', target: 'dom-billing', relationship: 'depends-on', weight: 8 },
    { source: 'ent-refund-policy', target: 'dom-billing', relationship: 'depends-on', weight: 7 },
    { source: 'ent-billing-faq', target: 'dom-billing', relationship: 'depends-on', weight: 6 },
    { source: 'ent-api-gateway', target: 'dom-engineering', relationship: 'depends-on', weight: 8 },
    { source: 'ent-partner-integration', target: 'dom-engineering', relationship: 'depends-on', weight: 7 },
    { source: 'ent-api-rate-limit', target: 'dom-engineering', relationship: 'depends-on', weight: 7 },
    { source: 'ent-soc2-checklist', target: 'dom-compliance', relationship: 'depends-on', weight: 9 },
    { source: 'ent-security-policy', target: 'dom-compliance', relationship: 'depends-on', weight: 9 },
    { source: 'ent-gdpr-policy', target: 'dom-compliance', relationship: 'depends-on', weight: 8 },
    { source: 'ent-onboarding-flow', target: 'dom-onboarding', relationship: 'depends-on', weight: 8 },
    { source: 'ent-wizard-legacy', target: 'dom-onboarding', relationship: 'depends-on', weight: 5 },
    { source: 'ent-ci-battlecards', target: 'dom-competitive', relationship: 'depends-on', weight: 8 },
    { source: 'ent-pricing-matrix', target: 'dom-competitive', relationship: 'depends-on', weight: 7 },
    { source: 'ent-dashboard-spec', target: 'dom-product', relationship: 'depends-on', weight: 8 },
    { source: 'ent-design-system', target: 'dom-product', relationship: 'depends-on', weight: 7 },
    { source: 'ent-deploy-runbook', target: 'dom-engineering', relationship: 'depends-on', weight: 7 },
    { source: 'ent-monitoring-arch', target: 'dom-engineering', relationship: 'depends-on', weight: 8 },
    { source: 'ent-db-arch', target: 'dom-engineering', relationship: 'depends-on', weight: 8 },
    { source: 'ent-feature-flags', target: 'dom-product', relationship: 'depends-on', weight: 6 },
    { source: 'dec-001', target: 'ent-billing-arch', relationship: 'reasons-over', weight: 8 },
    { source: 'dec-001', target: 'ent-pricing-model', relationship: 'reasons-over', weight: 7 },
    { source: 'dec-002', target: 'ent-db-arch', relationship: 'reasons-over', weight: 9 },
    { source: 'dec-003', target: 'ent-soc2-checklist', relationship: 'reasons-over', weight: 9 },
    { source: 'dec-003', target: 'ent-security-policy', relationship: 'reasons-over', weight: 8 },
    { source: 'dec-005', target: 'ent-dashboard-spec', relationship: 'reasons-over', weight: 8 },
    { source: 'dec-005', target: 'ent-design-system', relationship: 'reasons-over', weight: 7 },
    { source: 'dec-006', target: 'ent-api-gateway', relationship: 'reasons-over', weight: 9 },
    { source: 'dec-006', target: 'ent-partner-integration', relationship: 'reasons-over', weight: 8 },
    { source: 'dec-007', target: 'ent-monitoring-arch', relationship: 'reasons-over', weight: 8 },
    { source: 'dec-010', target: 'ent-onboarding-flow', relationship: 'reasons-over', weight: 9 },
    { source: 'dec-010', target: 'ent-feature-flags', relationship: 'reasons-over', weight: 6 },
    { source: 'ent-api-rate-limit', target: 'ent-partner-integration', relationship: 'conflicts-with', weight: 8 },
    { source: 'ent-refund-policy', target: 'ent-billing-faq', relationship: 'conflicts-with', weight: 7 },
    { source: 'ent-soc2-checklist', target: 'ent-security-policy', relationship: 'conflicts-with', weight: 9 },
    { source: 'ent-ci-battlecards', target: 'ent-pricing-matrix', relationship: 'conflicts-with', weight: 6 },
    { source: 'ent-onboarding-flow', target: 'ent-pricing-model', relationship: 'conflicts-with', weight: 5 },
    { source: 'ent-dashboard-spec', target: 'ent-api-gateway', relationship: 'conflicts-with', weight: 4 },
    { source: 'ent-feature-flags', target: 'ent-onboarding-flow', relationship: 'enables', weight: 7 },
    { source: 'ent-db-arch', target: 'ent-api-gateway', relationship: 'enables', weight: 6 },
    { source: 'ent-monitoring-arch', target: 'ent-deploy-runbook', relationship: 'enables', weight: 7 },
    { source: 'ent-design-system', target: 'ent-dashboard-spec', relationship: 'enables', weight: 8 },
    { source: 'ent-billing-arch', target: 'ent-refund-policy', relationship: 'enables', weight: 6 },
    { source: 'ent-security-policy', target: 'ent-gdpr-policy', relationship: 'enables', weight: 7 },
];

export const seedHealthDomains = [
    { domain: 'Employee Onboarding', healthScore: 92, freshnessScore: 91, contradictionCount: 3, orphanCount: 2, totalEntities: 156, freshnessSLA: '7 days', slaBreaches: 1 },
    { domain: 'Relocation & Mobility', healthScore: 87, freshnessScore: 83, contradictionCount: 5, orphanCount: 4, totalEntities: 203, freshnessSLA: '14 days', slaBreaches: 3 },
    { domain: 'HR Compliance', healthScore: 78, freshnessScore: 69, contradictionCount: 7, orphanCount: 6, totalEntities: 98, freshnessSLA: '30 days', slaBreaches: 5 },
    { domain: 'Benefits & Payroll', healthScore: 85, freshnessScore: 85, contradictionCount: 4, orphanCount: 8, totalEntities: 312, freshnessSLA: '7 days', slaBreaches: 4 },
    { domain: 'Travel & Expense', healthScore: 71, freshnessScore: 62, contradictionCount: 6, orphanCount: 11, totalEntities: 87, freshnessSLA: '14 days', slaBreaches: 7 },
    { domain: 'Workplace & Facilities', healthScore: 65, freshnessScore: 57, contradictionCount: 9, orphanCount: 14, totalEntities: 134, freshnessSLA: '7 days', slaBreaches: 12 },
];

export const seedContradictions = [
    { id: 'contra-001', entityA: { id: 'ent-api-rate-limit', title: 'API Rate Limiting Configuration', claim: 'API rate limit is 1000 requests per minute for all tiers.' }, entityB: { id: 'ent-partner-integration', title: 'Partner Integration Guide', claim: 'API rate limit is 500 requests per minute for standard tier partners.' }, domain: 'Benefits & Payroll', severity: 'critical', detectedAt: h(6), channel: 'Docs', knowledgeSource: 'Agent-generated', userType: 'Employee', language: 'English', suggestedResolutions: [
        { articleTitle: 'Partner Integration Guide', text: 'Update the Partner Integration Guide to reflect current rate limits: 1000/min standard, 5000/min enterprise.' },
        { articleTitle: 'API Rate Limiting Configuration', text: 'Add tier-specific language to the API Rate Limiting Configuration to clarify that 1000/min applies to standard tier.' },
    ], status: 'open' },
    { id: 'contra-002', entityA: { id: 'ent-refund-policy', title: 'Customer Refund Policy', claim: 'Refunds are processed within 5-7 business days.' }, entityB: { id: 'ent-billing-faq', title: 'Billing FAQ', claim: 'Refunds are processed within 3-5 business days.' }, domain: 'Employee Onboarding', severity: 'high', detectedAt: h(12), channel: 'Cases', knowledgeSource: 'Human-authored', userType: 'Employee', language: 'English', suggestedResolutions: [
        { articleTitle: 'Billing FAQ', text: 'Update the Billing FAQ refund timeline from 3-5 days to 5-7 business days to match the official refund policy after payment processor migration.' },
    ], status: 'open' },
    { id: 'contra-003', entityA: { id: 'ent-onboarding-flow', title: 'Customer Onboarding Flow', claim: 'New accounts receive a 14-day free trial.' }, entityB: { id: 'ent-pricing-model', title: 'Pricing Model Documentation', claim: 'New accounts receive a 30-day free trial on all plans.' }, domain: 'Travel & Expense', severity: 'high', detectedAt: d(1), channel: 'Slack', knowledgeSource: 'Imported', userType: 'Manager', language: 'Spanish', suggestedResolutions: [
        { articleTitle: 'Pricing Model Documentation', text: 'Update Pricing Model Documentation to reflect the 14-day trial period per decision dec-001 (cost reduction initiative).' },
    ], status: 'open' },
    { id: 'contra-004', entityA: { id: 'ent-soc2-checklist', title: 'SOC 2 Type II Audit Checklist', claim: 'Access reviews must be conducted quarterly.' }, entityB: { id: 'ent-security-policy', title: 'Information Security Policy', claim: 'Access reviews are conducted semi-annually.' }, domain: 'HR Compliance', severity: 'critical', detectedAt: h(24), channel: 'Policy', knowledgeSource: 'Human-authored', userType: 'HR Admin', language: 'English', suggestedResolutions: [
        { articleTitle: 'Information Security Policy', text: 'Update the Information Security Policy to require quarterly access reviews, aligning with SOC 2 Type II control CC6.1.' },
        { articleTitle: 'SOC 2 Type II Audit Checklist', text: 'Add cross-reference to the updated security policy confirming quarterly cadence.' },
    ], status: 'open' },
    { id: 'contra-005', entityA: { id: 'ent-ci-battlecards', title: 'Acme Analytics Battlecard', claim: 'Acme Analytics does not support SSO integration.' }, entityB: { id: 'ent-pricing-matrix', title: 'Competitor Pricing Matrix Q1 2026', claim: 'Acme Analytics launched SSO support in their Enterprise tier in February 2026.' }, domain: 'Workplace & Facilities', severity: 'high', detectedAt: d(2), channel: 'Docs', knowledgeSource: 'Agent-generated', userType: 'Employee', language: 'French', suggestedResolutions: [
        { articleTitle: 'Acme Analytics Battlecard', text: 'Remove SSO weakness claim and reposition competitive messaging around broader integration ecosystem and custom SAML configurations.' },
        { articleTitle: 'Competitor Pricing Matrix Q1 2026', text: 'Add note that SSO is now Enterprise-tier only to clarify positioning against our all-tier SSO support.' },
    ], status: 'open' },
    { id: 'contra-006', entityA: { id: 'ent-dashboard-spec', title: 'Analytics Dashboard v2 Spec', claim: 'Dashboard uses REST API endpoints for data fetching.' }, entityB: { id: 'ent-api-gateway', title: 'API Gateway Architecture', claim: 'All new frontend clients must use the GraphQL gateway.' }, domain: 'Relocation & Mobility', severity: 'medium', detectedAt: d(3), channel: 'Email', knowledgeSource: 'Auto-healed', userType: 'Contractor', language: 'German', suggestedResolutions: [
        { articleTitle: 'Analytics Dashboard v2 Spec', text: 'Update the spec to use GraphQL gateway endpoints once the migration decision (dec-006) is finalized.' },
    ], status: 'open' },
];

export const seedHealingActions = [
    { id: 'heal-001', issueType: 'stale', entityTitle: 'Deployment Runbook v4.2', entityId: 'ent-deploy-runbook', domain: 'Benefits & Payroll', description: 'Updated Kubernetes deployment steps to reflect migration from Helm 2 to Helm 3.', before: 'Run `helm install --name myapp ./chart` to deploy the application to the staging cluster.', after: 'Run `helm install myapp ./chart --namespace staging` to deploy the application. Note: Helm 3 removed the --name flag; the release name is now a positional argument.', triggerSource: 'Freshness SLA breach (last updated 45 days ago)', actionType: 'auto-healed', timestamp: h(2), cascadeChain: { triggered: ['heal-004'] } },
    { id: 'heal-002', issueType: 'contradiction', entityTitle: 'Billing FAQ', entityId: 'ent-billing-faq', domain: 'Employee Onboarding', description: 'Corrected refund processing timeline to match official refund policy.', before: 'Refunds are typically processed within 3-5 business days after approval.', after: 'Refunds are typically processed within 5-7 business days after approval. Processing times were updated in January 2026 following our payment processor migration.', triggerSource: 'Contradiction detection (contra-002)', actionType: 'pending-review', timestamp: h(4) },
    { id: 'heal-003', issueType: 'broken-link', entityTitle: 'New Hire Technical Setup Guide', entityId: 'ent-setup-guide', domain: 'Travel & Expense', description: 'Fixed broken link to VPN configuration portal after infrastructure domain change.', before: 'Configure your VPN by visiting https://vpn.oldcorp.internal/setup and following the wizard.', after: 'Configure your VPN by visiting https://vpn.acmecorp.io/setup and following the setup guide.', triggerSource: 'Broken link scanner (weekly sweep)', actionType: 'auto-healed', timestamp: h(8) },
    { id: 'heal-004', issueType: 'factual-error', entityTitle: 'Partner Integration Guide', entityId: 'ent-partner-integration', domain: 'Benefits & Payroll', description: 'Updated API rate limit values after configuration change.', before: 'Standard tier partners are limited to 500 requests per minute. Contact support for higher limits.', after: 'Standard tier partners are limited to 1,000 requests per minute. Enterprise tier partners have a 5,000 requests per minute limit. Contact your account manager for custom rate limits.', triggerSource: 'Contradiction detection (contra-001)', actionType: 'pending-review', timestamp: h(6), cascadeChain: { triggeredBy: 'heal-001' } },
    { id: 'heal-005', issueType: 'stale', entityTitle: 'Competitive Landscape Overview', entityId: 'ent-competitive-overview', domain: 'Workplace & Facilities', description: 'Flagged for manual review — three new competitors identified in enterprise analytics space.', before: 'The enterprise analytics market includes DataPrime, Analytica, and MetricFlow as primary competitors.', after: 'The enterprise analytics market includes DataPrime, Analytica, MetricFlow, Acme Analytics (entered Jan 2026), InsightHub (entered Feb 2026), and ChartStack (entered Mar 2026) as primary competitors.', triggerSource: 'Agent monitoring (agent-competitive)', actionType: 'escalated', timestamp: d(1) },
    { id: 'heal-006', issueType: 'orphan', entityTitle: 'Legacy Webhook Configuration', entityId: 'ent-legacy-webhooks', domain: 'Benefits & Payroll', description: 'Detected orphaned article with no inbound links and referencing deprecated v1 API.', before: 'Configure webhooks using the v1 REST API endpoint: POST /api/v1/webhooks/register', after: '[DEPRECATED] This article references the legacy v1 API. For current webhook configuration, see the GraphQL Subscriptions Guide (ent-graphql-subs). Migration deadline: Q4 2026.', triggerSource: 'Orphan detection scan', actionType: 'auto-healed', timestamp: h(18) },
    { id: 'heal-007', issueType: 'contradiction', entityTitle: 'Information Security Policy', entityId: 'ent-security-policy', domain: 'HR Compliance', description: 'Escalated access review cadence conflict to compliance team for resolution.', before: 'Access reviews for all production systems shall be conducted on a semi-annual basis.', after: 'Access reviews for all production systems shall be conducted on a quarterly basis, in alignment with SOC 2 Type II control CC6.1 requirements.', triggerSource: 'Contradiction detection (contra-004)', actionType: 'escalated', timestamp: h(24), reviewedBy: 'Elena Kowalski', cascadeChain: { triggeredBy: 'heal-010', triggered: ['heal-002'] } },
    { id: 'heal-008', issueType: 'stale', entityTitle: 'Customer Onboarding Wizard Guide', entityId: 'ent-wizard-legacy', domain: 'Travel & Expense', description: 'Marked legacy wizard documentation as deprecated with redirect to new flow.', before: 'The onboarding wizard guides new customers through a 5-step setup process. Click "Start Wizard" to begin.', after: '[DEPRECATED] The onboarding wizard has been replaced by the progressive disclosure setup flow. See "Progressive Onboarding Guide" for the current experience. Legacy wizard will be fully retired in Q3 2026.', triggerSource: 'Decision reference (dec-004, dec-010)', actionType: 'auto-healed', timestamp: d(2) },
    { id: 'heal-009', issueType: 'factual-error', entityTitle: 'Acme Analytics Battlecard', entityId: 'ent-ci-battlecards', domain: 'Workplace & Facilities', description: 'Updated SSO capability status after competitor product launch.', before: 'Weakness: Acme Analytics does not offer SSO integration, which is a dealbreaker for enterprise buyers.', after: 'Note: Acme Analytics launched SSO support in their Enterprise tier (February 2026). Reposition competitive messaging around our broader integration ecosystem and custom SAML configurations.', triggerSource: 'Contradiction detection (contra-005)', actionType: 'pending-review', timestamp: d(2) },
    { id: 'heal-010', issueType: 'stale', entityTitle: 'SOC 2 Type II Audit Checklist', entityId: 'ent-soc2-checklist', domain: 'HR Compliance', description: 'Flagged checklist as potentially stale — last comprehensive review was 90 days ago.', before: 'Last reviewed: January 5, 2026. Next review scheduled: April 5, 2026.', after: 'Last reviewed: January 5, 2026. OVERDUE: Review was due April 5, 2026. Assigned to Elena Kowalski for immediate review and update.', triggerSource: 'Freshness SLA breach (90-day review cycle)', actionType: 'escalated', timestamp: h(12), reviewedBy: 'Elena Kowalski', cascadeChain: { triggered: ['heal-007'] } },
];

// ── Knowledge Health dashboard ──────────────────────────────────────
// Domain ↔ curating-agent pairs. Names are kept in sync with the graph
// view (seedGraphNodes domain + agent labels) so both views read the same.
export const seedDomainAgents = [
    { id: 'da-onboarding', domain: 'Employee Onboarding', agent: 'Onboarding Concierge' },
    { id: 'da-relocation', domain: 'Relocation & Mobility', agent: 'Relocation Agent' },
    { id: 'da-benefits', domain: 'Benefits & Payroll', agent: 'Benefits Agent' },
    { id: 'da-compliance', domain: 'HR Compliance', agent: 'Compliance Agent' },
    { id: 'da-travel', domain: 'Travel & Expense', agent: 'Travel & Expense Agent' },
    { id: 'da-workplace', domain: 'Workplace & Facilities', agent: 'Workplace Agent' },
];

/**
 * Builds a randomized-but-realistic health snapshot for the dashboard.
 * Each card gets four sub-metrics (accuracy, metadata, compliance,
 * structure/clarity); overall health is their mean. Trend is computed
 * relative to the mean overall health across all domains so the
 * "trending above/below average" copy is always self-consistent.
 */
export function buildDomainHealthSnapshot() {
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const cards = seedDomainAgents.map((d) => {
        const accuracy = rand(72, 98);
        const metadata = rand(66, 97);
        const compliance = rand(70, 99);
        const structure = rand(64, 96);
        const overall = Math.round((accuracy + metadata + compliance + structure) / 4);
        const hitl = rand(3, 38);
        return { ...d, accuracy, metadata, compliance, structure, overall, hitl };
    });
    const avg = cards.reduce((sum, c) => sum + c.overall, 0) / cards.length;
    return cards.map((c) => {
        let trend = 'around average';
        if (c.overall >= avg + 3) trend = 'above average';
        else if (c.overall <= avg - 3) trend = 'below average';
        return { ...c, trend };
    });
}

// ── Active Quality Issues (dashboard) ───────────────────────────────
// Two issue families surfaced by the agents: `contradiction` (two
// articles assert mutually-exclusive facts → the user picks the
// correct source) and `similarity` (two near-duplicate articles →
// the user merges or archives one). Themed around the employee /
// relocation / HR knowledge domains. Each article carries an id +
// title so it can be opened as a brand-new knowledge record in a tab.
export const seedQualityIssues = [
    {
        id: 'qi-001',
        domain: 'Relocation & Mobility',
        type: 'contradiction',
        confidence: 98,
        priority: 'Critical',
        title: 'Conflicting Relocation Reimbursement Windows',
        description: 'The following information has been identified as a contradiction. Both documents describe the relocation expense reimbursement window for the same relocation program, but the submission deadlines are mutually exclusive — 30 days versus 90 days. Only one timeframe can be correct.',
        itemA: { articleId: 'kr-domestic-relo', articleTitle: 'Domestic Relocation Policy', text: 'Relocation expenses must be submitted within 30 days of the move date.' },
        itemB: { articleId: 'kr-global-mobility', articleTitle: 'Global Mobility Handbook', text: 'Relocation expenses must be submitted within 90 days of the move date.' },
    },
    {
        id: 'qi-002',
        domain: 'Employee Onboarding',
        type: 'similarity',
        confidence: 96,
        priority: 'High',
        title: 'Duplicate New Hire IT Setup Guides',
        description: 'These two articles have been identified as near-duplicates. Both walk a new employee through provisioning their laptop, email, and VPN access on day one, with substantially overlapping steps. Consider merging them into a single source of truth to reduce redundancy.',
        itemA: { articleId: 'kr-it-setup', articleTitle: 'New Hire IT Setup Guide', text: 'Steps to provision a laptop, corporate email, and VPN access for new employees.' },
        itemB: { articleId: 'kr-day-one-equip', articleTitle: 'Day-One Equipment Provisioning', text: 'How to set up a laptop, email account, and VPN for first-day employees.' },
    },
    {
        id: 'qi-003',
        domain: 'Benefits & Payroll',
        type: 'contradiction',
        confidence: 94,
        priority: 'Critical',
        title: 'Conflicting 401(k) Match Percentages',
        description: 'The following information has been identified as a contradiction. Both documents state the employer 401(k) match, but the formulas disagree — 50% up to 6% of salary versus 100% up to 4% of salary. Employees cannot rely on two different match rules.',
        itemA: { articleId: 'kr-benefits-summary', articleTitle: '2026 Benefits Summary', text: 'The company matches 50% of contributions up to 6% of eligible salary.' },
        itemB: { articleId: 'kr-payroll-faq', articleTitle: 'Payroll FAQ', text: 'The company matches 100% of contributions up to 4% of eligible salary.' },
    },
    {
        id: 'qi-004',
        domain: 'Travel & Expense',
        type: 'similarity',
        confidence: 92,
        priority: 'Medium',
        title: 'Overlapping Per Diem Articles',
        description: 'These two articles have been identified as near-duplicates. Both describe the daily meal allowance for domestic business travel and quote the same $75 figure. Merging them will keep the per diem rate consistent across the knowledge base.',
        itemA: { articleId: 'kr-perdiem-rates', articleTitle: 'Domestic Travel Per Diem Rates', text: 'The daily meal allowance for domestic business travel is $75.' },
        itemB: { articleId: 'kr-meal-allowance', articleTitle: 'Business Travel Meal Allowance', text: 'Employees receive a $75 daily meal allowance when traveling domestically.' },
    },
    {
        id: 'qi-005',
        domain: 'HR Compliance',
        type: 'contradiction',
        confidence: 91,
        priority: 'High',
        title: 'Conflicting Background Check Retention Periods',
        description: 'The following information has been identified as a contradiction. Both documents govern how long background check records are kept, but one mandates a 5-year retention while the other requires purging after 2 years. These retention rules cannot both be enforced.',
        itemA: { articleId: 'kr-bgcheck-policy', articleTitle: 'Background Check Policy', text: 'Background check records are retained for 5 years after the hire date.' },
        itemB: { articleId: 'kr-data-retention', articleTitle: 'Data Retention Standard', text: 'Background check records must be purged 2 years after the hire date.' },
    },
    {
        id: 'qi-006',
        domain: 'Workplace & Facilities',
        type: 'similarity',
        confidence: 89,
        priority: 'Low',
        title: 'Redundant Desk Booking Guides',
        description: 'These two articles have been identified as near-duplicates. Both explain how to reserve a desk through the workplace app with the same two-week booking horizon. Consolidating them avoids conflicting instructions for employees.',
        itemA: { articleId: 'kr-reserve-desk', articleTitle: 'How to Reserve a Desk', text: 'Use the workplace app to book a desk up to 14 days in advance.' },
        itemB: { articleId: 'kr-hotdesk-guide', articleTitle: 'Hot Desk Reservation Guide', text: 'Reserve a hot desk via the workplace app, up to two weeks ahead.' },
    },
    {
        id: 'qi-007',
        domain: 'Employee Onboarding',
        type: 'contradiction',
        confidence: 90,
        priority: 'High',
        title: 'Conflicting Probation Period Lengths',
        description: 'The following information has been identified as a contradiction. Both documents define the new-hire probation period, but one states 60 days while the other states 90 days. The two durations are mutually exclusive for the same employee population.',
        itemA: { articleId: 'kr-onboarding-checklist', articleTitle: 'Onboarding Checklist', text: 'New employees complete a 60-day probation period.' },
        itemB: { articleId: 'kr-employee-handbook', articleTitle: 'Employee Handbook', text: 'All new hires are subject to a 90-day probation period.' },
    },
    {
        id: 'qi-008',
        domain: 'Relocation & Mobility',
        type: 'similarity',
        confidence: 88,
        priority: 'Medium',
        title: 'Duplicate Temporary Housing Policies',
        description: 'These two articles have been identified as near-duplicates. Both state that relocating employees are eligible for up to 60 days of temporary housing, with nearly identical wording. Merge them into one canonical policy.',
        itemA: { articleId: 'kr-temp-housing', articleTitle: 'Temporary Housing Allowance', text: 'Relocating employees are eligible for up to 60 days of temporary housing.' },
        itemB: { articleId: 'kr-interim-housing', articleTitle: 'Interim Accommodation Policy', text: 'Employees on relocation may receive up to 60 days of interim housing.' },
    },
];
