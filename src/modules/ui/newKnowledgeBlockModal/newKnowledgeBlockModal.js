import { LightningElement, api, track } from 'lwc';

const GEMINI_API_KEY = 'AIzaSyC0Xsj-M3OdE43kMK2SkKS-yATTkN0klHU';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const MY_RESOURCES_FILES = [
  { id: 'my-1', name: 'Q1 Immigration Report.pdf', type: 'PDF', meta: 'Mar 1, 2026 • 2.4 MB', icon: 'doctype:pdf' },
  { id: 'my-2', name: 'Relocation Policy 2026.docx', type: 'Word', meta: 'Feb 14, 2026 • 1.1 MB', icon: 'doctype:word' },
  { id: 'my-3', name: 'Benefits Overview.pdf', type: 'PDF', meta: 'Jan 20, 2026 • 890 KB', icon: 'doctype:pdf' },
  { id: 'my-4', name: 'HR Compliance Checklist.xlsx', type: 'Excel', meta: 'Mar 3, 2026 • 420 KB', icon: 'doctype:excel' },
  { id: 'my-5', name: 'Onboarding Slides.pptx', type: 'PowerPoint', meta: 'Feb 28, 2026 • 3.2 MB', icon: 'doctype:ppt' },
];

const ENTERPRISE_RESOURCES_FILES = [
  { id: 'ent-1', name: 'Global Travel Policy.pdf', type: 'PDF', meta: 'Jan 5, 2026 • 1.8 MB', icon: 'doctype:pdf' },
  { id: 'ent-2', name: 'Tax Policy Guidelines.pdf', type: 'PDF', meta: 'Feb 2, 2026 • 2.1 MB', icon: 'doctype:pdf' },
  { id: 'ent-3', name: 'Work Authorization Templates.docx', type: 'Word', meta: 'Dec 10, 2025 • 760 KB', icon: 'doctype:word' },
  { id: 'ent-4', name: 'Compliance Standards 2026.xlsx', type: 'Excel', meta: 'Mar 1, 2026 • 510 KB', icon: 'doctype:excel' },
  { id: 'ent-5', name: 'Corporate Onboarding Guide.pdf', type: 'PDF', meta: 'Jan 15, 2026 • 4.5 MB', icon: 'doctype:pdf' },
];

const VALIDATION_STATUS_OPTIONS = [
  { label: 'Not Validated', value: 'not_validated' },
  { label: 'Validated', value: 'validated' },
];

const WORKFLOW_STATUS_OPTIONS = [
  { label: 'Work in Progress', value: 'work_in_progress' },
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
];

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'english' },
  { label: 'French', value: 'french' },
  { label: 'Spanish', value: 'spanish' },
  { label: 'German', value: 'german' },
];

const ALL_CATEGORIES = [
  { id: 'c1', label: 'Immigration' },
  { id: 'c2', label: 'Relocation' },
  { id: 'c3', label: 'Label Text' },
  { id: 'c4', label: 'Compliance' },
  { id: 'c5', label: 'Benefits' },
  { id: 'c6', label: 'Onboarding' },
  { id: 'c7', label: 'Tax Policy' },
  { id: 'c8', label: 'Work Authorization' },
  { id: 'c9', label: 'Travel Policy' },
];

const AUDIENCE_PILL_LABELS = {
  'aud-1': 'US employees',
  'aud-2': 'Salaried Employees',
  'aud-3': 'Interns',
};

const USER_GROUP_OPTIONS = [
  { label: 'Filter: Select…', value: '' },
  { label: 'US employees', value: 'us_employees' },
  { label: 'Salaried Employees', value: 'salaried' },
  { label: 'Interns', value: 'interns' },
];

const KNOWLEDGE_ARTICLES = [
  {
    id: '1',
    title: 'Regional Immigration Guidelines',
    source: 'Google Drive',
    description: 'Detected from a 25% spike in customer cases regarding slow charging speeds at v...',
    content: `<b>Regional Immigration Guidelines:</b><br><b>AMER (Americas)</b><br>United States<ul><li>Employees must obtain an H-1B, L-1, or other applicable visa category.</li><li>Compliance with Social Security and tax registration is required.</li><li>Work authorization renewals must be requested at least six months before expiration.</li></ul><b>Canada</b><ul><li>Employees require a Temporary Foreign Worker Permit or Intra-Company Transfer Visa.</li><li>Compliance with local tax obligations and Social Insurance Number (SIN) registration is mandatory.</li></ul><b>Latin America (Brazil, Mexico, Argentina, etc.)</b>`,
  },
  {
    id: '2',
    title: 'How to Enroll in the 401(k) Plan?',
    source: 'Salesforce Knowledge',
    description: 'Step-by-step guide to enrolling in the company 401(k) retirement plan, including contribution limits and employer match details.',
    content: `<b>401(k) Enrollment Guide:</b><br>All full-time employees are eligible to enroll after <b>30 days</b> of employment.<ul><li>Log in to <b>benefits.company.com</b> and select Retirement Plans.</li><li>Choose your contribution percentage (up to IRS annual limits).</li><li>Employer matches 100% of the first 4% of salary contributed.</li><li>Changes take effect the first of the following month.</li></ul>`,
  },
  {
    id: '3',
    title: 'How to Update Your Direct Deposit Info?',
    source: 'Sharepoint',
    description: 'Go to Employee Self-Service > Payroll and click "Edit Direct Deposit" to update your bank account details for payroll.',
    content: `<b>Updating Direct Deposit:</b><ul><li>Go to <b>Employee Self-Service</b> &gt; <b>Payroll</b>.</li><li>Click "Edit Direct Deposit" to update your bank account and routing number.</li><li>Verify the updated information and click "Save Changes".</li><li>Changes take effect within 1–2 pay cycles. A confirmation email will be sent within 24 hours.</li></ul>`,
  },
  {
    id: '4',
    title: 'Common Exclusions & Limitations in Coverage',
    source: 'Slack',
    description: 'Pre-existing conditions, cosmetic procedures, and claims filed after 90 days may be excluded or denied under standard coverage.',
    content: `<b>Common Policy Exclusions:</b><ul><li>Pre-existing conditions are excluded from coverage for the first 12 months.</li><li>Cosmetic procedures are not covered unless medically necessary.</li><li>Claims filed after 90 days of the incident may be denied.</li><li>Coverage does not extend to third-party contractors.</li></ul>`,
  },
  {
    id: '5',
    title: 'Employee Assistance Program (EAP) Overview',
    source: 'Google Drive',
    description: 'Overview of confidential counseling, financial coaching, and wellness resources available through the Employee Assistance Program.',
    content: `<b>Employee Assistance Program (EAP):</b><br>All employees and household members have access to confidential support.<ul><li>Up to <b>8 free counseling sessions</b> per issue per year (in-person or virtual).</li><li>24/7 crisis support hotline: <b>1-800-555-0199</b>.</li><li>Financial coaching: debt management, tax guidance, and retirement planning.</li><li>Legal consultation: 30-minute session at no cost for personal legal matters.</li></ul>`,
  },
  {
    id: '6',
    title: 'Employee Relocation Policy — EMEA Region',
    source: 'Sharepoint',
    description: 'Covers relocation allowances, timelines, and support services for employees transferring within the EMEA region effective Jan 2026.',
    content: `<b>EMEA Relocation Policy (2026):</b><ul><li>Relocation allowance: up to €8,000 for international moves, €3,500 for domestic.</li><li>Employees must submit relocation requests 60 days before the target start date.</li><li>Housing support: Company provides temporary accommodation for the first 30 days.</li><li>Tax equalization applies to all cross-border relocations.</li></ul>`,
  },
  {
    id: '7',
    title: 'How to Reset Your Two-Factor Authentication',
    source: 'Salesforce Knowledge',
    description: 'Instructions for resetting MFA when an employee loses access to their authenticator app or receives a new device.',
    content: `<b>Resetting Two-Factor Authentication:</b><ol><li>Contact IT Helpdesk via <b>help@company.com</b> or ext. 4100.</li><li>Verify your identity with your employee ID and manager's email.</li><li>IT will send a temporary bypass code valid for 24 hours.</li><li>Set up your new authenticator app using the QR code in the employee portal.</li></ol>`,
  },
  {
    id: '8',
    title: 'Benefits Enrollment Deadline and Eligibility',
    source: 'Slack',
    description: 'Annual benefits enrollment window opens March 15 — review eligibility requirements, plan options, and submission deadlines.',
    content: `<b>Benefits Enrollment 2026:</b><br>Open enrollment period: <b>March 15 – April 5, 2026</b><ul><li>All full-time employees and eligible dependents may enroll.</li><li>New hires have 30 days from start date to enroll outside the open window.</li><li>Select your plan at <b>benefits.company.com</b> before the deadline.</li><li>Changes take effect May 1, 2026.</li></ul>`,
  },
  {
    id: '9',
    title: 'Work Authorization Renewal Checklist',
    source: 'Google Drive',
    description: 'Required documents and timelines for renewing H-1B, L-1, and TN work authorizations before expiration.',
    content: `<b>Work Authorization Renewal:</b><br>Start the renewal process <b>at least 6 months</b> before expiration.<ul><li>Gather: current authorization document, passport, employer letter, I-129 petition.</li><li>Submit via the HR portal under My Documents &gt; Work Authorization.</li><li>Premium processing available for 15-business-day adjudication (additional fee applies).</li><li>Notify your manager and HR Business Partner once submitted.</li></ul>`,
  },
  {
    id: '10',
    title: 'Tuition Reimbursement Program Guide',
    source: 'Salesforce Knowledge',
    description: 'Full-time employees may receive up to $5,250 annually for approved degree programs, certifications, and professional courses.',
    content: `<b>Tuition Reimbursement:</b><ul><li>Annual reimbursement cap: <b>$5,250</b> (IRS tax-free limit).</li><li>Courses must be from an accredited institution and job-related.</li><li>Submit pre-approval via HR portal before the course start date.</li><li>Minimum grade of B (or "Pass" for pass/fail courses) required for reimbursement.</li><li>Receipts and transcripts must be submitted within 30 days of course completion.</li></ul>`,
  },
  {
    id: '11',
    title: 'Global Travel Policy — Expense Limits & Per Diem',
    source: 'Sharepoint',
    description: 'Per diem rates and expense caps for business travel by region, effective Q1 2026. Covers meals, lodging, and ground transport.',
    content: `<b>Global Travel Expense Limits (Q1 2026):</b><ul><li>North America: Meals up to $75/day; Hotels up to $250/night.</li><li>EMEA: Meals up to €65/day; Hotels up to €200/night.</li><li>APAC: Meals up to $60/day; Hotels up to $180/night.</li><li>All receipts over $25 must be submitted within 10 business days of travel.</li><li>Book flights at least 14 days in advance for standard approval.</li></ul>`,
  },
  {
    id: '12',
    title: 'How to Submit an HR Service Request?',
    source: 'Salesforce Knowledge',
    description: 'Step-by-step instructions for logging HR requests including employment verification, name changes, and benefits inquiries.',
    content: `<b>Submitting an HR Service Request:</b><ol><li>Navigate to <b>Employee Self-Service &gt; HR Help</b> in the portal.</li><li>Select the request category: Employment Verification, Name/Address Change, Benefits, Leave, or Other.</li><li>Provide details and attach supporting documents (e.g., marriage certificate, court order).</li><li>Standard turnaround: 3–5 business days. Urgent requests flagged within 24 hours.</li><li>Track your request status under <b>My HR Cases</b>.</li></ol>`,
  },
  {
    id: '13',
    title: 'Parental Leave Policy — US Employees',
    source: 'Google Drive',
    description: 'US-based employees are eligible for up to 16 weeks of fully paid parental leave for birth, adoption, or foster placement.',
    content: `<b>Parental Leave Policy (US):</b><ul><li>Primary caregiver: up to <b>16 weeks</b> fully paid leave.</li><li>Secondary caregiver: up to <b>6 weeks</b> fully paid leave.</li><li>Leave must commence within 12 months of the birth, adoption, or placement.</li><li>Submit leave request to HR at least 30 days in advance when possible.</li><li>Benefits continue at the same rate during leave.</li></ul>`,
  },
  {
    id: '14',
    title: 'Data Retention and Deletion Standards',
    source: 'Slack',
    description: 'Outlines mandatory retention periods for customer data, internal records, and communications as required by compliance frameworks.',
    content: `<b>Data Retention Standards:</b><ul><li>Customer PII: Retained for 7 years post-contract termination, then securely deleted.</li><li>Financial records: Retained for 10 years per SOX requirements.</li><li>Email communications: Retained for 3 years; Slack messages for 1 year.</li><li>HR records: Retained for the duration of employment + 7 years.</li><li>Deletion requests must be processed within 30 days under GDPR/CCPA.</li></ul>`,
  },
  {
    id: '15',
    title: 'Onboarding Checklist for New Hires',
    source: 'Sharepoint',
    description: 'Complete list of Day 1 through Week 4 onboarding tasks including system access, compliance training, and team introductions.',
    content: `<b>New Hire Onboarding Checklist:</b><br><b>Day 1:</b><ul><li>Complete identity verification and badge pickup.</li><li>Set up laptop and configure company email.</li><li>Attend orientation session (9 AM – 12 PM).</li></ul><b>Week 1:</b><ul><li>Complete mandatory compliance and security training.</li><li>Schedule 1:1s with direct manager and team members.</li></ul><b>Week 2–4:</b><ul><li>Complete role-specific training modules in the LMS.</li><li>Shadow team projects and attend all team stand-ups.</li></ul>`,
  },
  {
    id: '16',
    title: 'Password and Access Management Policy',
    source: 'Salesforce Knowledge',
    description: 'Corporate password requirements: minimum 14 characters, mandatory MFA, and automatic 90-day rotation for privileged accounts.',
    content: `<b>Password & Access Policy:</b><ul><li>Minimum password length: <b>14 characters</b> with mixed case, numbers, and symbols.</li><li>MFA is mandatory for all corporate systems and VPN access.</li><li>Privileged accounts require password rotation every <b>90 days</b>.</li><li>Shared accounts are prohibited; request individual access via IT ServiceDesk.</li><li>Report compromised credentials immediately to security@company.com.</li></ul>`,
  },
  {
    id: '17',
    title: 'How to Request Software Access or License',
    source: 'Google Drive',
    description: 'Submit software access requests through the IT portal with manager approval. Standard turnaround is 2–3 business days.',
    content: `<b>Requesting Software Access:</b><ol><li>Go to <b>IT Portal &gt; Software Request</b>.</li><li>Search for the application and select the license tier needed.</li><li>Your manager will receive an approval email within 1 business day.</li><li>After approval, access is provisioned within 2–3 business days.</li><li>For urgent requests, contact the IT Helpdesk directly at ext. 4100.</li></ol>`,
  },
  {
    id: '18',
    title: 'Workplace Safety and Incident Reporting',
    source: 'Slack',
    description: 'All workplace injuries, near-misses, or safety hazards must be reported within 24 hours using the EHS incident reporting system.',
    content: `<b>Workplace Safety — Incident Reporting:</b><ul><li>All injuries and near-misses must be reported within <b>24 hours</b>.</li><li>Use the EHS portal at <b>safety.company.com</b> or call the Safety Hotline at ext. 5000.</li><li>Supervisors must complete the incident investigation form within 48 hours.</li><li>Ergonomic assessments are available on request — contact facilities@company.com.</li><li>First aid kits and AEDs are located at every floor emergency station.</li></ul>`,
  },
  {
    id: '19',
    title: 'Tax Equalization Policy for Expatriates',
    source: 'Sharepoint',
    description: 'Expatriate employees are tax-equalized to their home country hypothetical tax, ensuring no financial penalty for international assignments.',
    content: `<b>Tax Equalization for Expats:</b><ul><li>Employees on international assignments pay a <b>hypothetical tax</b> equivalent to what they would owe at home.</li><li>The company covers any additional host-country tax liability.</li><li>Annual tax equalization calculations are performed by the company's tax advisor.</li><li>Employees must provide complete tax filings in both home and host countries.</li><li>Repatriation adjustments are settled within 90 days of assignment end.</li></ul>`,
  },
  {
    id: '20',
    title: 'Employee Grievance Resolution Process',
    source: 'Salesforce Knowledge',
    description: 'Formal process for employees to raise workplace concerns including timelines, investigation steps, and resolution paths.',
    content: `<b>Grievance Resolution Process:</b><ol><li>Submit a formal grievance via <b>Employee Self-Service &gt; Workplace Concerns</b> or directly to your HRBP.</li><li>HR acknowledges receipt within <b>2 business days</b> and assigns an investigator.</li><li>Investigation is completed within 15 business days, with employee updates at each stage.</li><li>Resolution options include mediation, corrective action, or policy revision.</li><li>Employees may appeal the decision within 10 business days of notification.</li></ol>`,
  },
];

