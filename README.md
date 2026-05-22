# AI Ready Knowledge

An interactive prototype demonstrating how Salesforce Knowledge can be enhanced with AI to make articles **RAG-ready** for Help Agent retrieval. Built as a high-fidelity LWC prototype that mimics the Salesforce Knowledge article experience with embedded AI assistance for analysis, authoring, metadata, enrichment, and health monitoring.

> **Status:** Interactive mockup with simulated AI responses. All AI features use deterministic logic that mirrors what production Einstein/Claude integrations would produce.

---

## The Problem

KB articles today are written for human readers. The Help Agent retriever operates on semantic similarity and has no way to distinguish:

- A Winter '25 admin article from a Spring '26 developer article on the same topic
- A "Setup" article from a "Troubleshooting" article when both contain the same keywords
- A 600-word answer buried after a 200-word preamble from a 50-word direct answer

The result: **imprecise retrievals** even when the correct answer exists in the KB. This is not a model problem — it is a content structure and metadata problem.

This prototype demonstrates four interlocking solutions:

1. **RAG Authoring Guidelines** — how to write so chunking and retrieval works correctly
2. **Mandatory Metadata Schema** — machine-readable fields that enable filtered retrieval
3. **AI Enrichment Layer** — AI-generated signals authors never have to fill manually
4. **Health Dashboard** — Fix Queue and metrics for continuous KB quality

---

## What's Inside

### The Knowledge Article Experience

The prototype recreates a Salesforce Knowledge article detail page with:

- **Salesforce global header** with search and app launcher icons
- **Q Branch app navigation** with active Knowledge tab
- **Article header** with title, metadata fields (Article Number, Type, Version, Status, Language), and action buttons
- **Tabbed content area:** Details, Related, AI Metadata, AI Enrichment, Version Comparison, Translations, Approvals
- **Right-side Feed panel** with sample Chatter activity

### AI Action Buttons

Four AI features are accessible from the article header, alongside Follow / Edit / Assign / Publish:

| Button | What it does |
|---|---|
| **Analyze** | Opens an analysis modal showing RAG compliance score (0–100), structure violations (answer-first, section length, preamble, vague headings), and metadata completeness for the current article |
| **Get Metadata** | Suggests AI-populated metadata for 8 controlled-vocabulary fields (Products, Feature Area, Audience, Content Type, Release Versions, Use Case, Complexity, Confidence Level) with per-field confidence scores |
| **Enrich** | Generates AI Summary, Abstract, FAQ extraction (top 5 questions), and entity extraction (Products / Features / UI Elements / API Names) |
| **Dashboard** | Opens the Knowledge Health Dashboard in a new window with KB-wide metrics, Fix Queue, and distribution charts |

### Edit Modal with AI Guided Author

Clicking **Edit** opens a Salesforce-style edit modal with:

- **Left (60%)** — Title, Summary, Details rich text editor (with toolbar), Internal Comments
- **Right (40%)** — **AI Guided Author panel** with live feedback as you type:
  - Live RAG Score (debounced, updates 500ms after typing stops)
  - Structure Checks (✓/⚠ for answer-first, section length, preamble, headings)
  - Issues Found with specific suggestions
  - Contextual Writing Tips

### Persistent AI Output

Once accepted in modals, AI output flows back into the article view:

- Approved **Summary** appears in the Information section's Summary field with an "AI" badge
- Accepted **Metadata** appears in the AI Metadata tab with an "Accepted" badge
- Approved **Enrichment** (Summary, Abstract, FAQs, Entities) appears in the AI Enrichment tab with an "Approved" badge
- Tabs show a green dot indicator (●) when AI output is present

---

## Demo Flow (5 minutes)

A suggested walkthrough that hits every feature:

