/**
 * Static article + knowledge-agent data for the DVS Review Article app.
 *
 * Mirrors the article editor + Authoring Agent loop from the React
 * Knowledge Builder app: blocks, chat-driven suggestions, apply actions,
 * article health score, smart suggests. No backend — everything is local.
 */

function uid(prefix = 'id') {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

// ─── Tags shown as resource chips under the article title ───────────
export const recordType = { id: 'faq', label: 'FAQ' };

export const dataCategories = [
    { id: 'passenger', label: 'Passenger experience' },
    { id: 'baggage', label: 'Baggage allowance' },
    { id: 'carryon', label: 'Carry-on baggage' },
];

export const audiences = [
    { id: 'internal', label: 'Internal Users' },
    { id: 'community', label: 'Community Users' },
];

// ─── Article blocks ─────────────────────────────────────────────────
export const initialArticle = {
    id: 'article-baggage-allowance',
    title: 'Avoid Extra Fees: Know Your Baggage Allowance',
    status: 'draft',
    updatedAt: Date.now(),
    blockData: [
        {
            id: 'b-video-1',
            type: 'video',
            title: 'Video Explainer: Know your Baggage allowance',
            content:
                'A short explainer showing how checked, carry-on, and oversized baggage fees are calculated across major carriers.',
            thumbnail: null,
        },
        {
            id: 'b-h2-1',
            type: 'h2',
            content: 'Why Baggage Allowance Matters',
        },
        {
            id: 'b-p-1',
            type: 'p',
            content:
                'Airlines set strict limits on both the weight and size of checked and carry-on luggage. These rules are designed to ensure safety, efficiency, and fairness for all passengers. Exceeding these limits can result in hefty fees, which vary by airline and route. For example, budget carriers like Ryanair and easyJet may charge roughly 10 to 12 euros per extra kilogram at the airport, while premium carriers can charge significantly more for overweight bags. These charges can turn a budget trip into an expensive ordeal if not managed carefully.',
        },
        {
            id: 'b-p-2',
            type: 'p',
            content:
                'Baggage policies also differ based on fare type, travel class, and loyalty status. Economy fares often have lower allowances than business or premium economy, and some airlines offer more generous limits for frequent flyers or higher-tier members. Always check your specific allowance before packing to avoid surprises.',
        },
        {
            id: 'b-image-1',
            type: 'image',
            content: '',
            caption: 'How to measure your bags properly — check airline requirements before you pack.',
        },
        {
            id: 'b-h2-2',
            type: 'h2',
            content: 'Measuring Your Bags',
        },
        {
            id: 'b-li-1',
            type: 'li',
            content:
                'Carry-on sample size: 22 x 14 x 9 in (56 x 35 x 23 cm) is a common airline limit.',
        },
        {
            id: 'b-li-2',
            type: 'li',
            content:
                'Checked bag combined dimensions usually must be under 158 cm (length + width + height).',
        },
        {
            id: 'b-li-3',
            type: 'li',
            content: 'Measure everything that sticks out — wheels, handles, external pockets all count.',
        },
        {
            id: 'b-h2-3',
            type: 'h2',
            content: 'Need More Help?',
        },
        {
            id: 'b-p-3',
            type: 'p',
            content:
                'If you are unsure about your allowance or have special items such as sports equipment, musical instruments, or mobility aids, contact your airline directly before your trip. Most carriers have dedicated pages for special baggage requests.',
        },
        {
            id: 'b-contact-h',
            type: 'h3',
            content: 'Contact Support',
            syncGroupId: 'kb-contact',
        },
        {
            id: 'b-contact-p',
            type: 'p',
            content:
                'If your baggage was damaged, delayed, or lost during transit, please contact our support team within 7 days of arrival. Include your booking reference and baggage tag number for faster resolution.',
            syncGroupId: 'kb-contact',
        },
        {
            id: 'b-terms-h',
            type: 'h3',
            content: 'Terms and Conditions',
            syncGroupId: 'kb-terms',
        },
        {
            id: 'b-terms-p',
            type: 'p',
            content:
                'Baggage allowances, including size, weight, and number of bags, vary by airline, route, and fare class. Passengers are responsible for confirming their specific baggage policies with their airline before travel. Airlines may charge additional fees for overweight, oversized, or excess bags, and such fees are subject to change without prior notice. Pre-purchasing extra baggage allowance online is often cheaper than paying at the airport. This article is for informational purposes only and does not guarantee fee waivers or airline policy compliance.',
            syncGroupId: 'kb-terms',
        },
    ],
    tags: ['Baggage', 'Fees', 'Travel policy'],
    summary:
        'Passenger-facing FAQ explaining weight and size limits, fee ranges, and how to measure your bags before arriving at the airport.',
};

// ─── Inline AI Suggestions (Grammarly-style) ────────────────────────
// Each suggestion targets a specific block by id and a substring of its
// content. When the article body renders, matching substrings are wrapped
// with a wavy underline; hovering reveals a popover with the issue type,
// the proposed rewrite, a substantive explanation, and Accept / Dismiss
// controls.
//
// Suggestions span phrase- to sentence-level rewrites (not just
// individual words), and explanations describe the issue with the
// original, why it matters in customer-facing knowledge copy, and how
// the rewrite addresses it.
//
// Supported `type` values (drive the underline color + popover accent):
//   spelling     — red wavy
//   grammar      — amber wavy
//   readability  — blue wavy
//   tone         — purple wavy
//   addition     — green; proposes NEW content rather than a rewrite.
//
// Rewrite types (spelling/grammar/readability/tone) use `original` +
// `replacement`: the matched text is swapped on accept. `addition` types
// instead use `original` (an existing anchor phrase to underline) + a new
// `addition` field: on accept the addition is inserted right after the
// anchor, leaving the original text intact.
export const inlineAISuggestions = [
    {
        id: 'sg-1',
        blockId: 'b-p-1',
        original: 'easyJet',
        replacement: 'EasyJet',
        type: 'spelling',
        label: 'Spelling',
        explanation:
            'The airline\u2019s official brand mark is "EasyJet" with a leading capital, so the lowercase "easyJet" can read as a typo and breaks consistency with "Ryanair" in the same sentence. It can also weaken search and translation tools that key off proper nouns.',
    },
    {
        id: 'sg-2',
        blockId: 'b-p-1',
        original: 'Exceeding these limits can result in hefty fees, which vary by airline and route.',
        replacement: 'Going over these limits can lead to significant fees that differ between airlines and routes.',
        type: 'tone',
        label: 'Tone',
        explanation:
            '"Exceeding these limits can result in hefty fees" reads as formal-yet-alarmist for a customer-facing FAQ. "Going over these limits" is plainer and more inviting, and "significant" replaces the colloquial "hefty" without softening the warning.',
    },
    {
        id: 'sg-3',
        blockId: 'b-p-1',
        original: 'These charges can turn a budget trip into an expensive ordeal if not managed carefully.',
        replacement: 'Without careful planning, these charges can quickly turn an affordable trip into a costly one.',
        type: 'readability',
        label: 'Readability',
        explanation:
            'The original buries its key condition — "if not managed carefully" — at the end, so leading with "Without careful planning," tells readers up front what to do. It also swaps the dramatic "expensive ordeal" for the calmer "costly," which better fits a knowledge article.',
    },
    {
        id: 'sg-4',
        blockId: 'b-p-2',
        original: 'Baggage policies also differ based on fare type, travel class, and loyalty status.',
        replacement: 'Baggage policies also vary by fare type, travel class, and loyalty status.',
        type: 'grammar',
        label: 'Grammar & flow',
        explanation:
            '"Differ based on" reads awkwardly before a three-item list and makes readers untangle an extra step. "Vary by" is the standard idiom here and matches phrasing used elsewhere in the article, keeping the voice consistent.',
    },
    {
        id: 'sg-5',
        blockId: 'b-li-3',
        original: 'Measure everything that sticks out — wheels, handles, external pockets all count.',
        replacement: 'Include every external feature when you measure — wheels, handles, and outer pockets all add to the bag\u2019s total dimensions.',
        type: 'readability',
        label: 'Word choice',
        explanation:
            '"Sticks out" is colloquial and imprecise for an instructional bullet, so the rewrite makes the action explicit and restores the Oxford comma. It also ends with the concrete reason this matters, so the bullet doubles as a quick explanation.',
    },
    {
        id: 'sg-6',
        blockId: 'b-p-3',
        original: 'If you are unsure about your allowance or have special items such as sports equipment, musical instruments, or mobility aids, contact your airline directly before your trip.',
        replacement: 'If you\u2019re unsure about your allowance, or you\u2019re traveling with specialty items like sports equipment, musical instruments, or mobility aids, reach out to your airline before traveling.',
        type: 'readability',
        label: 'Tone & conciseness',
        explanation:
            'The original is a single 35-word clause with two conditions glued together by "or", which is hard to read on a phone. The rewrite splits the conditions with a clear comma break and swaps the bureaucratic wording for the warmer "If you\u2019re" and "reach out to your airline".',
    },
    {
        id: 'sg-7',
        blockId: 'b-p-1',
        original: 'premium carriers can charge significantly more for overweight bags',
        addition:
            'Some carriers also apply a separate oversized-item fee on top of the overweight charge, so a single bag can trigger two fees at once.',
        type: 'addition',
        label: 'Add missing detail',
        explanation:
            'The paragraph explains overweight fees but never notes that oversized and overweight charges can stack — a frequent source of customer confusion. Adding this point right after the fee example lets readers know a single bag can trigger two fees.',
    },
    {
        id: 'sg-8',
        blockId: 'b-p-2',
        original: 'Always check your specific allowance before packing to avoid surprises.',
        addition:
            'If you\u2019re flying on a codeshare or partner airline, confirm that carrier\u2019s policy too — baggage rules usually follow the operating airline, not the one you booked with.',
        type: 'addition',
        label: 'Add missing detail',
        explanation:
            'Codeshare and partner-operated flights are a common edge case the article doesn\u2019t cover, since travelers often assume the booking airline\u2019s allowance applies. Inserting this note after the existing guidance pre-empts a whole class of baggage-fee disputes.',
    },
];

// ─── Article Health Score shown in the left panel ───────────────────
// ─── Article RAG/AI Score (left panel) ─────────────────────────────
// New shape per Figma 125:67812. Replaces the prior "Article Health Score"
// model (donut + cases averted + delta) with an Article RAG/AI Score view:
// a red donut for a poor score plus an "Overall Performance" row with a
// badge + reason note. `casesAverted`/`delta` are retained on the model
// for compatibility but no longer rendered in V2.
export const articleHealth = {
    score: 48,
    delta: 8,
    casesAverted: 40,
    contactReason: { id: 'baggage', label: 'Baggage allowance' },
    performanceLabel: 'Poor Score',
    performanceVariant: 'error',
    reasonNote:
        'Detected from a 25% spike in customer cases regarding baggage allowance policy change at various San Francisco airports.',
};

// ─── Structural Suggestion (left panel) ─────────────────────────────
// New shape per Figma 125:67812. Each card surfaces an answer-first
// structural recommendation tied to a specific section in the article,
// plus the projected score increase if the writer accepts the change.
//
// The `actionKind` values still drive the existing Authoring Agent
// pipeline in reviewArticle.js — the new cards reuse `update-section`
// so accepting one rewrites that section's first two sentences.
export const smartSuggests = [
    {
        id: 'suggest-structure-open-flow-builder',
        label: 'No answer-first structure',
        description:
            'First 2 sentences should state the direct answer in "Open Flow Builder" section',
        section: 'Open Flow Builder',
        scoreDelta: 6,
        coverageDelta: 6,
        confidenceDelta: 2,
        badge: null,
        status: 'available',
        icon: 'utility:page_structure',
        actionKind: 'update-section',
    },
    {
        id: 'suggest-structure-add-flow-elements',
        label: 'No answer-first structure',
        description:
            'First 2 sentences should state the direct answer in "Add Flow Elements" section',
        section: 'Add Flow Elements',
        scoreDelta: 6,
        coverageDelta: 6,
        confidenceDelta: 2,
        badge: null,
        status: 'available',
        icon: 'utility:page_structure',
        actionKind: 'update-section',
    },
    {
        id: 'suggest-structure-activate-the-flow',
        label: 'No answer-first structure',
        description:
            'First 2 sentences should state the direct answer in "Activate the Flow" section',
        section: 'Activate the Flow',
        scoreDelta: 6,
        coverageDelta: 6,
        confidenceDelta: 2,
        badge: null,
        status: 'available',
        icon: 'utility:page_structure',
        actionKind: 'update-section',
    },
];

// ─── Chat feed messages (right panel) ───────────────────────────────
// Seed with one system message + an article-preview card, matching the
// Figma composition. The rest is generated at runtime from user input.
export const initialChat = [
    {
        id: uid('msg'),
        role: 'assistant',
        content:
            "Here's the Draft of Knowledge Article 'Avoid Extra Fees: Know Your Baggage Allowance'.",
        articlePreview: {
            title: 'Avoid Extra Fees: Kno...',
            status: 'Draft',
            recordType: recordType.label,
            dataCategories: dataCategories.map((d) => d.label),
            audiences: audiences.map((a) => a.label),
            teaser:
                'Airlines set strict limits on both the weight and size of checked and carry-on luggage. These rules are designed to ensure safety, efficiency, and fairness for all passengers. Exceeding these limits can result in hefty fees, which vary by airline and route.',
        },
        timestamp: Date.now() - 1000 * 60 * 8,
    },
    {
        id: uid('msg'),
        role: 'assistant',
        content:
            "Okay. Here's the updated version of the article where I have added the video explainer instead of an audio walkthrough to the Article to improve the article coverage score.",
        timestamp: Date.now() - 1000 * 60 * 2,
    },
];

// ─── Global Knowledge Blocks (reusable synced blocks) ─────────────────
export const knowledgeBlocks = [
    {
        syncGroupId: 'kb-terms',
        title: 'Terms and Conditions',
        description: 'Standard baggage T&C disclaimer block',
        suggested: true,
        content:
            'Baggage allowances, including size, weight, and number of bags, vary by airline, route, and fare class. Passengers are responsible for confirming their specific baggage policies with their airline before travel. Airlines may charge additional fees for overweight, oversized, or excess bags, and such fees are subject to change without prior notice.',
        instanceCount: 3,
        blocks: [
            {
                id: 'kb-terms-h',
                type: 'h3',
                content: 'Terms and Conditions',
                syncGroupId: 'kb-terms',
            },
            {
                id: 'kb-terms-p',
                type: 'p',
                content:
                    'Baggage allowances, including size, weight, and number of bags, vary by airline, route, and fare class. Passengers are responsible for confirming their specific baggage policies with their airline before travel. Airlines may charge additional fees for overweight, oversized, or excess bags, and such fees are subject to change without prior notice. Pre-purchasing extra baggage allowance online is often cheaper than paying at the airport. This article is for informational purposes only and does not guarantee fee waivers or airline policy compliance.',
                syncGroupId: 'kb-terms',
            },
        ],
    },
    {
        syncGroupId: 'kb-login',
        title: 'Login & Account Basics',
        description: 'Standard account login guidance block',
        content:
            'If you are a returning passenger, sign in to view your saved trip details before checking your baggage allowance. Your frequent-flyer tier may grant additional weight or bag count.',
        instanceCount: 5,
        blocks: [
            {
                id: 'kb-login-h',
                type: 'h3',
                content: 'Login & Account Basics',
                syncGroupId: 'kb-login',
            },
            {
                id: 'kb-login-p',
                type: 'p',
                content:
                    'If you are a returning passenger, sign in to view your saved trip details before checking your baggage allowance. Your frequent-flyer tier may grant additional weight or bag count.',
                syncGroupId: 'kb-login',
            },
        ],
    },
    {
        syncGroupId: 'kb-contact',
        title: 'Contact Support',
        description: 'Customer support escalation block',
        content:
            'If your baggage was damaged, delayed, or lost during transit, please contact our support team within 7 days of arrival. Include your booking reference and baggage tag number for faster resolution.',
        instanceCount: 8,
        blocks: [
            {
                id: 'kb-contact-h',
                type: 'h3',
                content: 'Contact Support',
                syncGroupId: 'kb-contact',
            },
            {
                id: 'kb-contact-p',
                type: 'p',
                content:
                    'If your baggage was damaged, delayed, or lost during transit, please contact our support team within 7 days of arrival. Include your booking reference and baggage tag number for faster resolution.',
                syncGroupId: 'kb-contact',
            },
        ],
    },
    {
        syncGroupId: 'kb-prohibited',
        title: 'Prohibited Items',
        description: 'Restricted and prohibited items notice',
        content:
            "Certain items are restricted or prohibited from checked and carry-on baggage. Always review your airline's prohibited items list before packing.",
        instanceCount: 4,
        blocks: [
            {
                id: 'kb-prohibited-h',
                type: 'h3',
                content: 'Prohibited Items',
                syncGroupId: 'kb-prohibited',
            },
            {
                id: 'kb-prohibited-p',
                type: 'p',
                content:
                    'Certain items are restricted or prohibited from checked and carry-on baggage. Always review your airline\'s prohibited items list before packing. Common restricted items include flammable liquids, sharp objects, and lithium batteries over 160 Wh.',
                syncGroupId: 'kb-prohibited',
            },
        ],
    },
];

// ─── Knowledge base table of contents (left-panel TOC tree) ─────────
// Hierarchical outline of the airline customer-support knowledge base.
// The leaf with id `article-baggage-allowance` matches `initialArticle.id`
// so the TOC can highlight the article currently open in the editor.
export const knowledgeBaseToc = [
    {
        id: 'kb-booking',
        title: 'Booking & Reservations',
        children: [
            { id: 'kb-booking-search', title: 'Search and Compare Flights' },
            { id: 'kb-booking-multi-city', title: 'Multi-city and Open-jaw Bookings' },
            { id: 'kb-booking-payment', title: 'Payment Methods and Vouchers' },
        ],
    },
    {
        id: 'kb-checkin',
        title: 'Check-in and Boarding',
        children: [
            { id: 'kb-checkin-online', title: 'Online and Mobile Check-in' },
            { id: 'kb-checkin-airport', title: 'Airport Kiosk Check-in' },
            { id: 'kb-checkin-cutoffs', title: 'Boarding Cut-off Times' },
        ],
    },
    {
        id: 'kb-baggage',
        title: 'Baggage Information',
        children: [
            { id: 'kb-baggage-overview', title: 'Baggage Allowance Overview' },
            { id: 'kb-baggage-carryon', title: 'Carry-on Baggage Rules' },
            // Matches initialArticle.id — selected when this page is open.
            { id: 'article-baggage-allowance', title: 'Avoid Extra Fees: Know Your Baggage Allowance' },
            {
                id: 'kb-baggage-special',
                title: 'Special Items and Equipment',
                children: [
                    { id: 'kb-baggage-sports', title: 'Sports and Music Equipment' },
                    { id: 'kb-baggage-mobility', title: 'Mobility Aids and Medical Devices' },
                ],
            },
            { id: 'kb-baggage-lost', title: 'Lost or Damaged Baggage' },
        ],
    },
    {
        id: 'kb-inflight',
        title: 'In-flight Services',
        children: [
            { id: 'kb-inflight-meals', title: 'Meals and Special Dietary Requests' },
            { id: 'kb-inflight-wifi', title: 'Wi-Fi and Entertainment' },
        ],
    },
    {
        id: 'kb-loyalty',
        title: 'Loyalty and Frequent Flyer Programs',
        children: [
            { id: 'kb-loyalty-tiers', title: 'Tier Benefits and Upgrades' },
            { id: 'kb-loyalty-redeem', title: 'Redeeming Miles and Points' },
        ],
    },
    { id: 'kb-disruptions', title: 'Travel Disruptions and Delays' },
    { id: 'kb-assistance', title: 'Special Assistance Requests' },
    { id: 'kb-refunds', title: 'Refunds and Itinerary Changes' },
    { id: 'kb-faq', title: 'Frequently Asked Questions' },
];

// ─── Knowledge graph snapshot (small, for the metadata panel) ───────
export const knowledgeGraph = {
    nodes: [
        { id: 'n-article', label: 'Baggage Allowance', type: 'article', size: 3 },
        { id: 'n-note-1', label: 'Support tickets – SFO', type: 'note', size: 2 },
        { id: 'n-note-2', label: 'Policy change memo', type: 'note', size: 2 },
        { id: 'n-note-3', label: 'Competitor fee table', type: 'note', size: 1 },
        { id: 'n-block-1', label: 'Login basics', type: 'block', size: 1 },
    ],
    links: [
        { source: 'n-article', target: 'n-note-1' },
        { source: 'n-article', target: 'n-note-2' },
        { source: 'n-article', target: 'n-note-3' },
        { source: 'n-block-1', target: 'n-article' },
    ],
};

export function freshId(prefix) {
    return uid(prefix || 'id');
}