export default class NewKnowledgeBlockModal extends LightningElement {
  static renderMode = 'light';

  @api recordType = '';

  // When true (264: KB Creation flow): skip similarity check step, show 2-step stepper
  @api skipSimilarityStep = false;

  // When true (264: KB Usage flow): hide Notebook AI, rename panel, skip similarity, hide hierarchy
  @api isKbUsageFlow = false;

  // Combined: should skip similarity check (either kb-creation or kb-usage)
  get shouldSkipSimilarity() {
    return this.skipSimilarityStep || this.isKbUsageFlow;
  }

  // Combined: should hide Notebook AI tab (either kb-creation or kb-usage)
  get shouldHideNotebookAi() {
    return this.skipSimilarityStep || this.isKbUsageFlow;
  }
  /* Article title — default placeholder until either the user types one in
     the Step 1 inline title input, the Step 3 metadata input, or we derive
     one from the Details RTE. The flag pins the user-edited value once any
     keystroke happens. */
  @track _articleTitle = 'New Knowledge Article';
  _articleTitleEdited = false;

  get articleTitle() {
    if (this._articleTitleEdited) return this._articleTitle;
    const derived = this._deriveTitleFromDetails(this._detailsHtml());
    return derived || this._articleTitle;
  }

  set articleTitle(val) {
    this._articleTitle = val;
    this._articleTitleEdited = true;
  }