1. **Land on the page** — see "Configure SSO for Service Cloud" loaded with parsed content blocks
2. **Click Analyze** — see the article scores 45/100 with 4 violations (preamble, vague headings, long sections, missing answer-first)
3. **Click "Fix in Guided Author"** — Analyze modal closes, Edit modal opens with the article pre-loaded
4. **Type in the editor** — watch the RAG score update live, structure checks change colors, writing tips appear
5. **Close the Edit modal, click Get Metadata** — see AI suggestions for all 8 fields with confidence badges (some 92%, some 70%)
6. **Click "Accept All Suggestions"** — close the modal
7. **Click the AI Metadata tab** — see all 8 metadata fields populated, with green "Accepted" badge
8. **Click Enrich** — see AI Summary, Abstract, 5 FAQs, and grouped entity chips
9. **Click "Approve All"** — close the modal
10. **Look at the Information section** — Summary field is now populated with an "AI" badge
11. **Click the AI Enrichment tab** — see the full enrichment output (Summary, Abstract, FAQs, Entities)
12. **Click Dashboard** — opens a new window with KB-wide health metrics, Fix Queue (10 articles ranked by priority), and distribution charts

---

## Architecture

### Tech Stack

- **LWC** (Lightning Web Components) with synthetic shadow DOM
- **Vite** for fast builds and hot reload
- **SLDS 2 (Cosmos)** as the design system
- **lightning-base-components** for SF-native UI elements
- Built on top of [`design-system-2-starter-kit`](https://git.soma.salesforce.com/nimit-khurana/design-system-2-starter-kit)

### Module Layout

```
src/modules/
├── shell/
│   └── app/                    # SF global header + app nav shell
├── page/
│   ├── knowledgeArticle/       # Main Knowledge article view (tabs, modals, AI sections)
│   ├── articleAnalyzer/        # Analyze modal content (scores + violations)
│   ├── guidedAuthor/           # Standalone Guided Author page (legacy)
│   ├── metadataSuggester/      # Metadata modal content (8-field suggestions)
│   ├── enrichmentPreview/      # Enrich modal content (Summary, Abstract, FAQs, Entities)
│   └── healthDashboard/        # Dashboard new-window content (metrics, Fix Queue, charts)
├── ui/
│   ├── scoreCard/              # RAG score card with color-coded status
│   ├── violationList/          # List of structure violations
│   ├── confidenceBadge/        # Color-coded confidence percentage badge
│   └── ...
└── data/
    ├── sampleArticles/         # 4 pre-built articles + 10-row Fix Queue
    ├── articleState/           # Shared state across modals
    ├── validationRules/        # RAG compliance checks (answer-first, length, preamble, headings)
    ├── metadataVocabulary/     # 8 metadata fields with controlled vocabulary
    └── simulationEngine/       # Deterministic AI simulators for metadata, abstract, summary, FAQs, entities
```

### Multi-Entry Build

The prototype has two HTML entry points configured in `vite.config.js`:

- `index.html` → main Knowledge article app
- `dashboard.html` → standalone Health Dashboard (opened in a new window from the main app)

Both share the same SLDS bootstrap and synthetic-shadow setup.

### How AI is Simulated

There is no LLM call in this prototype. All AI behavior is deterministic logic in `data/simulationEngine` and `data/validationRules`:

- **RAG analysis** parses markdown sections, checks for action verbs in opening sentences, counts words per section, detects preamble phrases ("this article provides..."), and flags vague headings ("Overview", "Introduction")
- **Metadata suggestion** uses keyword matching against a controlled vocabulary (e.g. "service cloud" → Service Cloud at 92% confidence; numbered steps → Procedure at 95% confidence)
- **Enrichment** generates Summary/Abstract/FAQs from article structure and Content Type; entity extraction uses regex patterns for product names, UI elements, and API field suffixes (`__c`, `__mdt`)

The simulators are designed so that swapping them for real Einstein/Claude calls is a one-function-replacement change in production.

---

## Sample Articles

Four pre-built articles demonstrate different quality levels:

| ID | Title | RAG Score | Issues |
|---|---|---|---|
| 1 | Configure SSO for Service Cloud | **45** (Poor) | Preamble, vague heading, section >250 words, no answer-first |
| 2 | Create a Flow in Setup | **85** (Good) | None — follows all RAG guidelines |
| 3 | Troubleshoot Case Assignment Rules | **62** (Mixed) | Some sections lack answer-first, vague subheading |
| 4 | Knowledge Article Visibility Settings | **73** (Good) | Preamble in opening section |

The default loaded article is Article 1 (intentionally poor quality, so the AI features have something to fix).

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Run Locally

```bash
git clone https://git.soma.salesforce.com/nimit-khurana/AI-Ready-Knowledge.git
cd AI-Ready-Knowledge
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

### Production Build

```bash
npm run build
npm run preview
```

The dashboard at `dashboard.html` is bundled as a separate entry. Opening the main app and clicking the **Dashboard** button will open it in a new browser window.

---

## RAG Compliance Rules

The validation engine in `data/validationRules` checks four rules per article:

1. **Answer-first structure** — H2 sections should start with a direct answer (action verbs, numbered steps, or definition patterns), not preamble like "This article covers..."
2. **Section length** — sections > 250 words penalized (chunkers split on paragraphs; long sections cause answers to straddle chunk boundaries)
3. **Preamble detection** — opening paragraph flagged if it uses introductory phrases or exceeds 100 words before the answer
4. **Vague headings** — single-word or generic headings ("Overview", "Introduction", "Details") flagged because heading text is part of the chunk's semantic fingerprint

Each violation reduces the RAG score (-15 for answer-first, -10 for section length, -10 for preamble, -5 for vague heading), capped at 0.

---

## Metadata Schema

Eight controlled-vocabulary fields, all required except Use Case:

| Field | Type | Examples |
|---|---|---|
| **Products** | Multi-select | Service Cloud, Sales Cloud, Marketing Cloud, Platform, Einstein, Data Cloud, Knowledge |
| **Feature Area** | Multi-select | Knowledge Management, Case Management, Flows, Reports, API, Security |
| **Primary Audience** | Single-select | Admin, Developer, End User, Architect, Analyst |
| **Content Type** | Single-select | Procedure, Concept, Reference, Troubleshooting, FAQ, Release Notes |
| **Release Versions** | Multi-select | Winter25, Spring25, Summer25, Winter26, Spring26, Summer26 |
| **Use Case** | Multi-select (optional) | Setup, Configuration, Troubleshooting, How-to, Best Practices |
| **Complexity** | Single-select | Beginner, Intermediate, Advanced |
| **Confidence Level** | Single-select | Verified, In Review, Needs Update |

Metadata completeness % is calculated as filled-required / total-required and surfaced in the Analyze modal and Dashboard.

---

## Documentation

- **Design spec:** `docs/superpowers/specs/2026-05-22-ai-ready-knowledge-prototype-design.md`
- **Implementation plan:** `docs/superpowers/plans/2026-05-22-ai-ready-knowledge-prototype.md`

---

## Roadmap (Post-Prototype)

This prototype is intentionally a high-fidelity mockup. To take it to production:

- Replace `simulationEngine` keyword matching with **Einstein LLM** structured-output calls
- Wire metadata persistence to **`KnowledgeArticleVersion`** custom fields
- Hook the structure validator into **publish-time validation** (soft gate, not blocking)
- Connect the Fix Queue priority score to real **Help Agent retrieval analytics** (helpful% × retrieval frequency)
- Add **conflict detection** via the existing Help Agent vector store
- Add **freshness monitoring** via scheduled post-release scans

The full architecture, phasing (264 → 266 → knowledge graph layer), and engineering swimlanes are documented in the spec.

---

## License

Inherits the Apache License 2.0 from the design-system-2-starter-kit foundation.