  _deriveTitleFromDetails(html) {
    if (!html || typeof html !== 'string') return '';
    // Prefer the first heading; fall back to the first short prose sentence.
    const headingMatch = html.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
    const raw = headingMatch
      ? headingMatch[1]
      : html
          .replace(/<\s*(h[1-6]|li)\b[^>]*>/gi, ' ')
          .replace(/<[^>]+>/g, ' ');
    const text = raw
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) return '';
    if (headingMatch) return text.length > 80 ? text.slice(0, 77).trim() + '…' : text;
    const firstSentence = (text.match(/^[^.!?]+[.!?]/) || [text])[0].trim();
    return firstSentence.length > 80 ? firstSentence.slice(0, 77).trim() + '…' : firstSentence;
  }

  get articleMetaText() {
    return 'Joseph Cooper \u2022 Article Draft \u2022 11/13/15';
  }

  get isStep2Form() {
    return false;
  }

  get cardTitle() {
    // Step 1 (authoring) → "Content Editor".
    // Step 3 (metadata)  → "Article Details" — the card holds the
    // article's metadata form alongside the Suggested Placement panel.
    return this.isStep3 ? 'Article Details' : 'Content Editor';
  }

  /* Top page-header title — Step 1: "New Knowledge Article",
     Step 3 (Metadata): "New Knowledge: <record type>" per Figma 7555:111894. */
  get pageTitle() {
    if (this.isStep3) {
      return this.recordType ? `New Knowledge: ${this.recordType}` : 'New Knowledge';
    }
    return 'New Knowledge Article';
  }

  get resourcesPanelHeaderTitle() {
    if (this.isStep3) return 'Suggested Placement';
    if (this.skipSimilarityStep || this.isKbUsageFlow) return 'Existing knowledge blocks';
    return 'Knowledge Content';
  }

  get articleTitlePlaceholder() {
    return this.skipSimilarityStep ? 'New Block title' : 'New Knowledge Article';
  }

  get showInternalComments() {
    return !this.skipSimilarityStep;
  }

  get articleMetaTextResolved() {
    if (this.skipSimilarityStep) return 'Joseph Cooper \u2022 Knowledge Block draft \u2022 11/13/15';
    return this.articleMetaText;
  }
  @track _currentStep = 1;
  @track _similarityLoading = false;
  @track _similarityLoaded = false;
  @track _expandedArticles = {};
  @track   resourcesPanelOpen = true;
  resourceSearchTerm = '';
  @track resourcesPanelTab = 'blocks';
  @track addSourcesModalOpen = false;
  @track _addSourcesTab = 'file-upload';
  @track _notebookSources = [];
  @track _sourceSelections = {};
  @track _pendingFiles = [];
  @track _pendingLinks = [];
  @track _linkInputValue = '';
  @track _isDragOver = false;
  @track _selectedFileIds = [];
  @track notebookGeneratedContentOpen = false;
  @track _generatedItems = [];
  @track _isGenerating = false;
  @track _generateError = null;
  @track _openOverflowId = null;
  /** Inline styles for fixed-position Notebook overflow menu (above docked utility bar). */
  @track _nbOverflowMenuStyle = '';
  _nbOverflowListenersAttached = false;
  _onNbOverflowReposition = () => {
    if (this._openOverflowId) {
      this._updateNbOverflowMenuPosition();
    }
  };
  _regeneratingItemId = null;
  @track generateContentModalOpen = false;
  @track _gcDescription = '';
  @track _gcLength = 'medium';
  @track _gcTone = 'professional';

  // ── Knowledge-block hover tooltip ─────────────────────────
  // SLDS 2 tooltip rendered above the hovered .nk-knowledge-block in
  // the Details RTE. Positioned in viewport coords (position: fixed)
  // and clamped to the editor's getBoundingClientRect so it never
  // escapes the editor pane while the user scrolls or hovers blocks
  // near the top/bottom edges.
  @track _kbTooltipVisible = false;
  @track _kbTooltipStyle = '';
  @track _kbTooltipPlacement = 'top';
  _kbTooltipEditor = null;
  _kbTooltipBlock = null;
  _kbTooltipOnOver = null;
  _kbTooltipOnOut = null;
  _kbTooltipOnScroll = null;

  // ── "Check Similar Articles" modal (Figma 7654:149830) ─────
  // Triggered from the page-header button on Step 1. Shows a list of
  // similar articles fetched from "search". Each row has an archive
  // button; archiving flips the row's archive icon to an SLDS 2
  // "Archived" badge and dispatches a `kbtoast` event so the global
  // app toast confirms the action.
  @track checkSimilarModalOpen = false;
  @track _similarArticlesArchived = {};
  _similarArticlesSeed = [
    {
      id: 'sim-modal-1',
      title: 'Common exclusions or limitations in solar panel warranties for homeowners',
      source: 'Confluence',
      lastUpdated: '4/13/2025',
      status: 'Draft',
      statusVariant: 'light',
      score: 56,
      aspects: ['Login Information', 'Repair Steps', 'Battery Usage factors'],
    },
    {
      id: 'sim-modal-2',
      title: 'Common exclusions or limitations in solar panel warranties for homeowners',
      source: 'Confluence',
      lastUpdated: '4/13/2025',
      status: 'Published',
      statusVariant: 'success',
      score: 45,
      aspects: ['Login Information', 'Repair Steps', 'Battery Usage factors'],
    },
    {
      id: 'sim-modal-3',
      title: 'Common exclusions or limitations in solar panel warranties for homeowners',
      source: 'Confluence',
      lastUpdated: '4/13/2025',
      status: 'Draft',
      statusVariant: 'light',
      score: 40,
      aspects: ['Login Information', 'Repair Steps', 'Battery Usage factors'],
    },
  ];

  // ── Step 2 form fields ─────────────────────────────────────
  /* `_summary` is the explicit user-typed value. If the user hasn't typed
     anything yet, the `summary` getter falls back to a value derived from
     the current Details RTE so the field is prefilled at Step 3 entry but
     editable. Any keystroke marks `_summaryEdited` and pins the value. */
  @track _summary = '';
  _summaryEdited = false;
  @track validationStatus = 'not_validated';
  @track workflowStatus = 'work_in_progress';
  urlName = '';
  requiresRevision = false;
  visibleToCustomer = false;
  visibleToPartner = false;
  visibleInternalApp = false;
  featuredCommunities = false;
  @track translationLanguage = 'english';

  _savedDetailsContent = '';
  _savedCommentsContent = '';
  /** When true, next step-1 paint restores RTE HTML from saved snapshots (Back navigation). */
  _detailsEditorNeedsRestore = false;
  @track _detailsWordCount = 0;
  @track _commentsWordCount = 0;

  @track _popoverVisible = false;
  @track _popoverTop = 0;
  @track _popoverLeft = 0;
  _savedRange = null;
  _docMouseDownHandler = null;

  @track _createBlockOpen = false;
  @track _categoryDropdownOpen = false;
  @track _selectedCategoryIds = new Set(['c1', 'c2', 'c3']);
  blockShortDescription = '';
  @track blockConditionalVisibility = false;

  // Figma: Translations section
  @track autoApplyTranslation = true;

  // Figma: Audience Visibility section
  @track applySharingRules = true;
  @track _audiencePillIds = ['aud-1', 'aud-2', 'aud-3'];
  audienceUserGroup = '';
  audienceSearch = '';

  // Accordion: which sections are expanded (true = show body)
  @track settingsSectionOpen = true;
  @track translationsSectionOpen = true;
  @track audienceSectionOpen = true;

  connectedCallback() {
    if (this.skipSimilarityStep) {
      this.articleTitle = 'New Block title';
    }
    queueMicrotask(() => this._dispatchArticleTitleChange());
    this._docMouseDownHandler = (e) => {
      // Defer so element pickers and other listeners get the event first
      setTimeout(() => {
        const popover = this.querySelector('.nk-selection-popover');
        if (popover && popover.contains(e.target)) return;
        const editor = this.detailsEditor;
        if (editor && editor.contains(e.target)) return;
        this._popoverVisible = false;
        if (!this._createBlockOpen) {
          this._savedRange = null;
        }

        const combobox = this.querySelector('.nk-cb-combobox');
        if (combobox && !combobox.contains(e.target)) {
          this._categoryDropdownOpen = false;
        }

        if (!e.target.closest('.nk-nb-generated__overflow')) {
          this._closeNbOverflowMenu();
        }
      }, 0);
    };
    document.addEventListener('mousedown', this._docMouseDownHandler);
  }

  disconnectedCallback() {
    this._detachNbOverflowWindowListeners();
    if (this._docMouseDownHandler) {
      document.removeEventListener('mousedown', this._docMouseDownHandler);
    }
    if (this._uploadTimers) {
      Object.values(this._uploadTimers).forEach((id) => clearTimeout(id));
    }
    this._teardownKbTooltip();
  }

  renderedCallback() {
    if (this._previewNeedsPopulate && this.isStep2) {
      const previewEl = this.querySelector('[data-id="previewDisplay"]');
      if (previewEl) {
        const content = this._savedDetailsContent || '';
        const fallback = this._getPreviewFallbackHtml();
        previewEl.innerHTML = content.trim() ? this._wrapUserContentInParas(content) : fallback;
        this._previewNeedsPopulate = false;
      }
    }
    if (this._detailsEditorNeedsRestore && this.isStep1) {
      const editor = this.detailsEditor;
      if (editor) {
        editor.innerHTML = this._savedDetailsContent || '';
        this._detailsWordCount = this._countWords(editor);
        const commentsEl = this.querySelector('[data-id="commentsEditor"]');
        if (commentsEl) {
          commentsEl.innerHTML = this._savedCommentsContent || '';
          this._commentsWordCount = this._countWords(commentsEl);
        }
        this._detailsEditorNeedsRestore = false;
      }
    }
    if (this._openOverflowId) {
      requestAnimationFrame(() => this._updateNbOverflowMenuPosition());
    }
    // (Re)wire the knowledge-block hover tooltip whenever the Details
    // editor mounts or remounts (e.g. after Step 2 → Step 1 nav).
    this._setupKbTooltip();
  }

  // Mapping: each unique section card ID → array of paragraph IDs to highlight
  // Different section cards across different articles highlight different paragraphs
  _sectionToParaMap = {
    // Article 1 sections
    'sim1-troubleshooting': ['para-positioning'],
    'sim1-repair':          ['para-intelligence'],
    'sim1-battery':         ['para-simplicity', 'para-unity'],
    // Article 2 sections
    'sim2-login':           ['para-core-message'],
    'sim2-repair':          ['para-simplicity', 'para-intelligence'],
    'sim2-battery':         ['para-competitive'],
    // Article 3 sections
    'sim3-warranty':        ['para-target-audience'],
    'sim3-homeowner':       ['para-implementation'],
  };

  _getPreviewFallbackHtml() {
    const h3 = 'style="font-size:16px;font-weight:600;margin:0 0 8px;color:#03234d"';
    const p = 'style="margin:0 0 16px;line-height:1.7;color:#2e2e2e"';
    const p6 = 'style="margin:0 0 6px;line-height:1.7;color:#2e2e2e"';
    return [
      `<div class="nk-preview-para" data-para-id="para-positioning"><h3 ${h3}>Positioning Statement</h3><p ${p}>For healthcare providers struggling to deliver truly personalized patient care at scale, Care Insights is the premier AI-powered analytics platform that expertly transforms fragmented data into actionable insights, leading to superior patient outcomes.</p></div>`,
      `<div class="nk-preview-para" data-para-id="para-core-message"><h3 ${h3}>Core Message</h3><p ${p}>Clarity for Care: See the Full Picture.</p></div>`,
      `<div class="nk-preview-para" data-para-id="para-simplicity"><p ${p6}><h3 ${h3}>Key Messaging Pillars</h3><strong>Simplicity:</strong> "From Scattered Data to Focused Insights: Clarity at a Glance." — We simplify complex patient data, making it exceptionally easy to understand and act upon, ensuring no critical detail is overlooked.</p></div>`,
      `<div class="nk-preview-para" data-para-id="para-intelligence"><p ${p6}><strong>Intelligence:</strong> "Predictive Analytics for Proactive Care: Anticipate and Act." — Leverage cutting-edge AI to anticipate patient needs and proactively improve outcomes, setting a new standard for patient-centered care.</p></div>`,
      `<div class="nk-preview-para" data-para-id="para-unity"><p ${p}><strong>Unity:</strong> "All Patient Data, One Unified View: Connected Care, Seamless Experience." — Connect disparate systems and empower seamless collaboration across care teams, fostering a holistic approach to patient wellness.</p></div>`,
      `<div class="nk-preview-para" data-para-id="para-target-audience"><h3 ${h3}>Target Audience</h3><p ${p}>Hospital administrators, clinical directors, and health-system CIOs seeking data-driven decision-making tools to improve operational efficiency and patient satisfaction scores across multi-facility networks.</p></div>`,
      `<div class="nk-preview-para" data-para-id="para-competitive"><h3 ${h3}>Competitive Differentiation</h3><p ${p}>Unlike legacy analytics platforms that require extensive IT involvement and months of configuration, Care Insights delivers out-of-the-box integrations with major EHR systems and provides actionable dashboards within days of deployment.</p></div>`,
      `<div class="nk-preview-para" data-para-id="para-implementation"><h3 ${h3}>Implementation Guidelines</h3><p ${p}>Phase 1: Data integration and mapping (2 weeks). Phase 2: Dashboard configuration and role-based access setup (1 week). Phase 3: Staff training and pilot deployment (1 week). Phase 4: Full rollout with continuous monitoring and optimization.</p></div>`
    ].join('');
  }

  /**
   * Remove editor-only "created block" wrappers so preview reads like normal body text.
   */
  _normalizeCreatedBlockBoundariesForPreview(container) {
    const boundaries = Array.from(container.querySelectorAll('.nk-created-block-boundary'));
    boundaries.forEach((el) => {
      const parent = el.parentNode;
      if (!parent) return;
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
    });
  }

  // When user has typed their own content, split it into paragraphs for highlighting
  _wrapUserContentInParas(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    this._normalizeCreatedBlockBoundariesForPreview(tmp);
    const blocks = tmp.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, li');
    if (blocks.length === 0) {
      const inner = tmp.innerHTML.trim();
      return `<div class="nk-preview-para" data-para-id="para-user-0">${inner}</div>`;
    }
    const paraIds = Object.values(this._sectionToParaMap).flat();
    let idx = 0;
    const result = [];
    blocks.forEach((block) => {
      const paraId = idx < paraIds.length ? paraIds[idx] : `para-user-${idx}`;
      result.push(`<div class="nk-preview-para" data-para-id="${paraId}">${block.outerHTML}</div>`);
      idx++;
    });
    return result.join('');
  }

  handleSectionCardClick(event) {
    const sectionId = event.currentTarget?.dataset?.sectionId;
    if (!sectionId) return;

    // Remove active class from previously active section card
    const prevActive = this.querySelector('.nk-sim-section-card--active');
    if (prevActive) prevActive.classList.remove('nk-sim-section-card--active');

    // Add active class to clicked section card
    event.currentTarget.classList.add('nk-sim-section-card--active');

    this._highlightParasForSection(sectionId);
  }

  handleSectionCardKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.currentTarget?.click();
    }
  }

  _highlightParasForSection(sectionId) {
    const previewEl = this.querySelector('[data-id="previewDisplay"]');
    if (!previewEl) return;

    // Clear all existing highlights
    previewEl.querySelectorAll('.nk-preview-para--highlight').forEach((el) => el.classList.remove('nk-preview-para--highlight'));

    // Look up which paragraphs this section card maps to
    const paraIds = this._sectionToParaMap[sectionId];
    if (!paraIds || paraIds.length === 0) return;

    // Highlight each mapped paragraph
    let firstMatch = null;
    for (const paraId of paraIds) {
      const paraEl = previewEl.querySelector(`[data-para-id="${paraId}"]`);
      if (paraEl) {
        paraEl.classList.add('nk-preview-para--highlight');
        if (!firstMatch) firstMatch = paraEl;
      }
    }

    // Scroll to the first highlighted paragraph
    if (firstMatch) {
      const scrollContainer = previewEl.closest('.nk-card__body');
      if (scrollContainer) {
        const paraTop = firstMatch.offsetTop;
        const containerHeight = scrollContainer.clientHeight;
        const paraHeight = firstMatch.offsetHeight;
        const scrollTop = Math.max(0, paraTop - Math.round(containerHeight / 2) + Math.round(paraHeight / 2));
        scrollContainer.scrollTo({ top: scrollTop, behavior: 'smooth' });
      }
    }
  }

  // ── Step getters ───────────────────────────────────────────

  get isStep1() {
    return this._currentStep === 1;
  }

  get isStep2() {
    return this._currentStep === 2;
  }

  get isStep3() {
    return this._currentStep === 3;
  }

  get mainAreaClass() {
    if (this._currentStep === 2) return 'nk-main nk-main--split';
    if (this._currentStep === 3 && !this.isKnowledgeBlock && !this.shouldSkipSimilarity && !this.isKbUsageFlow) return 'nk-main nk-main--split';
    return 'nk-main';
  }

  get isKnowledgeBlock() {
    const rt = (this.recordType && String(this.recordType).trim()) || '';
    return rt.toLowerCase() === 'knowledge block';
  }

  // Show KB-style metadata form: when record type is KB, or when in 264: KB Creation flow
  get isKnowledgeBlockOrKbCreation() {
    return this.isKnowledgeBlock || this.skipSimilarityStep;
  }

  get isArticleMetadataForm() {
    if (this.isKbUsageFlow) return true;
    return !this.isKnowledgeBlock && !this.skipSimilarityStep;
  }

  get showKbSummaryField() {
    return this.isKnowledgeBlock && !this.skipSimilarityStep;
  }

  get showHierarchyPanel() {
    return this._currentStep === 3 && !this.isKnowledgeBlock && !this.shouldSkipSimilarity && !this.isKbUsageFlow;
  }

  // ── Hierarchy tree data ──────────────────────────────────────
  @track _hierarchySearch = '';
  @track _hierarchyGraphView = false;
  @track _hierarchyExpanded = { 'h-4': true, 'h-6': true };
  @track _draggedItemId = null;
  @track _userArticleParentId = 'h-6';
  // Flat index in _baseHierarchyItems *after* which the user article is inserted.
  // null means "insert right after the parent row itself" (first child).
  @track _userArticleAfterBaseIdx = 7; // default: after h-6-2 ("Why Solar Lights Flicker or Blink")
  _dragExpandTimer = null;
  _dragExpandTimerTarget = null;

  // The base hierarchy items (without the user article — it's injected dynamically)
  _baseHierarchyItems = [
    { id: 'h-1', label: 'Employee Handbook Overview', level: 1 },
    { id: 'h-2', label: 'Compensation and Payroll', level: 1, hasChildren: true },
    { id: 'h-3', label: 'Health and Wellness Benefits', level: 1, hasChildren: true },
    { id: 'h-4', label: 'Retirement and Financial Planning', level: 1, hasChildren: true },
    { id: 'h-5', label: 'Leave Policies and Time Off', level: 1, hasChildren: true },
    { id: 'h-6', label: 'HR Policies and Compliance', level: 1, hasChildren: true },
    { id: 'h-6-1', label: 'Code of Conduct', level: 2, parentId: 'h-6' },
    { id: 'h-6-2', label: 'Anti-Harassment and Discrimination Policy', level: 2, parentId: 'h-6' },
    { id: 'h-6-4', label: 'Workplace Safety Guidelines', level: 2, parentId: 'h-6', hasChildren: true },
    { id: 'h-7', label: 'Onboarding and Training', level: 1, hasChildren: true },
    { id: 'h-8', label: 'Performance Management', level: 1, hasChildren: true },
    { id: 'h-9', label: 'Immigration and Work Authorization', level: 1, hasChildren: true },
    { id: 'h-10', label: 'Employee Relocation Programs', level: 1, hasChildren: true },
    { id: 'h-11', label: 'IT and Security Policies', level: 1, hasChildren: true },
    { id: 'h-12', label: 'Resources and Contact Directory', level: 1, hasChildren: true },
  ];

  get selectedArticleLabel() {
    const title = (this.articleTitle || '').trim();
    return (title && title !== 'New Article title') ? title : 'new article';
  }

  /**
   * Builds the full flat hierarchy by injecting the user's article at the
   * correct position inside its current parent.
   *
   * Placement rule:
   *  – _userArticleAfterBaseIdx === null → insert right after the parent row
   *  – otherwise → insert right after that flat-index in _baseHierarchyItems
   */
  get hierarchyItems() {
    const base = this._baseHierarchyItems;
    const parentId = this._userArticleParentId;
    const userItem = {
      id: 'h-user',
      label: this.selectedArticleLabel,
      level: 2,
      parentId,
      selected: true,
      draggable: true,
    };

    // Determine the flat index in `base` *after* which we insert
    let insertAfterFlatIdx;
    if (this._userArticleAfterBaseIdx !== null) {
      insertAfterFlatIdx = this._userArticleAfterBaseIdx;
    } else {
      // Insert right after the parent row itself (first child position)
      insertAfterFlatIdx = base.findIndex(i => i.id === parentId);
    }

    const result = [];
    let inserted = false;
    for (let idx = 0; idx < base.length; idx++) {
      const item = base[idx];
      // Ensure the parent is marked as having children
      if (item.id === parentId) {
        result.push(item.hasChildren ? item : { ...item, hasChildren: true });
      } else {
        result.push(item);
      }
      // Insert user article right after the target index
      if (!inserted && idx === insertAfterFlatIdx) {
        result.push(userItem);
        inserted = true;
      }
    }
    if (!inserted) {
      result.push(userItem);
    }
    return result;
  }

  get filteredHierarchyItems() {
    const search = (this._hierarchySearch || '').toLowerCase().trim();
    const items = this.hierarchyItems;
    const result = [];
    for (const item of items) {
      if (item.level === 2) {
        if (!this._hierarchyExpanded[item.parentId]) continue;
      }
      if (search && !item.label.toLowerCase().includes(search)) continue;
      result.push({
        ...item,
        expanded: !!this._hierarchyExpanded[item.id],
        isDraggable: !!item.draggable,
        rowClass:
          'nk-ht-row'
          + (item.selected ? ' nk-ht-row--selected' : '')
          + (item.level === 2 ? ' nk-ht-row--child' : '')
          + (!item.draggable ? ' nk-ht-row--static' : ''),
        chevronIcon: item.hasChildren
          ? (this._hierarchyExpanded[item.id] ? 'utility:chevrondown' : 'utility:chevronright')
          : null,
      });
    }
    return result;
  }

  handleHierarchySearch(event) {
    this._hierarchySearch = event.target.value;
  }

  handleHierarchyToggle(event) {
    const itemId = event.currentTarget.dataset.itemId;
    this._hierarchyExpanded = {
      ...this._hierarchyExpanded,
      [itemId]: !this._hierarchyExpanded[itemId],
    };
  }

  handleGraphViewToggle(event) {
    this._hierarchyGraphView = event.target.checked;
  }

  // Collapse-panel affordance shown in the Suggested Placement card
  // header (Figma 7555:111894 — left-arrow icon button). Currently a
  // no-op; reserved for a future collapse-to-rail interaction.
  handleCollapseHierarchyPanel() {}

  // ── Drag-and-drop handlers ─────────────────────────────────
  handleHierarchyDragStart(event) {
    const itemId = event.currentTarget.dataset.itemId;
    if (itemId !== 'h-user') {
      event.preventDefault();
      return;
    }
    this._draggedItemId = itemId;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', itemId);
  }

  handleHierarchyDragOver(event) {
    if (!this._draggedItemId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    event.currentTarget.classList.add('nk-ht-row--drag-over');

    // Auto-expand collapsed parents after 500ms hover
    const targetId = event.currentTarget.dataset.itemId;
    const targetItem = this._baseHierarchyItems.find(i => i.id === targetId);
    if (targetItem && targetItem.hasChildren && !this._hierarchyExpanded[targetId]) {
      if (this._dragExpandTimerTarget !== targetId) {
        clearTimeout(this._dragExpandTimer);
        this._dragExpandTimerTarget = targetId;
        this._dragExpandTimer = setTimeout(() => {
          this._hierarchyExpanded = { ...this._hierarchyExpanded, [targetId]: true };
          this._dragExpandTimer = null;
          this._dragExpandTimerTarget = null;
        }, 500);
      }
    }
  }

  handleHierarchyDragLeave(event) {
    event.currentTarget.classList.remove('nk-ht-row--drag-over');
    const leftId = event.currentTarget.dataset.itemId;
    if (this._dragExpandTimerTarget === leftId) {
      clearTimeout(this._dragExpandTimer);
      this._dragExpandTimer = null;
      this._dragExpandTimerTarget = null;
    }
  }

  handleHierarchyDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('nk-ht-row--drag-over');
    this._clearDragTimers();

    if (!this._draggedItemId) return;

    const targetId = event.currentTarget.dataset.itemId;
    if (targetId === 'h-user') {
      this._draggedItemId = null;
      return;
    }

    const base = this._baseHierarchyItems;
    const targetIdx = base.findIndex(i => i.id === targetId);
    if (targetIdx === -1) { this._draggedItemId = null; return; }

    const target = base[targetIdx];

    if (target.level === 1) {
      // Dropped on a top-level parent → insert as first child (right after parent row)
      this._userArticleParentId = target.id;
      this._userArticleAfterBaseIdx = null; // means "right after parent"
      this._hierarchyExpanded = { ...this._hierarchyExpanded, [target.id]: true };
    } else {
      // Dropped on a level-2 sibling → insert after it under the same parent
      this._userArticleParentId = target.parentId;
      this._userArticleAfterBaseIdx = targetIdx;
      this._hierarchyExpanded = { ...this._hierarchyExpanded, [target.parentId]: true };
    }

    this._draggedItemId = null;
  }

  handleHierarchyDragEnd() {
    this._draggedItemId = null;
    this._clearDragTimers();
    // Remove any lingering drag-over highlights
    const rows = this.querySelectorAll('.nk-ht-row--drag-over');
    if (rows) rows.forEach(r => r.classList.remove('nk-ht-row--drag-over'));
  }

  _clearDragTimers() {
    clearTimeout(this._dragExpandTimer);
    this._dragExpandTimer = null;
    this._dragExpandTimerTarget = null;
  }

  // ── Knowledge Block form fields ──────────────────────────────
  @track kbShortDescription = 'Repair Policy';
  @track kbDataCategory = '';
  @track kbDataCategorySearch = '';
  @track kbDataCategoryPills = [];

  _dataCategoryLookupData = [
    { id: 'dc-1', label: 'Immigration & Visas' },
    { id: 'dc-2', label: 'Relocation Services' },
    { id: 'dc-3', label: 'Benefits & Insurance' },
    { id: 'dc-4', label: 'Compensation & Payroll' },
    { id: 'dc-5', label: 'Leave & Time Off' },
    { id: 'dc-6', label: 'Onboarding & Training' },
    { id: 'dc-7', label: 'Retirement & 401(k)' },
    { id: 'dc-8', label: 'Workplace Safety' },
    { id: 'dc-9', label: 'Performance Management' },
    { id: 'dc-10', label: 'Employee Wellness' },
    { id: 'dc-11', label: 'Compliance & Ethics' },
    { id: 'dc-12', label: 'IT & Security' },
    { id: 'dc-13', label: 'Travel & Expenses' },
    { id: 'dc-14', label: 'HR Policies' },
    { id: 'dc-15', label: 'Diversity & Inclusion' },
  ];

  // Lookup data for translation Value field
  _translationValueLookupData = [
    { id: 'tv-1', label: 'HR Operations Queue', type: 'queue' },
    { id: 'tv-2', label: 'Benefits Administration Queue', type: 'queue' },
    { id: 'tv-3', label: 'EMEA HR Support Queue', type: 'queue' },
    { id: 'tv-4', label: 'APAC HR Support Queue', type: 'queue' },
    { id: 'tv-5', label: 'Immigration Services Queue', type: 'queue' },
    { id: 'tv-6', label: 'Payroll Support Queue', type: 'queue' },
    { id: 'tv-7', label: 'Compliance Review Queue', type: 'queue' },
    { id: 'tv-8', label: 'LATAM HR Support Queue', type: 'queue' },
    { id: 'tv-9', label: 'Sarah Chen (HR Director)', type: 'user' },
    { id: 'tv-10', label: 'Marcus Johnson (HRBP)', type: 'user' },
    { id: 'tv-11', label: 'Priya Patel (Benefits Mgr)', type: 'user' },
    { id: 'tv-12', label: 'Aiko Tanaka (APAC HR Lead)', type: 'user' },
    { id: 'tv-13', label: 'Sophie Martin (EMEA HR Lead)', type: 'user' },
    { id: 'tv-14', label: 'Carlos Mendez (LATAM HR Lead)', type: 'user' },
    { id: 'tv-15', label: 'HR Knowledge Admin', type: 'role' },
    { id: 'tv-16', label: 'Localization Manager', type: 'role' },
    { id: 'tv-17', label: 'Content Reviewer', type: 'role' },
    { id: 'tv-18', label: 'Regional HR Lead', type: 'role' },
  ];

  @track kbApplyTranslations = false;
  @track kbAudienceVisibility = true;
  @track kbAudienceUserGroup = 'user_group';
  @track kbAudienceSearch = '';
  @track kbAudiencePills = [];

  // Lookup data for audience search
  _audienceLookupData = [
    { id: 'aud-1', label: 'All Full-Time Employees', group: 'user_group' },
    { id: 'aud-2', label: 'US Employees', group: 'user_group' },
    { id: 'aud-3', label: 'EMEA Employees', group: 'user_group' },
    { id: 'aud-4', label: 'APAC Employees', group: 'user_group' },
    { id: 'aud-5', label: 'Part-Time Employees', group: 'user_group' },
    { id: 'aud-6', label: 'Contractors & Temps', group: 'user_group' },
    { id: 'aud-7', label: 'People Managers', group: 'user_group' },
    { id: 'aud-8', label: 'HR Business Partner', group: 'role' },
    { id: 'aud-9', label: 'HR Administrator', group: 'role' },
    { id: 'aud-10', label: 'Benefits Coordinator', group: 'role' },
    { id: 'aud-11', label: 'Payroll Specialist', group: 'role' },
    { id: 'aud-12', label: 'Employee (Standard)', group: 'profile' },
    { id: 'aud-13', label: 'HR Admin Profile', group: 'profile' },
    { id: 'aud-14', label: 'Manager Profile', group: 'profile' },
    { id: 'aud-15', label: 'Executive Profile', group: 'profile' },
  ];

  @track kbSettingsOpen = true;
  @track kbTranslationsOpen = true;
  @track kbAudienceOpen = true;

  // Translation rows (added when "Apply Translations Manually" is toggled on)
  @track _kbTranslationRows = [];

  get kbDataCategoryOptions() {
    return [
      { label: 'Select Data Categories', value: '' },
      { label: 'Account Management', value: 'account_management' },
      { label: 'Security', value: 'security' },
      { label: 'Self Service', value: 'self_service' },
    ];
  }

  get kbAudienceUserGroupOptions() {
    return [
      { label: 'User Group', value: 'user_group' },
      { label: 'Role', value: 'role' },
      { label: 'Profile', value: 'profile' },
    ];
  }

  handleKbShortDescChange(event) { this.kbShortDescription = event.target.value; }
  handleKbDataCategoryChange(event) { this.kbDataCategory = event.detail.value; }

  handleDataCategorySearchInput(event) {
    this.kbDataCategorySearch = event.target.value;
    this._updateDataCategoryDropdown();
  }

  handleDataCategorySearchFocus() {
    this._updateDataCategoryDropdown();
  }

  handleDataCategorySearchBlur() {
    setTimeout(() => {
      const dropdown = this.querySelector('.nk-datacat-dropdown');
      if (dropdown) dropdown.style.display = 'none';
    }, 200);
  }

  _updateDataCategoryDropdown() {
    const dropdown = this.querySelector('.nk-datacat-dropdown');
    if (!dropdown) return;
    const search = (this.kbDataCategorySearch || '').toLowerCase();
    const selectedIds = new Set(this.kbDataCategoryPills.map(p => p.id));
    const filtered = this._dataCategoryLookupData.filter(item =>
      !selectedIds.has(item.id) && (search === '' || item.label.toLowerCase().includes(search))
    );
    if (filtered.length === 0) { dropdown.style.display = 'none'; return; }
    dropdown.innerHTML = filtered.map(item =>
      `<div class="nk-datacat-dropdown__item" data-id="${item.id}" data-label="${item.label}">${item.label}</div>`
    ).join('');
    dropdown.style.display = 'block';
    dropdown.querySelectorAll('.nk-datacat-dropdown__item').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this._addDataCategoryPill(el.dataset.id, el.dataset.label);
        dropdown.style.display = 'none';
        const input = this.querySelector('.nk-datacat-search');
        if (input) { input.value = ''; this.kbDataCategorySearch = ''; }
      });
    });
  }

  _addDataCategoryPill(id, label) {
    if (this.kbDataCategoryPills.some(p => p.id === id)) return;
    this.kbDataCategoryPills = [...this.kbDataCategoryPills, { id, label }];
    this._renderDataCategoryPills();
  }

  _renderDataCategoryPills() {
    const container = this.querySelector('.nk-datacat-pills');
    if (!container) return;
    container.innerHTML = '';
    this.kbDataCategoryPills.forEach(pill => {
      const el = document.createElement('span');
      el.className = 'nk-audience-pill';
      el.innerHTML = `
        <span class="nk-audience-pill__label">${pill.label}</span>
        <button type="button" class="nk-audience-pill__remove" title="Remove ${pill.label}">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 52 52"><path fill="currentColor" d="M31.4 26l17-17c.8-.8.8-2 0-2.8l-2.8-2.8c-.8-.8-2-.8-2.8 0L26 20.6 9 3.4c-.8-.8-2-.8-2.8 0L3.4 6.2c-.8.8-.8 2 0 2.8l17 17-17 17c-.8.8-.8 2 0 2.8l2.8 2.8c.8.8 2 .8 2.8 0l17-17 17 17c.8.8 2 .8 2.8 0l2.8-2.8c.8-.8.8-2 0-2.8l-17-17z"/></svg>
        </button>
      `;
      el.querySelector('.nk-audience-pill__remove').addEventListener('click', () => {
        this.kbDataCategoryPills = this.kbDataCategoryPills.filter(p => p.id !== pill.id);
        this._renderDataCategoryPills();
      });
      container.appendChild(el);
    });
  }

  handleKbTranslationsToggle() {
    this.kbApplyTranslations = !this.kbApplyTranslations;
  }
  handleKbTranslationsToggleChange(event) {
    const checked = event.target.checked;
    this.kbApplyTranslations = checked;
    // Imperative DOM toggle — light DOM reactivity workaround
    const content = this.querySelector('.nk-tr-content');
    if (content) {
      content.style.display = checked ? '' : 'none';
    }
  }
  handleKbAudienceToggleChange(event) {
    const checked = event.target.checked;
    this.kbAudienceVisibility = checked;
    // Imperative DOM toggle — light DOM reactivity workaround
    const content = this.querySelector('.nk-audience-content');
    if (content) {
      content.style.display = checked ? '' : 'none';
    }
  }
  handleKbAudienceGroupChange(event) {
    this.kbAudienceUserGroup = event.target.value;
    this._updateAudienceDropdown();
  }

  handleKbAudienceSearchInput(event) {
    this.kbAudienceSearch = event.target.value;
    this._updateAudienceDropdown();
  }

  handleKbAudienceSearchFocus() {
    this._updateAudienceDropdown();
  }

  handleKbAudienceSearchBlur() {
    setTimeout(() => {
      const dropdown = this.querySelector('.nk-audience-dropdown');
      if (dropdown) dropdown.style.display = 'none';
    }, 200);
  }

  _updateAudienceDropdown() {
    const dropdown = this.querySelector('.nk-audience-dropdown');
    if (!dropdown) return;
    const search = (this.kbAudienceSearch || '').toLowerCase();
    const selectedIds = new Set(this.kbAudiencePills.map(p => p.id));
    const filtered = this._audienceLookupData.filter(item =>
      !selectedIds.has(item.id) &&
      item.group === this.kbAudienceUserGroup &&
      (search === '' || item.label.toLowerCase().includes(search))
    );
    if (filtered.length === 0) { dropdown.style.display = 'none'; return; }
    dropdown.innerHTML = filtered.map(item =>
      `<div class="nk-audience-dropdown__item" data-id="${item.id}" data-label="${item.label}">${item.label}</div>`
    ).join('');
    dropdown.style.display = 'block';
    dropdown.querySelectorAll('.nk-audience-dropdown__item').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this._addAudiencePill(el.dataset.id, el.dataset.label);
        dropdown.style.display = 'none';
        const input = this.querySelector('.nk-audience-grouped__lookup');
        if (input) { input.value = ''; this.kbAudienceSearch = ''; }
      });
    });
  }

  _addAudiencePill(id, label) {
    if (this.kbAudiencePills.some(p => p.id === id)) return;
    this.kbAudiencePills = [...this.kbAudiencePills, { id, label }];
    this._renderAudiencePills();
  }

  _renderAudiencePills() {
    const container = this.querySelector('.nk-audience-pills');
    if (!container) return;
    container.innerHTML = '';
    this.kbAudiencePills.forEach(pill => {
      const el = document.createElement('span');
      el.className = 'nk-audience-pill';
      el.innerHTML = `
        <span class="nk-audience-pill__label">${pill.label}</span>
        <button type="button" class="nk-audience-pill__remove" title="Remove ${pill.label}">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 52 52"><path fill="currentColor" d="M31.4 26l17-17c.8-.8.8-2 0-2.8l-2.8-2.8c-.8-.8-2-.8-2.8 0L26 20.6 9 3.4c-.8-.8-2-.8-2.8 0L3.4 6.2c-.8.8-.8 2 0 2.8l17 17-17 17c-.8.8-.8 2 0 2.8l2.8 2.8c.8.8 2 .8 2.8 0l17-17 17 17c.8.8 2 .8 2.8 0l2.8-2.8c.8-.8.8-2 0-2.8l-17-17z"/></svg>
        </button>
      `;
      el.querySelector('.nk-audience-pill__remove').addEventListener('click', () => {
        this.kbAudiencePills = this.kbAudiencePills.filter(p => p.id !== pill.id);
        this._renderAudiencePills();
      });
      container.appendChild(el);
    });
  }

  handleKbAudiencePillRemove(event) {
    const pillId = event.currentTarget.dataset.pillId;
    this.kbAudiencePills = this.kbAudiencePills.filter(p => p.id !== pillId);
    this._renderAudiencePills();
  }

  toggleKbSettings() { this.kbSettingsOpen = !this.kbSettingsOpen; }
  toggleKbTranslations() { this.kbTranslationsOpen = !this.kbTranslationsOpen; }
  toggleKbAudience() { this.kbAudienceOpen = !this.kbAudienceOpen; }

  get kbSettingsChevron() { return this.kbSettingsOpen ? 'utility:chevrondown' : 'utility:chevronright'; }
  get kbTranslationsChevron() { return this.kbTranslationsOpen ? 'utility:chevrondown' : 'utility:chevronright'; }
  get kbAudienceChevron() { return this.kbAudienceOpen ? 'utility:chevrondown' : 'utility:chevronright'; }
  get kbTranslationsToggleClass() { return this.kbApplyTranslations ? 'nk-toggle nk-toggle--on' : 'nk-toggle nk-toggle--off'; }
  get kbTranslationsToggleLabel() { return this.kbApplyTranslations ? 'Active' : 'Inactive'; }
  get kbTranslationsContentClass() { return this.kbApplyTranslations ? 'nk-tr-content' : 'nk-tr-content nk-tr-content--hidden'; }
  get kbTranslationsContentStyle() { return this.kbApplyTranslations ? '' : 'display:none'; }

  get kbLanguageOptions() {
    return [
      { label: 'Select...', value: '' },
      { label: 'English', value: 'en' },
      { label: 'French', value: 'fr' },
      { label: 'Spanish', value: 'es' },
      { label: 'German', value: 'de' },
      { label: 'Japanese', value: 'ja' },
      { label: 'Portuguese', value: 'pt' },
      { label: 'Chinese (Simplified)', value: 'zh' },
      { label: 'Italian', value: 'it' },
      { label: 'Dutch', value: 'nl' },
      { label: 'Korean', value: 'ko' },
    ];
  }

  get kbValueTypeOptions() {
    return [
      { label: 'Queue', value: 'queue' },
      { label: 'User', value: 'user' },
      { label: 'Role', value: 'role' },
    ];
  }

  get kbTranslationRows() {
    return this._kbTranslationRows.map(row => ({
      ...row,
      aiToggleClass: row.aiTranslations ? 'nk-toggle nk-toggle--on nk-toggle--sm' : 'nk-toggle nk-toggle--off nk-toggle--sm',
      aiToggleLabel: row.aiTranslations ? 'Active' : 'Inactive',
      showManualFields: !row.aiTranslations,
    }));
  }

  get hasKbTranslationRows() {
    return this._kbTranslationRows.length > 0;
  }

  handleAddTranslation() {
    const rowId = `tr-${Date.now()}`;
    this._kbTranslationRows = [
      ...this._kbTranslationRows,
      { id: rowId, language: '', aiTranslations: false, valueType: 'queue', valueLookup: '', date: '' },
    ];
    // Imperative DOM — light DOM reactivity workaround
    const container = this.querySelector('.nk-tr-rows-container');
    if (!container) return;

    const langOpts = this.kbLanguageOptions.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
    const valOpts = this.kbValueTypeOptions.map(o => `<option value="${o.value}">${o.label}</option>`).join('');

    const rowEl = document.createElement('div');
    rowEl.className = 'nk-tr-row';
    rowEl.dataset.rowId = rowId;
    rowEl.innerHTML = `
      <div class="nk-tr-col nk-tr-col--lang">
        <span class="nk-tr-col__label">Language</span>
        <div class="nk-tr-col__select-wrap">
          <select class="nk-tr-col__select" data-row-id="${rowId}">${langOpts}</select>
          <svg class="nk-tr-col__select-chevron" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 52 52"><path fill="currentColor" d="M8.3 14.3a1.1 1.1 0 0 0-1.5 0L3.5 17.5c-.4.4-.4 1.1 0 1.5l20.5 20.5c.4.4 1.1.4 1.5 0L46 19c.4-.4.4-1.1 0-1.5l-3.2-3.2c-.4-.4-1.1-.4-1.5 0L26 29.5 8.3 14.3z"/></svg>
        </div>
      </div>
      <div class="nk-tr-col nk-tr-col--ai">
        <span class="nk-tr-col__label">AI Translations</span>
        <label class="nk-native-toggle nk-native-toggle--sm">
          <input type="checkbox" data-row-id="${rowId}" />
          <span class="nk-native-toggle__track"></span>
        </label>
      </div>
      <div class="nk-tr-manual-fields">
        <div class="nk-tr-col nk-tr-col--value">
          <span class="nk-tr-col__label">Value</span>
          <div class="nk-tr-grouped">
            <div class="nk-tr-grouped__picklist">
              <select class="nk-tr-select" data-row-id="${rowId}">${valOpts}</select>
              <svg class="nk-tr-col__select-chevron" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 52 52"><path fill="currentColor" d="M8.3 14.3a1.1 1.1 0 0 0-1.5 0L3.5 17.5c-.4.4-.4 1.1 0 1.5l20.5 20.5c.4.4 1.1.4 1.5 0L46 19c.4-.4.4-1.1 0-1.5l-3.2-3.2c-.4-.4-1.1-.4-1.5 0L26 29.5 8.3 14.3z"/></svg>
            </div>
            <div class="nk-tr-grouped__lookup">
              <input type="text" class="nk-tr-lookup" placeholder="Search..." data-row-id="${rowId}" autocomplete="off" />
              <svg class="nk-tr-lookup__icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 52 52"><path fill="currentColor" d="M49.6 45.3 38.3 34c2.6-3.6 4.2-8 4.2-12.8C42.5 9.5 33 0 21.3 0S0 9.5 0 21.3s9.5 21.3 21.3 21.3c4.8 0 9.2-1.6 12.8-4.2l11.3 11.3c.6.6 1.5.6 2.1 0l2.1-2.1c.6-.7.6-1.7 0-2.3zM21.3 36.4c-8.4 0-15.2-6.8-15.2-15.2S12.9 6.1 21.3 6.1s15.2 6.8 15.2 15.2-6.9 15.1-15.2 15.1z"/></svg>
              <div class="nk-tr-value-dropdown" style="display:none"></div>
            </div>
          </div>
        </div>
        <div class="nk-tr-col nk-tr-col--date">
          <span class="nk-tr-col__label">Date</span>
          <input type="date" class="nk-tr-date" data-row-id="${rowId}" />
        </div>
      </div>
      <div class="nk-tr-ai-info" style="display:none">
        <svg class="nk-tr-ai-info-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 52 52"><path fill="#706e6b" d="M26 2C12.7 2 2 12.7 2 26s10.7 24 24 24 24-10.7 24-24S39.3 2 26 2zm0 12.1c1.7 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.3-3 3-3zm5 21c0 .5-.4.9-1 .9h-8c-.5 0-1-.3-1-.9v-2c0-.5.4-1.1 1-1.1.5 0 1-.3 1-.9v-4c0-.5-.4-1.1-1-1.1-.5 0-1-.3-1-.9v-2c0-.5.4-1.1 1-1.1h4c.5 0 1 .5 1 1.1v8c0 .5.4.9 1 .9.5 0 1 .5 1 1.1v2z"/></svg>
        <span class="nk-tr-ai-info-text">Assignment and due date are not applicable to Einstein translations</span>
      </div>
      <button type="button" class="nk-tr-remove-btn" data-row-id="${rowId}" title="Remove">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 52 52"><path fill="currentColor" d="M31.4 26l17-17c.8-.8.8-2 0-2.8l-2.8-2.8c-.8-.8-2-.8-2.8 0L26 20.6 9 3.4c-.8-.8-2-.8-2.8 0L3.4 6.2c-.8.8-.8 2 0 2.8l17 17-17 17c-.8.8-.8 2 0 2.8l2.8 2.8c.8.8 2 .8 2.8 0l17-17 17 17c.8.8 2 .8 2.8 0l2.8-2.8c.8-.8.8-2 0-2.8l-17-17z"/></svg>
      </button>
    `;

    // Wire up AI toggle
    const aiToggle = rowEl.querySelector('input[type="checkbox"]');
    aiToggle.addEventListener('change', (e) => {
      const checked = e.target.checked;
      const manual = rowEl.querySelector('.nk-tr-manual-fields');
      const aiInfo = rowEl.querySelector('.nk-tr-ai-info');
      if (manual) manual.style.display = checked ? 'none' : '';
      if (aiInfo) aiInfo.style.display = checked ? '' : 'none';
      this._kbTranslationRows = this._kbTranslationRows.map(r =>
        r.id === rowId ? { ...r, aiTranslations: checked } : r
      );
    });

    // Wire up remove button
    const removeBtn = rowEl.querySelector('.nk-tr-remove-btn');
    removeBtn.addEventListener('click', () => {
      rowEl.remove();
      this._kbTranslationRows = this._kbTranslationRows.filter(r => r.id !== rowId);
    });

    // Wire up Value lookup search
    const lookupInput = rowEl.querySelector('.nk-tr-lookup');
    const lookupDropdown = rowEl.querySelector('.nk-tr-value-dropdown');
    const typeSelect = rowEl.querySelector('.nk-tr-select');
    let currentType = 'queue';

    typeSelect.addEventListener('change', () => {
      currentType = typeSelect.value;
      if (lookupInput === document.activeElement) {
        updateValueDropdown();
      }
    });

    const updateValueDropdown = () => {
      const search = (lookupInput.value || '').toLowerCase();
      const filtered = this._translationValueLookupData.filter(item =>
        item.type === currentType &&
        (search === '' || item.label.toLowerCase().includes(search))
      );
      if (filtered.length === 0) {
        lookupDropdown.style.display = 'none';
        return;
      }
      lookupDropdown.innerHTML = filtered.map(item =>
        `<div class="nk-tr-value-dropdown__item" data-label="${item.label}">${item.label}</div>`
      ).join('');
      lookupDropdown.style.display = 'block';
      lookupDropdown.querySelectorAll('.nk-tr-value-dropdown__item').forEach(el => {
        el.addEventListener('mousedown', (e) => {
          e.preventDefault();
          lookupInput.value = el.dataset.label;
          lookupDropdown.style.display = 'none';
        });
      });
    };

    lookupInput.addEventListener('input', updateValueDropdown);
    lookupInput.addEventListener('focus', updateValueDropdown);
    lookupInput.addEventListener('blur', () => {
      setTimeout(() => { lookupDropdown.style.display = 'none'; }, 200);
    });

    container.appendChild(rowEl);
  }

  handleRemoveTranslationRow(event) {
    const rowId = event.currentTarget.dataset.rowId;
    this._kbTranslationRows = this._kbTranslationRows.filter(r => r.id !== rowId);
  }

  handleTranslationLanguageChange(event) {
    const rowId = event.currentTarget.dataset.rowId;
    const value = event.detail ? event.detail.value : event.target.value;
    this._kbTranslationRows = this._kbTranslationRows.map(r =>
      r.id === rowId ? { ...r, language: value } : r
    );
  }

  handleTranslationAiToggleChange(event) {
    const rowId = event.target.dataset.rowId;
    const checked = event.target.checked;
    this._kbTranslationRows = this._kbTranslationRows.map(r =>
      r.id === rowId ? { ...r, aiTranslations: checked } : r
    );
    // Imperative DOM toggle — light DOM reactivity workaround
    const row = event.target.closest('.nk-tr-row');
    if (row) {
      const manualFields = row.querySelector('.nk-tr-manual-fields');
      const aiInfo = row.querySelector('.nk-tr-ai-info');
      if (manualFields) manualFields.style.display = checked ? 'none' : '';
      if (aiInfo) aiInfo.style.display = checked ? '' : 'none';
    }
  }

  handleTranslationValueTypeChange(event) {
    const rowId = event.currentTarget.dataset.rowId;
    const value = event.detail ? event.detail.value : event.target.value;
    this._kbTranslationRows = this._kbTranslationRows.map(r =>
      r.id === rowId ? { ...r, valueType: value } : r
    );
  }

  handleTranslationValueLookupChange(event) {
    const rowId = event.currentTarget.dataset.rowId;
    this._kbTranslationRows = this._kbTranslationRows.map(r =>
      r.id === rowId ? { ...r, valueLookup: event.target.value } : r
    );
  }

  handleTranslationDateChange(event) {
    const rowId = event.currentTarget.dataset.rowId;
    this._kbTranslationRows = this._kbTranslationRows.map(r =>
      r.id === rowId ? { ...r, date: event.target.value } : r
    );
  }
  get kbAudienceToggleClass() { return this.kbAudienceVisibility ? 'nk-toggle nk-toggle--on' : 'nk-toggle nk-toggle--off'; }
  get kbAudienceToggleLabel() { return this.kbAudienceVisibility ? 'Active' : 'Inactive'; }

  /* Stepper aria getters — the page footer renders an SLDS 2 Progress
     Indicator with 2 steps regardless of whether the similarity check is
     part of the flow. Internal step 3 (Metadata) maps to display step 2;
     internal steps 1 (Details) and 2 (Similarity) both map to display
     step 1, since similarity is a validation gate inside the authoring
     phase from the user's point of view. */
  get stepperAriaLabel() {
    return `Step ${this.stepperAriaValueNow} of 2`;
  }

  get stepperAriaValueNow() {
    return this._currentStep === 3 ? 2 : 1;
  }

  get stepperAriaValueMax() {
    return 2;
  }

  /* SLDS 2 progress-indicator: 2-step flow.
     `currentProgressStep` matches the value of the active step. */
  get currentProgressStep() {
    return this.stepperAriaValueNow === 1 ? 'step-1' : 'step-2';
  }

  get simArticle1Expanded() { return !!this._expandedArticles['sim-1']; }
  get simArticle2Expanded() { return !!this._expandedArticles['sim-2']; }
  get simArticle3Expanded() { return !!this._expandedArticles['sim-3']; }
  get simArticle1Chevron() { return this._expandedArticles['sim-1'] ? 'utility:chevrondown' : 'utility:chevronright'; }
  get simArticle2Chevron() { return this._expandedArticles['sim-2'] ? 'utility:chevrondown' : 'utility:chevronright'; }
  get simArticle3Chevron() { return this._expandedArticles['sim-3'] ? 'utility:chevrondown' : 'utility:chevronright'; }

  get step2ValidationStatusOptions() {
    return VALIDATION_STATUS_OPTIONS;
  }

  get step2WorkflowStatusOptions() {
    return WORKFLOW_STATUS_OPTIONS;
  }

  get step2LanguageOptions() {
    return LANGUAGE_OPTIONS;
  }

  // ── Resources panel ────────────────────────────────────────

  get isResourcesPanelCollapsed() {
    return !this.resourcesPanelOpen;
  }

  get isResourcesPanelExpanded() {
    return this.resourcesPanelOpen;
  }

  get showResourcesPanelCollapsed() {
    return this.isStep1 && this.isResourcesPanelCollapsed && !this.skipSimilarityStep;
  }

  get showResourcesPanelExpanded() {
    return this.isStep1 && this.isResourcesPanelExpanded && !this.skipSimilarityStep;
  }

  get knowledgeArticles() {
    return KNOWLEDGE_ARTICLES;
  }

  get isBlocksTabActive() {
    return this.resourcesPanelTab === 'blocks';
  }

  get isNotebookAiTabActive() {
    return this.resourcesPanelTab === 'notebook-ai';
  }

  get filteredKnowledgeArticles() {
    const term = (this.resourceSearchTerm || '').trim().toLowerCase();
    if (!term) return KNOWLEDGE_ARTICLES;
    return KNOWLEDGE_ARTICLES.filter(
      (a) =>
        (a.title && a.title.toLowerCase().includes(term)) ||
        (a.source && a.source.toLowerCase().includes(term))
    );
  }

  get hasNoBlockSearchResults() {
    return this.resourcesPanelTab === 'blocks' && this.filteredKnowledgeArticles.length === 0;
  }

  get blocksPanelClass() {
    return this.resourcesPanelTab === 'blocks' ? 'nk-rp-list' : 'nk-rp-list nk-rp-panel--hidden';
  }

  get notebookPanelClass() {
    return this.resourcesPanelTab === 'notebook-ai'
      ? 'nk-rp-list nk-rp-notebook'
      : 'nk-rp-list nk-rp-panel--hidden';
  }

  // ── Notebook AI ────────────────────────────────────────────

  get hasNoNotebookSources() {
    return this._notebookSources.length === 0;
  }

  get hasNotebookSources() {
    return this._notebookSources.length > 0;
  }

  get notebookSources() {
    return this._notebookSources;
  }

  _sourceRowViewModels(section) {
    return this._notebookSources
      .filter((s) => s.section === section)
      .map((s) => ({
        ...s,
        selected: !!this._sourceSelections[s.id],
        rowClass: `nk-nb-source-row${this._sourceSelections[s.id] ? ' nk-nb-source-row--selected' : ''}`,
      }));
  }

  get myResourcesSources() {
    return this._sourceRowViewModels('my');
  }

  get enterpriseResourcesSources() {
    return this._sourceRowViewModels('enterprise');
  }

  get hasMyResourcesSources() {
    return this._notebookSources.some((s) => s.section === 'my');
  }

  get hasEnterpriseResourcesSources() {
    return this._notebookSources.some((s) => s.section === 'enterprise');
  }

  get allSourcesSelected() {
    if (!this._notebookSources.length) return false;
    return this._notebookSources.every((s) => this._sourceSelections[s.id]);
  }

  get generatedContentChevronIcon() {
    return this.notebookGeneratedContentOpen ? 'utility:chevrondown' : 'utility:chevronright';
  }

  get hasGeneratedContent() {
    return this._generatedItems.length > 0;
  }

  get showGenerateArea() {
    return !this.hasGeneratedContent && !this._isGenerating;
  }

  get generatedItems() {
    return this._generatedItems.map((item) => ({
      ...item,
      overflowOpen: this._openOverflowId === item.id,
      overflowMenuClass: `nk-nb-generated__overflow-menu${this._openOverflowId === item.id ? ' nk-nb-generated__overflow-menu--open' : ''}`,
      overflowMenuStyle: this._openOverflowId === item.id ? this._nbOverflowMenuStyle : '',
    }));
  }

  _updateNbOverflowMenuPosition() {
    if (!this._openOverflowId) {
      this._nbOverflowMenuStyle = '';
      return;
    }
    const host = this.querySelector(`lightning-button-icon[data-item-id="${this._openOverflowId}"]`);
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const menuMinW = 160;
    const gap = 4;
    let left = rect.right - menuMinW;
    left = Math.max(8, Math.min(left, window.innerWidth - menuMinW - 8));
    const top = rect.bottom + gap;
    this._nbOverflowMenuStyle = `top:${Math.round(top)}px;left:${Math.round(left)}px;right:auto;`;
  }

  _attachNbOverflowWindowListeners() {
    if (this._nbOverflowListenersAttached) return;
    window.addEventListener('resize', this._onNbOverflowReposition);
    document.addEventListener('scroll', this._onNbOverflowReposition, true);
    this._nbOverflowListenersAttached = true;
  }

  _detachNbOverflowWindowListeners() {
    if (!this._nbOverflowListenersAttached) return;
    window.removeEventListener('resize', this._onNbOverflowReposition);
    document.removeEventListener('scroll', this._onNbOverflowReposition, true);
    this._nbOverflowListenersAttached = false;
  }

  _closeNbOverflowMenu() {
    this._openOverflowId = null;
    this._nbOverflowMenuStyle = '';
    this._detachNbOverflowWindowListeners();
  }

  get generateAreaMessage() {
    return this.hasNotebookSources
      ? 'Sources added. Click Generate to create content.'
      : 'Add sources to generate content.';
  }

  // ── Generate Content Modal ──────────────────────────────────

  get gcDescription() { return this._gcDescription; }
  get gcLength() { return this._gcLength; }
  get gcTone() { return this._gcTone; }


  get gcLengthOptions() {
    return [
      { label: 'Short', value: 'short' },
      { label: 'Medium', value: 'medium' },
      { label: 'Long', value: 'long' },
    ];
  }

  get gcToneOptions() {
    return [
      { label: 'Professional', value: 'professional' },
      { label: 'Casual', value: 'casual' },
      { label: 'Friendly', value: 'friendly' },
      { label: 'Technical', value: 'technical' },
      { label: 'Formal', value: 'formal' },
    ];
  }

  handleRemoveNotebookSource(event) {
    const sourceId = event.currentTarget.dataset.sourceId;
    this._notebookSources = this._notebookSources.filter((s) => s.id !== sourceId);
    const updated = { ...this._sourceSelections };
    delete updated[sourceId];
    this._sourceSelections = updated;
  }

  handleToggleSourceSelect(event) {
    const sourceId = event.currentTarget.dataset.sourceId;
    this._sourceSelections = {
      ...this._sourceSelections,
      [sourceId]: !this._sourceSelections[sourceId],
    };
  }

  handleToggleAllSourcesSelect(event) {
    const checked = event.target.checked;
    const next = {};
    this._notebookSources.forEach((s) => { next[s.id] = checked; });
    this._sourceSelections = next;
  }

  handleToggleGeneratedContent() {
    this.notebookGeneratedContentOpen = !this.notebookGeneratedContentOpen;
  }

  handleGenerateContent() {
    if (!this._notebookSources.length) return;
    this._gcDescription = '';
    this._gcLength = 'medium';
    this._gcTone = 'professional';
    this.generateContentModalOpen = true;
  }

  handleCloseGenerateContentModal() {
    this.generateContentModalOpen = false;
  }

  handleGcModalContentClick(event) {
    event.stopPropagation();
  }

  // ── "Check Similar Articles" modal handlers ───────────────
  // Decorates the seed list with per-row view state (archived flag,
  // status badge classes, action column branch) so the template can
  // render with simple bindings instead of branching per article.
  get similarArticles() {
    const archived = this._similarArticlesArchived || {};
    return this._similarArticlesSeed.map((article) => {
      const isArchived = !!archived[article.id];
      const isSuccess = article.statusVariant === 'success';
      return {
        ...article,
        archived: isArchived,
        statusIsSuccess: isSuccess,
        statusBadgeClass: isSuccess
          ? 'slds-badge nk-cs-row__status-badge nk-cs-row__status-badge--success'
          : 'slds-badge slds-badge_lightest nk-cs-row__status-badge',
        rowClass: isArchived ? 'nk-cs-row nk-cs-row--archived' : 'nk-cs-row',
      };
    });
  }

  get checkSimilarIntroTitle() {
    const t = (this.articleTitle || '').trim();
    return t || 'New Knowledge Article';
  }

  handleOpenCheckSimilarModal() {
    this._similarArticlesArchived = {};
    this.checkSimilarModalOpen = true;
  }

  handleCloseCheckSimilarModal() {
    this.checkSimilarModalOpen = false;
  }

  handleCsModalContentClick(event) {
    event.stopPropagation();
  }

  handleArchiveSimilarArticle(event) {
    const id = event.currentTarget && event.currentTarget.dataset
      ? event.currentTarget.dataset.id
      : null;
    if (!id) return;
    this._similarArticlesArchived = {
      ...this._similarArticlesArchived,
      [id]: true,
    };
    const article = this._similarArticlesSeed.find((a) => a.id === id);
    const label = article && article.title ? `"${article.title}"` : 'Article';
    this.dispatchEvent(
      new CustomEvent('kbtoast', {
        bubbles: true,
        composed: true,
        detail: { message: `${label} has been archived.` },
      })
    );
  }

  handleGcDescriptionInput(event) {
    this._gcDescription = event.target.value;
  }

  handleGcLengthChange(event) {
    this._gcLength = event.detail.value;
  }

  handleGcToneChange(event) {
    this._gcTone = event.detail.value;
  }

  handleConfirmGenerateContent() {
    const activeSources = this._notebookSources.filter((s) => this._sourceSelections[s.id]);
    const sourcesUsed = activeSources.length ? activeSources : this._notebookSources;
    const sourceNames = sourcesUsed.map((s) => s.name).join(', ');
    const lengthMap = { short: 'concise', medium: 'comprehensive', long: 'detailed and extensive' };
    const toneLabel = this._gcTone.charAt(0).toUpperCase() + this._gcTone.slice(1);
    const lengthTag = this._gcLength.charAt(0).toUpperCase() + this._gcLength.slice(1);
    const newItemId = `gc-${Date.now()}`;
    const title = this._gcDescription.trim() || `Generated from ${sourcesUsed.length} source${sourcesUsed.length !== 1 ? 's' : ''}`;

    const lengthInstruction = lengthMap[this._gcLength] || 'comprehensive';
    const descInstruction = this._gcDescription.trim()
      ? `Focus specifically on: ${this._gcDescription.trim()}.`
      : '';
    const prompt = `You are a knowledge base content writer. Generate a ${lengthInstruction}, ${this._gcTone}-toned knowledge article drawing from the following sources: ${sourceNames}. ${descInstruction} Write clear, structured prose suitable for a professional knowledge base. Do not include headings or markdown — output plain text only.`;

    this.generateContentModalOpen = false;
    this._isGenerating = true;
    this._generateError = null;
    this.notebookGeneratedContentOpen = true;

    const regeneratingId = this._regeneratingItemId;
    this._regeneratingItemId = null;

    fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 },
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.error) {
          throw new Error(data.error.message || 'Gemini API error');
        }
        const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!generatedText) {
          throw new Error('No content returned from Gemini. Please try again.');
        }

        const newItem = {
          id: regeneratingId || newItemId,
          title,
          text: generatedText.trim(),
          toneTag: toneLabel,
          lengthTag,
          lengthLabel: `${lengthTag} length`,
          sources: sourcesUsed.map((s) => ({ id: s.id, name: s.name })),
          sourceCount: sourcesUsed.length,
        };

        if (regeneratingId) {
          this._generatedItems = this._generatedItems.map((item) =>
            item.id === regeneratingId ? newItem : item
          );
        } else {
          this._generatedItems = [...this._generatedItems, newItem];
        }
        this._isGenerating = false;
      })
      .catch((err) => {
        this._isGenerating = false;
        this._generateError = err.message || 'Something went wrong. Please try again.';
      });
  }

  get isGenerating() {
    return this._isGenerating;
  }

  get generateError() {
    return this._generateError;
  }

  handleToggleGcOverflow(event) {
    event.stopPropagation();
    const itemId = event.currentTarget.dataset.itemId;
    if (this._openOverflowId === itemId) {
      this._closeNbOverflowMenu();
      return;
    }
    this._openOverflowId = itemId;
    this._nbOverflowMenuStyle = '';
    this._attachNbOverflowWindowListeners();
  }

  handlePostGeneratedContent(event) {
    const itemId = event.currentTarget.dataset.itemId;
    const item = this._generatedItems.find((i) => i.id === itemId);
    if (!item) return;

    const editor = this.querySelector('.nk-rte__editor[data-id="detailsEditor"]');
    if (editor) {
      const existingContent = editor.innerHTML.trim();
      const generatedHtml = `<p>${item.text}</p>`;
      editor.innerHTML = existingContent ? `${existingContent}\n${generatedHtml}` : generatedHtml;
    }
    this._closeNbOverflowMenu();
    // Item intentionally kept in the list after adding to editor
  }

  handleRegenerateContent(event) {
    this._regeneratingItemId = event.currentTarget.dataset.itemId || null;
    this._closeNbOverflowMenu();
    this.handleGenerateContent();
  }

  // ── Add Sources Modal ───────────────────────────────────────

  get isFileUploadTabActive() { return this._addSourcesTab === 'file-upload'; }
  get isLinksTabActive() { return this._addSourcesTab === 'links'; }
  get isExternalAppsTabActive() { return this._addSourcesTab === 'external-apps'; }
  get isImportLibraryTabActive() { return this._addSourcesTab === 'import-library'; }

  get fileUploadTabClass() { return `nk-as-tab${this.isFileUploadTabActive ? ' nk-as-tab--active' : ''}`; }
  get linksTabClass() { return `nk-as-tab${this.isLinksTabActive ? ' nk-as-tab--active' : ''}`; }
  get externalAppsTabClass() { return `nk-as-tab${this.isExternalAppsTabActive ? ' nk-as-tab--active' : ''}`; }
  get importLibraryTabClass() { return `nk-as-tab${this.isImportLibraryTabActive ? ' nk-as-tab--active' : ''}`; }

  get pendingFiles() { return this._pendingFiles; }
  get hasPendingFiles() { return this._pendingFiles.length > 0; }
  get maxFilesReached() { return this._pendingFiles.length >= 5; }
  get showUploadZone() { return !this.maxFilesReached; }
  get pendingLinks() { return this._pendingLinks; }
  get hasPendingLinks() { return this._pendingLinks.length > 0; }
  get linkInputValue() { return this._linkInputValue; }

  get uploadZoneClass() {
    return `nk-as-upload-zone${this._isDragOver ? ' nk-as-upload-zone--drag-over' : ''}`;
  }

  get addFilesDisabled() {
    if (this.isFileUploadTabActive) return !this.hasPendingFiles;
    if (this.isLinksTabActive) return !this.hasPendingLinks;
    if (this.isImportLibraryTabActive) return !this.hasImportLibrarySelection;
    return true;
  }

  get addFilesLabel() {
    if (this.isLinksTabActive) return 'Add Links';
    return 'Add Files';
  }

  // ── Import Library (file selection panel) ──────────────────

  get myResourcesFiles() {
    return MY_RESOURCES_FILES.map((f) => ({
      ...f,
      selected: this._selectedFileIds.includes(f.id),
      rowClass: `nk-fs-file-row${this._selectedFileIds.includes(f.id) ? ' nk-fs-file-row--selected' : ''}`,
    }));
  }

  get enterpriseResourcesFiles() {
    return ENTERPRISE_RESOURCES_FILES.map((f) => ({
      ...f,
      selected: this._selectedFileIds.includes(f.id),
      rowClass: `nk-fs-file-row${this._selectedFileIds.includes(f.id) ? ' nk-fs-file-row--selected' : ''}`,
    }));
  }

  get myResourcesAllSelected() {
    return (
      MY_RESOURCES_FILES.length > 0 &&
      MY_RESOURCES_FILES.every((f) => this._selectedFileIds.includes(f.id))
    );
  }

  get enterpriseResourcesAllSelected() {
    return (
      ENTERPRISE_RESOURCES_FILES.length > 0 &&
      ENTERPRISE_RESOURCES_FILES.every((f) => this._selectedFileIds.includes(f.id))
    );
  }

  get hasImportLibrarySelection() {
    return this._selectedFileIds.length > 0;
  }

  get selectedImportFileCount() {
    return this._selectedFileIds.length;
  }

  get selectedImportFileCountLabel() {
    const n = this._selectedFileIds.length;
    return `${n} ${n === 1 ? 'file' : 'files'} selected`;
  }

  handleAddSources() {
    this._pendingFiles = [];
    this._pendingLinks = [];
    this._linkInputValue = '';
    this.addSourcesModalOpen = true;
  }

  handleCloseAddSourcesModal() {
    this.addSourcesModalOpen = false;
    this._pendingFiles = [];
    this._pendingLinks = [];
    this._linkInputValue = '';
    this._selectedFileIds = [];
  }

  handleModalContentClick(event) {
    event.stopPropagation();
  }

  handleAddSourcesTab(event) {
    this._addSourcesTab = event.currentTarget.dataset.tab;
  }

  _getDoctypeIcon(filename) {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    const map = {
      xls: 'doctype:excel', xlsx: 'doctype:excel',
      doc: 'doctype:word', docx: 'doctype:word',
      pdf: 'doctype:pdf',
      txt: 'doctype:txt',
      csv: 'doctype:csv',
      png: 'doctype:image', jpg: 'doctype:image', jpeg: 'doctype:image', gif: 'doctype:image', webp: 'doctype:image',
      ppt: 'doctype:ppt', pptx: 'doctype:ppt',
      zip: 'doctype:zip',
    };
    return map[ext] || 'doctype:unknown';
  }

  _getFileType(filename) {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    const map = {
      xls: 'Excel', xlsx: 'Excel',
      doc: 'Word', docx: 'Word',
      pdf: 'PDF', txt: 'Text', csv: 'CSV',
      png: 'Image', jpg: 'Image', jpeg: 'Image', gif: 'Image', webp: 'Image',
      ppt: 'PowerPoint', pptx: 'PowerPoint',
      zip: 'ZIP',
    };
    return map[ext] || ext.toUpperCase();
  }

  _formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  _mapFileObject(f) {
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const sizeLabel = this._formatFileSize(f.size);
    const typeLabel = this._getFileType(f.name);
    return {
      name: f.name,
      doctypeIcon: this._getDoctypeIcon(f.name),
      typeLabel,
      sizeLabel,
      meta: `${dateStr} \u2022 ${sizeLabel} \u2022 ${typeLabel}`,
      status: 'uploading',
      progressFillClass: 'nk-as-file-progress__fill nk-as-file-progress__fill--uploading',
      progressLabel: 'Uploading…',
      actionIcon: 'utility:close',
      actionAltText: 'Cancel upload',
    };
  }

  _startUploadTimer(fileName) {
    if (!this._uploadTimers) this._uploadTimers = {};
    const timerId = setTimeout(() => {
      this._pendingFiles = this._pendingFiles.map((f) => {
        if (f.name !== fileName) return f;
        return {
          ...f,
          status: 'complete',
          progressFillClass: 'nk-as-file-progress__fill nk-as-file-progress__fill--complete',
          progressLabel: 'Upload complete',
          actionIcon: 'utility:delete',
          actionAltText: 'Remove file',
        };
      });
      delete this._uploadTimers[fileName];
    }, 2000);
    this._uploadTimers[fileName] = timerId;
  }

  handleFileInputChange(event) {
    const files = Array.from(event.target.files || []);
    const slots = 5 - this._pendingFiles.length;
    const toAdd = files.slice(0, slots).map((f) => this._mapFileObject(f));
    this._pendingFiles = [...this._pendingFiles, ...toAdd];
    toAdd.forEach((f) => this._startUploadTimer(f.name));
    // reset so the same file can be re-selected after removal
    event.target.value = '';
  }

  handleDragOver(event) {
    event.preventDefault();
    this._isDragOver = true;
  }

  handleDragLeave() {
    this._isDragOver = false;
  }

  handleDrop(event) {
    event.preventDefault();
    this._isDragOver = false;
    const files = Array.from(event.dataTransfer.files || []);
    const slots = 5 - this._pendingFiles.length;
    const toAdd = files.slice(0, slots).map((f) => this._mapFileObject(f));
    this._pendingFiles = [...this._pendingFiles, ...toAdd];
    toAdd.forEach((f) => this._startUploadTimer(f.name));
  }

  handleFileRowAction(event) {
    const fileName = event.currentTarget.dataset.fileName;
    // Clear pending upload timer if still in progress
    if (this._uploadTimers && this._uploadTimers[fileName]) {
      clearTimeout(this._uploadTimers[fileName]);
      delete this._uploadTimers[fileName];
    }
    this._pendingFiles = this._pendingFiles.filter((f) => f.name !== fileName);
  }

  handleRemovePendingFile(event) {
    this.handleFileRowAction(event);
  }

  handleLinkInputChange(event) {
    this._linkInputValue = event.target.value;
  }

  handleAddLink() {
    const url = this._linkInputValue.trim();
    if (!url) return;
    this._pendingLinks = [...this._pendingLinks, { id: `link-${Date.now()}`, url }];
    this._linkInputValue = '';
  }

  handleRemovePendingLink(event) {
    const id = event.currentTarget.dataset.linkId;
    this._pendingLinks = this._pendingLinks.filter((l) => l.id !== id);
  }

  handleConfirmAddSources() {
    if (this.isImportLibraryTabActive) {
      this._handleConfirmImportLibrary();
      return;
    }
    const newSources = [];
    this._pendingFiles.forEach((f) => {
      newSources.push({ id: `file-${Date.now()}-${f.name}`, type: 'file', name: f.name, meta: f.meta || f.sizeLabel, icon: f.doctypeIcon || 'utility:file', section: 'my' });
    });
    this._pendingLinks.forEach((l) => {
      newSources.push({ id: l.id, type: 'link', name: l.url, meta: 'Link', icon: 'utility:link', section: 'my' });
    });
    this._notebookSources = [...this._notebookSources, ...newSources];
    this.addSourcesModalOpen = false;
    this._pendingFiles = [];
    this._pendingLinks = [];
    this._linkInputValue = '';
  }

  _handleConfirmImportLibrary() {
    const newSources = this._selectedFileIds
      .map((id) => {
        const myFile = MY_RESOURCES_FILES.find((f) => f.id === id);
        if (myFile) return { id: `lib-${id}-${Date.now()}`, type: 'file', name: myFile.name, meta: myFile.meta, icon: myFile.icon, section: 'my' };
        const entFile = ENTERPRISE_RESOURCES_FILES.find((f) => f.id === id);
        if (entFile) return { id: `lib-${id}-${Date.now()}`, type: 'file', name: entFile.name, meta: entFile.meta, icon: entFile.icon, section: 'enterprise' };
        return null;
      })
      .filter(Boolean);
    this._notebookSources = [...this._notebookSources, ...newSources];
    this.addSourcesModalOpen = false;
    this._selectedFileIds = [];
  }

  handleToggleFileSelect(event) {
    const fileId = event.currentTarget.dataset.fileId;
    if (this._selectedFileIds.includes(fileId)) {
      this._selectedFileIds = this._selectedFileIds.filter((id) => id !== fileId);
    } else {
      this._selectedFileIds = [...this._selectedFileIds, fileId];
    }
  }

  handleToggleMyResourcesSelectAll(event) {
    const allIds = MY_RESOURCES_FILES.map((f) => f.id);
    if (event.target.checked) {
      this._selectedFileIds = Array.from(new Set([...this._selectedFileIds, ...allIds]));
    } else {
      this._selectedFileIds = this._selectedFileIds.filter((id) => !allIds.includes(id));
    }
  }

  handleToggleEnterpriseSelectAll(event) {
    const allIds = ENTERPRISE_RESOURCES_FILES.map((f) => f.id);
    if (event.target.checked) {
      this._selectedFileIds = Array.from(new Set([...this._selectedFileIds, ...allIds]));
    } else {
      this._selectedFileIds = this._selectedFileIds.filter((id) => !allIds.includes(id));
    }
  }

  handleAddMoreLibraryFiles() {
    this._addSourcesTab = 'file-upload';
  }

  handleResourcesPanelTab(event) {
    this.resourcesPanelTab = event.currentTarget.dataset.tab || 'blocks';
  }

  handleExpandResources() {
    this.resourcesPanelOpen = true;
  }

  handleCollapseResources() {
    this.resourcesPanelOpen = false;
  }

  handleResourceSearch(event) {
    this.resourceSearchTerm = event.detail ? event.detail.value : event.target.value;
  }

  handleResourceSearchInput(event) {
    this.resourceSearchTerm = event.target.value;
  }

  handleKbTitleClick(event) {
    const articleId = event.currentTarget.dataset.articleId;
    const article = KNOWLEDGE_ARTICLES.find((a) => a.id === articleId);
    if (!article) return;
    this.dispatchEvent(
      new CustomEvent('openkbdetail', {
        bubbles: true,
        composed: true,
        detail: {
          id: article.id,
          title: article.title,
          summary: article.description || '',
          detailsContent: article.content || '',
        },
      })
    );
  }

  handleAddKnowledgeBlock(event) {
    const articleId = event.currentTarget.dataset.articleId;
    const article = KNOWLEDGE_ARTICLES.find((a) => a.id === articleId);
    if (!article) return;

    const blockContent = article.content || `<b>${article.title}</b><br><i>Source: ${article.source}</i>`;
    const blockHtml = `<div class="nk-knowledge-block" contenteditable="false">${blockContent}</div><p><br></p>`;

    const editor = this.detailsEditor;
    if (!editor) return;

    editor.focus();
    const selection = window.getSelection();

    // If cursor is inside the editor, insert at cursor; otherwise append at end
    if (selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const temp = document.createElement('div');
      temp.innerHTML = blockHtml;
      const frag = document.createDocumentFragment();
      let lastNode;
      while (temp.firstChild) {
        lastNode = frag.appendChild(temp.firstChild);
      }
      range.insertNode(frag);
      // Move cursor after the inserted block
      if (lastNode) {
        const newRange = document.createRange();
        newRange.setStartAfter(lastNode);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    } else {
      editor.innerHTML += blockHtml;
    }
  }

  // ── Selection popover ──────────────────────────────────────

  get showSelectionPopover() {
    return this._popoverVisible;
  }

  get selectionPopoverStyle() {
    return `top:${this._popoverTop}px;left:${this._popoverLeft}px`;
  }

  _checkSelection() {
    const editor = this.detailsEditor;
    if (!editor) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      this._popoverVisible = false;
      this._savedRange = null;
      return;
    }

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      this._popoverVisible = false;
      this._savedRange = null;
      return;
    }

    this._savedRange = range.cloneRange();

    const wrapEl = editor.closest('.nk-rte__editor-wrap');
    if (!wrapEl) return;

    const rect = range.getBoundingClientRect();
    const wrapRect = wrapEl.getBoundingClientRect();

    this._popoverLeft = rect.left + rect.width / 2 - wrapRect.left;
    this._popoverTop = rect.top - wrapRect.top - 44;
    this._popoverVisible = true;
  }

  handleEditorMouseUp() {
    setTimeout(() => this._checkSelection(), 10);
  }

  handleEditorKeyUp() {
    setTimeout(() => this._checkSelection(), 10);
  }

  handleDeleteSelection(e) {
    e.preventDefault();
    const editor = this.detailsEditor;
    if (!editor || !this._savedRange) return;

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(this._savedRange);
    this._savedRange.deleteContents();
    this._popoverVisible = false;
    this._savedRange = null;
  }

  handleAddFromSelection(e) {
    e.preventDefault();
    this._popoverVisible = false;
    this._createBlockOpen = true;

    const selectedText = this._savedRange ? this._savedRange.toString() : '';
    this._blockSelectedText = selectedText.trim();
    this.blockShortDescription = selectedText.trim().substring(0, 80) || '';
  }

  // ── Create a Block modal ──────────────────────────────────

  _blockSelectedText = '';

  get blockSelectedText() {
    return this._blockSelectedText;
  }

  get showCreateBlockPanel() {
    return this._createBlockOpen;
  }

  handleSaveBlock() {
    this._createBlockOpen = false;

    // Wrap the originally selected text with a grey boundary to mark it as a block
    if (this._savedRange) {
      const _buildWrapper = () => {
        const wrapper = document.createElement('div');
        wrapper.className = 'nk-created-block-boundary';
        wrapper.setAttribute('contenteditable', 'false');
        // Inline styles required: LWC may not apply scoped CSS to imperatively created nodes.
        // Tight inline-block + fit-content so the dashed border hugs the selection, not full width.
        wrapper.style.cssText = [
          'display:inline-block',
          'vertical-align:top',
          'width:fit-content',
          'max-width:100%',
          'box-sizing:border-box',
          'border:1px dashed #5c5c5c',
          'border-radius:4px',
          'padding:2px 6px',
          'margin:2px 0',
          'background-color:#fff',
          'cursor:default',
          'user-select:text',
          'font-size:13px',
          'line-height:1.45',
          'color:#2e2e2e',
        ].join(';');
        return wrapper;
      };

      try {
        const wrapper = _buildWrapper();
        this._savedRange.surroundContents(wrapper);
      } catch (_ex) {
        // surroundContents fails if selection spans partial elements; use extractContents instead
        try {
          const wrapper = _buildWrapper();
          const contents = this._savedRange.extractContents();
          wrapper.appendChild(contents);
          this._savedRange.insertNode(wrapper);
        } catch (_e) { /* gracefully skip if it still fails */ }
      }
      this._savedRange = null;
    }

    this._blockSelectedText = '';
    this._modalDataCatPills = [];
    this._modalAudiencePills = [];
    this.dispatchEvent(new CustomEvent('blockcreated', {
      bubbles: true,
      composed: true,
      detail: { blockTitle: this.blockShortDescription || 'Knowledge Block' },
    }));
  }

  // ── Modal: Section collapse/expand (imperative) ───────────
  _toggleModalSection(event, bodyClass) {
    const header = event.currentTarget;
    const section = header.closest('.nk-cb-section');
    if (!section) return;
    const body = section.querySelector(`.${bodyClass}`);
    const chevron = header.querySelector('.nk-cb-section__chevron');
    if (!body) return;
    const isHidden = body.style.display === 'none';
    body.style.display = isHidden ? '' : 'none';
    if (chevron) {
      chevron.classList.toggle('nk-cb-section__chevron--down', isHidden);
      chevron.classList.toggle('nk-cb-section__chevron--right', !isHidden);
    }
  }
  handleModalToggleSettings(event) { this._toggleModalSection(event, 'nk-modal-settings-body'); }
  handleModalToggleTranslations(event) { this._toggleModalSection(event, 'nk-modal-translations-body'); }
  handleModalToggleAudience(event) { this._toggleModalSection(event, 'nk-modal-audience-body'); }

  // ── Modal: Data Category lookup ───────────────────────────
  _modalDataCatPills = [];
  _modalDataCatSearch = '';

  handleModalDataCatInput(event) {
    this._modalDataCatSearch = event.target.value;
    this._updateModalDataCatDropdown();
  }
  handleModalDataCatFocus() { this._updateModalDataCatDropdown(); }
  handleModalDataCatBlur() {
    setTimeout(() => {
      const dd = this.querySelector('.nk-modal-datacat-dropdown');
      if (dd) dd.style.display = 'none';
    }, 200);
  }
  _updateModalDataCatDropdown() {
    const dd = this.querySelector('.nk-modal-datacat-dropdown');
    if (!dd) return;
    const search = (this._modalDataCatSearch || '').toLowerCase();
    const selectedIds = new Set(this._modalDataCatPills.map(p => p.id));
    const filtered = this._dataCategoryLookupData.filter(item =>
      !selectedIds.has(item.id) && (search === '' || item.label.toLowerCase().includes(search))
    );
    if (!filtered.length) { dd.style.display = 'none'; return; }
    dd.innerHTML = filtered.map(i => `<div class="nk-datacat-dropdown__item" data-id="${i.id}" data-label="${i.label}">${i.label}</div>`).join('');
    dd.style.display = 'block';
    dd.querySelectorAll('.nk-datacat-dropdown__item').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this._modalDataCatPills = [...this._modalDataCatPills, { id: el.dataset.id, label: el.dataset.label }];
        this._renderModalDataCatPills();
        dd.style.display = 'none';
        const input = this.querySelector('.nk-modal-datacat-search');
        if (input) { input.value = ''; this._modalDataCatSearch = ''; }
      });
    });
  }
  _renderModalDataCatPills() {
    const container = this.querySelector('.nk-modal-datacat-pills');
    if (!container) return;
    container.innerHTML = '';
    this._modalDataCatPills.forEach(pill => {
      const el = document.createElement('span');
      el.className = 'nk-audience-pill';
      el.innerHTML = `<span class="nk-audience-pill__label">${pill.label}</span><button type="button" class="nk-audience-pill__remove" title="Remove"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 52 52"><path fill="currentColor" d="M31.4 26l17-17c.8-.8.8-2 0-2.8l-2.8-2.8c-.8-.8-2-.8-2.8 0L26 20.6 9 3.4c-.8-.8-2-.8-2.8 0L3.4 6.2c-.8.8-.8 2 0 2.8l17 17-17 17c-.8.8-.8 2 0 2.8l2.8 2.8c.8.8 2 .8 2.8 0l17-17 17 17c.8.8 2 .8 2.8 0l2.8-2.8c.8-.8.8-2 0-2.8l-17-17z"/></svg></button>`;
      el.querySelector('.nk-audience-pill__remove').addEventListener('click', () => {
        this._modalDataCatPills = this._modalDataCatPills.filter(p => p.id !== pill.id);
        this._renderModalDataCatPills();
      });
      container.appendChild(el);
    });
  }

  // ── Modal: Translations toggle ────────────────────────────
  handleModalTranslationsToggle(event) {
    const checked = event.target.checked;
    const content = this.querySelector('.nk-modal-translations-content');
    if (content) content.style.display = checked ? '' : 'none';
    const label = event.target.closest('.nk-toggle-wrapper').querySelector('.nk-toggle__label');
    if (label) label.textContent = checked ? 'Active' : 'Inactive';
  }

  handleModalAddTranslation() {
    const container = this.querySelector('.nk-modal-tr-rows');
    if (!container) return;
    const rowId = `mtr-${Date.now()}`;
    const langOpts = this.kbLanguageOptions.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
    const valOpts = this.kbValueTypeOptions.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
    const row = document.createElement('div');
    row.className = 'nk-tr-row';
    row.innerHTML = `
      <div class="nk-tr-col nk-tr-col--lang"><span class="nk-tr-col__label">Language</span><div class="nk-tr-col__select-wrap"><select class="nk-tr-col__select">${langOpts}</select><svg class="nk-tr-col__select-chevron" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 52 52"><path fill="currentColor" d="M8.3 14.3a1.1 1.1 0 0 0-1.5 0L3.5 17.5c-.4.4-.4 1.1 0 1.5l20.5 20.5c.4.4 1.1.4 1.5 0L46 19c.4-.4.4-1.1 0-1.5l-3.2-3.2c-.4-.4-1.1-.4-1.5 0L26 29.5 8.3 14.3z"/></svg></div></div>
      <div class="nk-tr-col nk-tr-col--ai"><span class="nk-tr-col__label">AI Translations</span><label class="nk-native-toggle nk-native-toggle--sm"><input type="checkbox" /><span class="nk-native-toggle__track"></span></label></div>
      <div class="nk-tr-manual-fields"><div class="nk-tr-col nk-tr-col--value"><span class="nk-tr-col__label">Value</span><div class="nk-tr-grouped"><div class="nk-tr-grouped__picklist"><select class="nk-tr-select">${valOpts}</select><svg class="nk-tr-col__select-chevron" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 52 52"><path fill="currentColor" d="M8.3 14.3a1.1 1.1 0 0 0-1.5 0L3.5 17.5c-.4.4-.4 1.1 0 1.5l20.5 20.5c.4.4 1.1.4 1.5 0L46 19c.4-.4.4-1.1 0-1.5l-3.2-3.2c-.4-.4-1.1-.4-1.5 0L26 29.5 8.3 14.3z"/></svg></div><div class="nk-tr-grouped__lookup"><input type="text" class="nk-tr-lookup" placeholder="Search..." autocomplete="off" /><svg class="nk-tr-lookup__icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 52 52"><path fill="currentColor" d="M49.6 45.3 38.3 34c2.6-3.6 4.2-8 4.2-12.8C42.5 9.5 33 0 21.3 0S0 9.5 0 21.3s9.5 21.3 21.3 21.3c4.8 0 9.2-1.6 12.8-4.2l11.3 11.3c.6.6 1.5.6 2.1 0l2.1-2.1c.6-.7.6-1.7 0-2.3zM21.3 36.4c-8.4 0-15.2-6.8-15.2-15.2S12.9 6.1 21.3 6.1s15.2 6.8 15.2 15.2-6.9 15.1-15.2 15.1z"/></svg></div></div></div><div class="nk-tr-col nk-tr-col--date"><span class="nk-tr-col__label">Date</span><input type="date" class="nk-tr-date" /></div></div>
      <div class="nk-tr-ai-info" style="display:none"><svg class="nk-tr-ai-info-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 52 52"><path fill="#706e6b" d="M26 2C12.7 2 2 12.7 2 26s10.7 24 24 24 24-10.7 24-24S39.3 2 26 2zm0 12.1c1.7 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.3-3 3-3zm5 21c0 .5-.4.9-1 .9h-8c-.5 0-1-.3-1-.9v-2c0-.5.4-1.1 1-1.1.5 0 1-.3 1-.9v-4c0-.5-.4-1.1-1-1.1-.5 0-1-.3-1-.9v-2c0-.5.4-1.1 1-1.1h4c.5 0 1 .5 1 1.1v8c0 .5.4.9 1 .9.5 0 1 .5 1 1.1v2z"/></svg><span class="nk-tr-ai-info-text">Assignment and due date are not applicable to Einstein translations</span></div>
      <button type="button" class="nk-tr-remove-btn" title="Remove"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 52 52"><path fill="currentColor" d="M31.4 26l17-17c.8-.8.8-2 0-2.8l-2.8-2.8c-.8-.8-2-.8-2.8 0L26 20.6 9 3.4c-.8-.8-2-.8-2.8 0L3.4 6.2c-.8.8-.8 2 0 2.8l17 17-17 17c-.8.8-.8 2 0 2.8l2.8 2.8c.8.8 2 .8 2.8 0l17-17 17 17c.8.8 2 .8 2.8 0l2.8-2.8c.8-.8.8-2 0-2.8l-17-17z"/></svg></button>`;
    row.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
      const checked = e.target.checked;
      const manual = row.querySelector('.nk-tr-manual-fields');
      const info = row.querySelector('.nk-tr-ai-info');
      if (manual) manual.style.display = checked ? 'none' : '';
      if (info) info.style.display = checked ? '' : 'none';
    });
    row.querySelector('.nk-tr-remove-btn').addEventListener('click', () => row.remove());
    container.appendChild(row);
  }

  // ── Modal: Audience toggle ────────────────────────────────
  _modalAudiencePills = [];

  handleModalAudienceToggle(event) {
    const checked = event.target.checked;
    const content = this.querySelector('.nk-modal-audience-content');
    if (content) content.style.display = checked ? '' : 'none';
    const label = event.target.closest('.nk-toggle-wrapper').querySelector('.nk-toggle__label');
    if (label) label.textContent = checked ? 'Active' : 'Inactive';
  }

  handleModalAudienceInput(event) {
    this._modalAudienceSearch = event.target.value;
    this._updateModalAudienceDropdown();
  }
  handleModalAudienceFocus() { this._updateModalAudienceDropdown(); }
  handleModalAudienceBlur() {
    setTimeout(() => {
      const dd = this.querySelector('.nk-modal-audience-dropdown');
      if (dd) dd.style.display = 'none';
    }, 200);
  }
  _modalAudienceSearch = '';
  _updateModalAudienceDropdown() {
    const dd = this.querySelector('.nk-modal-audience-dropdown');
    if (!dd) return;
    const search = (this._modalAudienceSearch || '').toLowerCase();
    const selectedIds = new Set(this._modalAudiencePills.map(p => p.id));
    const filtered = this._audienceLookupData.filter(item =>
      !selectedIds.has(item.id) && (search === '' || item.label.toLowerCase().includes(search))
    );
    if (!filtered.length) { dd.style.display = 'none'; return; }
    dd.innerHTML = filtered.map(i => `<div class="nk-audience-dropdown__item" data-id="${i.id}" data-label="${i.label}">${i.label}</div>`).join('');
    dd.style.display = 'block';
    dd.querySelectorAll('.nk-audience-dropdown__item').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this._modalAudiencePills = [...this._modalAudiencePills, { id: el.dataset.id, label: el.dataset.label }];
        this._renderModalAudiencePills();
        dd.style.display = 'none';
        const input = this.querySelector('.nk-modal-audience-search');
        if (input) { input.value = ''; this._modalAudienceSearch = ''; }
      });
    });
  }
  _renderModalAudiencePills() {
    const container = this.querySelector('.nk-modal-audience-pills');
    if (!container) return;
    container.innerHTML = '';
    this._modalAudiencePills.forEach(pill => {
      const el = document.createElement('span');
      el.className = 'nk-audience-pill';
      el.innerHTML = `<span class="nk-audience-pill__label">${pill.label}</span><button type="button" class="nk-audience-pill__remove" title="Remove"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 52 52"><path fill="currentColor" d="M31.4 26l17-17c.8-.8.8-2 0-2.8l-2.8-2.8c-.8-.8-2-.8-2.8 0L26 20.6 9 3.4c-.8-.8-2-.8-2.8 0L3.4 6.2c-.8.8-.8 2 0 2.8l17 17-17 17c-.8.8-.8 2 0 2.8l2.8 2.8c.8.8 2 .8 2.8 0l17-17 17 17c.8.8 2 .8 2.8 0l2.8-2.8c.8-.8.8-2 0-2.8l-17-17z"/></svg></button>`;
      el.querySelector('.nk-audience-pill__remove').addEventListener('click', () => {
        this._modalAudiencePills = this._modalAudiencePills.filter(p => p.id !== pill.id);
        this._renderModalAudiencePills();
      });
      container.appendChild(el);
    });
  }

  get isCategoryDropdownOpen() {
    return this._categoryDropdownOpen;
  }

  get categoryDropdownIcon() {
    return this._categoryDropdownOpen ? 'utility:up' : 'utility:down';
  }

  get categoryInputPlaceholder() {
    return this._selectedCategoryIds.size > 0
      ? `${this._selectedCategoryIds.size} selected`
      : 'Select Data Categories';
  }

  get allCategoryOptions() {
    return ALL_CATEGORIES.map((cat) => {
      const selected = this._selectedCategoryIds.has(cat.id);
      return {
        ...cat,
        selected,
        itemClass: `nk-cb-listbox__item${selected ? ' nk-cb-listbox__item--selected' : ''}`,
      };
    });
  }

  get blockCategoryPills() {
    return ALL_CATEGORIES.filter((c) => this._selectedCategoryIds.has(c.id));
  }

  get hasCategoryPills() {
    return this._selectedCategoryIds.size > 0;
  }

  get conditionalVisibilityLabel() {
    return this.blockConditionalVisibility ? 'Enabled' : 'Disabled';
  }

  get autoApplyTranslationLabel() {
    return this.autoApplyTranslation ? 'Active' : 'Inactive';
  }

  get applySharingRulesLabel() {
    return this.applySharingRules ? 'Active' : 'Inactive';
  }

  get audiencePillsForDisplay() {
    return this._audiencePillIds.map((id) => ({
      id,
      label: AUDIENCE_PILL_LABELS[id] || id,
    }));
  }

  get hasAudiencePills() {
    return this._audiencePillIds.length > 0;
  }

  get userGroupOptions() {
    return USER_GROUP_OPTIONS;
  }

  handleToggleCategoryDropdown() {
    this._categoryDropdownOpen = !this._categoryDropdownOpen;
  }

  handleSelectCategory(event) {
    const optId = event.currentTarget.dataset.optionId;
    const next = new Set(this._selectedCategoryIds);
    if (next.has(optId)) {
      next.delete(optId);
    } else {
      next.add(optId);
    }
    this._selectedCategoryIds = next;
  }

  handleRemovePill(event) {
    const pillId = event.currentTarget.dataset.pillId;
    const next = new Set(this._selectedCategoryIds);
    next.delete(pillId);
    this._selectedCategoryIds = next;
  }

  handleBlockDescriptionChange(event) {
    this.blockShortDescription = event.target.value;
  }

  handleToggleConditionalVisibility(event) {
    this.blockConditionalVisibility = event.target.checked;
  }

  handleAutoApplyTranslation(event) {
    this.autoApplyTranslation = event.detail.checked;
  }

  handleApplySharingRules(event) {
    this.applySharingRules = event.detail.checked;
  }

  handleAudienceUserGroup(event) {
    this.audienceUserGroup = event.detail.value;
  }

  handleAudienceSearch(event) {
    this.audienceSearch = event.detail?.value ?? event.target?.value ?? '';
  }

  handleRemoveAudiencePill(event) {
    const id = event.currentTarget.dataset.pillId;
    this._audiencePillIds = this._audiencePillIds.filter((pid) => pid !== id);
  }

  handleCloseCreateBlock() {
    this._createBlockOpen = false;
  }

  get settingsChevronIcon() {
    return this.settingsSectionOpen ? 'utility:chevrondown' : 'utility:chevronright';
  }

  get translationsChevronIcon() {
    return this.translationsSectionOpen ? 'utility:chevrondown' : 'utility:chevronright';
  }

  get audienceChevronIcon() {
    return this.audienceSectionOpen ? 'utility:chevrondown' : 'utility:chevronright';
  }

  handleToggleAccordion(event) {
    const section = event.currentTarget.dataset.section;
    if (section === 'settings') this.settingsSectionOpen = !this.settingsSectionOpen;
    if (section === 'translations') this.translationsSectionOpen = !this.translationsSectionOpen;
    if (section === 'audience') this.audienceSectionOpen = !this.audienceSectionOpen;
  }

  // ── Word counts ────────────────────────────────────────────

  _countWords(el) {
    const text = el ? (el.innerText || el.textContent || '') : '';
    const trimmed = text.trim();
    return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  }

  get detailsWordCount() {
    const n = this._detailsWordCount;
    return `${n} ${n === 1 ? 'word' : 'words'}`;
  }

  get commentsWordCount() {
    const n = this._commentsWordCount;
    return `${n} ${n === 1 ? 'word' : 'words'}`;
  }

  handleEditorPaste(e) {
    e.preventDefault();
    const clipboardData = e.clipboardData || window.clipboardData;
    const html = clipboardData.getData('text/html');
    const text = clipboardData.getData('text/plain');
    if (html) {
      document.execCommand('insertHTML', false, html);
    } else if (text) {
      document.execCommand('insertText', false, text);
    }
  }

  handleDetailsInput() {
    this._detailsWordCount = this._countWords(this.detailsEditor);
    if (this.detailsEditor) this._lastDetailsHtml = this.detailsEditor.innerHTML;
  }

  handleCommentsInput() {
    this._commentsWordCount = this._countWords(this.querySelector('[data-id="commentsEditor"]'));
  }

  // ── Editor ─────────────────────────────────────────────────

  get detailsEditor() {
    return this.querySelector('[data-id="detailsEditor"]');
  }

  // ── Knowledge-block hover tooltip helpers ────────────────────
  _setupKbTooltip() {
    const editor = this.detailsEditor;
    if (!editor) {
      // Editor unmounted (e.g. on Step 2). Drop any stale listeners.
      if (this._kbTooltipEditor) this._teardownKbTooltip();
      return;
    }
    if (editor === this._kbTooltipEditor) return; // Already wired.
    // Fresh editor instance — drop old listeners then attach new ones.
    this._teardownKbTooltip();
    this._kbTooltipEditor = editor;

    this._kbTooltipOnOver = (e) => {
      const block = e.target && e.target.closest
        ? e.target.closest('.nk-knowledge-block')
        : null;
      if (block && block !== this._kbTooltipBlock) {
        this._kbTooltipBlock = block;
        this._showKbTooltipFor(block);
      }
    };
    this._kbTooltipOnOut = (e) => {
      const block = e.target && e.target.closest
        ? e.target.closest('.nk-knowledge-block')
        : null;
      // Hide only when the cursor truly leaves the current block (i.e.
      // relatedTarget is null OR outside the hovered block element).
      if (
        block &&
        block === this._kbTooltipBlock &&
        (!e.relatedTarget || !block.contains(e.relatedTarget))
      ) {
        this._kbTooltipBlock = null;
        this._hideKbTooltip();
      }
    };
    // While the editor scrolls, keep the tooltip pinned to the block
    // (and clamped to the editor viewport) instead of hiding — matches
    // the Figma reference where the tooltip is a stable popover.
    this._kbTooltipOnScroll = () => {
      if (this._kbTooltipBlock) {
        this._showKbTooltipFor(this._kbTooltipBlock);
      }
    };

    editor.addEventListener('mouseover', this._kbTooltipOnOver);
    editor.addEventListener('mouseout', this._kbTooltipOnOut);
    editor.addEventListener('scroll', this._kbTooltipOnScroll, { passive: true });
  }

  _teardownKbTooltip() {
    const editor = this._kbTooltipEditor;
    if (editor) {
      if (this._kbTooltipOnOver) editor.removeEventListener('mouseover', this._kbTooltipOnOver);
      if (this._kbTooltipOnOut) editor.removeEventListener('mouseout', this._kbTooltipOnOut);
      if (this._kbTooltipOnScroll) editor.removeEventListener('scroll', this._kbTooltipOnScroll);
    }
    this._kbTooltipEditor = null;
    this._kbTooltipBlock = null;
    this._kbTooltipOnOver = null;
    this._kbTooltipOnOut = null;
    this._kbTooltipOnScroll = null;
    this._hideKbTooltip();
  }

  _showKbTooltipFor(blockEl) {
    const editor = this._kbTooltipEditor;
    if (!editor || !blockEl) return;

    // Use a fixed-positioned tooltip in viewport coords. Both the
    // block and the editor expose viewport-relative rects via
    // getBoundingClientRect, which lets us clamp cleanly.
    const blockRect = blockEl.getBoundingClientRect();
    const editorRect = editor.getBoundingClientRect();

    // Tooltip dims: keep in sync with the .nk-kb-tooltip CSS below.
    const TIP_W = 184;
    const TIP_H = 28;
    const NUB = 6;       // caret height
    const GAP = NUB + 2; // tooltip standoff from the block edge
    const PAD = 4;       // breathing room from the editor edges

    // Default placement: centered above the block, caret pointing down.
    let placement = 'top';
    let top = blockRect.top - TIP_H - GAP;
    // Flip below the block if "above" would clip the editor's top edge.
    if (top < editorRect.top + PAD) {
      placement = 'bottom';
      top = blockRect.bottom + GAP;
    }
    // Clamp vertically to the editor viewport.
    if (top + TIP_H > editorRect.bottom - PAD) {
      top = editorRect.bottom - TIP_H - PAD;
    }
    if (top < editorRect.top + PAD) {
      top = editorRect.top + PAD;
    }

    // Center horizontally on the block, then clamp to editor bounds.
    let left = blockRect.left + (blockRect.width - TIP_W) / 2;
    if (left < editorRect.left + PAD) {
      left = editorRect.left + PAD;
    }
    if (left + TIP_W > editorRect.right - PAD) {
      left = editorRect.right - TIP_W - PAD;
    }

    // Caret follows the block's horizontal center even after clamping,
    // so it always points at the block. Keep ≥10px from either edge so
    // it doesn't poke past the rounded corners.
    const blockCenterX = blockRect.left + blockRect.width / 2;
    const caretLeft = Math.max(10, Math.min(TIP_W - 10, blockCenterX - left));

    this._kbTooltipPlacement = placement;
    this._kbTooltipStyle = `top: ${Math.round(top)}px; left: ${Math.round(left)}px; width: ${TIP_W}px; --nk-kb-caret-x: ${Math.round(caretLeft)}px;`;
    this._kbTooltipVisible = true;
  }

  _hideKbTooltip() {
    if (this._kbTooltipVisible) this._kbTooltipVisible = false;
  }

  get kbTooltipVisible() { return this._kbTooltipVisible; }
  get kbTooltipStyle() { return this._kbTooltipStyle; }
  get kbTooltipClass() {
    const placement = this._kbTooltipPlacement === 'bottom' ? 'nk-kb-tooltip--bottom' : 'nk-kb-tooltip--top';
    return `nk-kb-tooltip ${placement}`;
  }

  _dispatchArticleTitleChange() {
    this.dispatchEvent(
      new CustomEvent('articletitlechange', {
        bubbles: true,
        composed: true,
        detail: { articleTitle: this.articleTitle },
      })
    );
  }

  handleArticleTitleInput(event) {
    this.articleTitle = event.target.value;
    this._dispatchArticleTitleChange();
  }

  handleArticleTitleEditClick() {
    const el = this.querySelector('.nk-article-title');
    if (el) {
      el.focus();
      if (typeof el.select === 'function') {
        el.select();
      }
    }
  }

  _exec(command, value = null) {
    const ed = this.detailsEditor;
    if (ed) ed.focus();
    document.execCommand(command, false, value);
  }

  handleUndo(e) { e.preventDefault(); this._exec('undo'); }
  handleRedo(e) { e.preventDefault(); this._exec('redo'); }
  handleBold(e) { e.preventDefault(); this._exec('bold'); }
  handleItalic(e) { e.preventDefault(); this._exec('italic'); }
  handleUnderline(e) { e.preventDefault(); this._exec('underline'); }
  handleStrikethrough(e) { e.preventDefault(); this._exec('strikeThrough'); }
  handleTextColor(e) { e.preventDefault(); this._exec('foreColor', '#0250d9'); }
  handleHighlight(e) { e.preventDefault(); this._exec('backColor', '#fff176'); }
  handleRemoveFormat(e) { e.preventDefault(); this._exec('removeFormat'); }
  handleAlignLeft(e) { e.preventDefault(); this._exec('justifyLeft'); }
  handleAlignCenter(e) { e.preventDefault(); this._exec('justifyCenter'); }
  handleAlignRight(e) { e.preventDefault(); this._exec('justifyRight'); }
  handleJustify(e) { e.preventDefault(); this._exec('justifyFull'); }
  handleBlockFormat(e) {
    e.preventDefault();
    this._exec('formatBlock', e.target.value);
  }

  // ── Navigation ─────────────────────────────────────────────

  _previewNeedsPopulate = false;

  handleNext() {
    const editor = this.detailsEditor;
    this._savedDetailsContent = editor ? editor.innerHTML : '';
    const commentsEl = this.querySelector('[data-id="commentsEditor"]');
    this._savedCommentsContent = commentsEl ? commentsEl.innerHTML : '';
    // The dedicated Similarity Check step (formerly Step 2) has been
    // removed — that workflow is now driven by the in-place "Check
    // Similar Articles" button + modal on Step 1. Step 1 → Step 3.
    this._currentStep = 3;
  }

  handleBack() {
    // Step 3 → Step 1 directly. Step 2 no longer exists.
    this._currentStep = 1;
    this._detailsEditorNeedsRestore = true;
  }

  handleToggleSimilarArticle(event) {
    const id = event.currentTarget.dataset.articleId;
    const wasExpanded = this._expandedArticles[id];
    this._expandedArticles = { ...this._expandedArticles, [id]: !wasExpanded };

    // If collapsing, clear the active section card and preview highlights
    if (wasExpanded) {
      const prevActive = this.querySelector('.nk-sim-section-card--active');
      if (prevActive) prevActive.classList.remove('nk-sim-section-card--active');

      const previewEl = this.querySelector('[data-id="previewDisplay"]');
      if (previewEl) {
        previewEl.querySelectorAll('.nk-preview-para--highlight').forEach((el) => el.classList.remove('nk-preview-para--highlight'));
      }
    }
  }

  handleSaveDraft() {
    const editor = this.detailsEditor;
    const detailsContent = editor ? editor.innerHTML : this._savedDetailsContent;
    this.dispatchEvent(
      new CustomEvent('savedraft', {
        bubbles: true,
        composed: true,
        detail: {
          articleTitle: this.articleTitle,
          summary: this.summary,
          detailsContent,
          recordType: this.recordType,
        },
      })
    );
  }

  handleCancel() {
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  // "Save & New" — save the current draft, then signal the parent to open a fresh form.
  handleSaveAndNew() {
    this.handleSaveDraft();
    this.dispatchEvent(new CustomEvent('savenew', { bubbles: true, composed: true }));
  }

  // ── Step 2 field handlers ──────────────────────────────────

  get summary() {
    if (this._summaryEdited) return this._summary;
    const derived = this._deriveSummaryFromDetails(this._detailsHtml());
    return derived || this._summary;
  }

  _detailsHtml() {
    const editor = this.querySelector('[data-id="detailsEditor"]');
    if (editor && editor.innerHTML) return editor.innerHTML;
    return this._savedDetailsContent || this._lastDetailsHtml || '';
  }

  _deriveSummaryFromDetails(html) {
    if (!html || typeof html !== 'string') return '';
    const text = html
      .replace(/<\s*(h[1-6]|li)\b[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) return '';
    const sentences = text.match(/[^.!?]+[.!?]/g) || [text];
    let out = '';
    for (const s of sentences) {
      const next = (out + ' ' + s).trim();
      if (next.length > 240 && out) break;
      out = next;
      if (out.length >= 160) break;
    }
    return out.length > 280 ? out.slice(0, 277).trim() + '…' : out;
  }

  handleSummaryChange(e) {
    this._summary = e.detail.value;
    this._summaryEdited = true;
  }
  handleValidationStatusChange(e) { this.validationStatus = e.detail.value; }
  handleWorkflowStatusChange(e) { this.workflowStatus = e.detail.value; }
  handleUrlNameChange(e) { this.urlName = e.detail.value; }
  handleRequiresRevisionChange(e) { this.requiresRevision = e.detail.checked; }
  handleVisibleToCustomer(e) { this.visibleToCustomer = e.detail.checked; }
  handleVisibleToPartner(e) { this.visibleToPartner = e.detail.checked; }
  handleVisibleInternalApp(e) { this.visibleInternalApp = e.detail.checked; }
  handleFeaturedCommunities(e) { this.featuredCommunities = e.detail.checked; }
  handleTranslationLanguageChange(e) { this.translationLanguage = e.detail.value; }
}
