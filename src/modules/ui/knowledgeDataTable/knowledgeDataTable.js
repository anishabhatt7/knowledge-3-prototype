import { LightningElement, api } from 'lwc';

/**
 * Knowledge list-view data table — ported from
 * knowledge_hackathon_v2 main/knowledgeDataTable. Wraps
 * <lightning-datatable> with two pre-baked column sets:
 *   - default ("Knowledge"): article record-type list
 *   - isKbCreationFlow=true: Knowledge Block list with version/status
 */

const COLUMNS = [
  {
    // `type: 'button'` with `variant: 'base'` renders an in-cell link
    // that fires a `rowaction` event (vs. `type: 'url'` which hard-
    // navigates the browser). The host wires `onrowaction` to a
    // `viewrecord` dispatcher so the Knowledge Base page can open the
    // record as a workspace tab without changing the browser URL until
    // it has stashed the record metadata.
    label: 'Account Name',
    fieldName: 'accountName',
    type: 'button',
    sortable: true,
    initialWidth: 400,
    wrapText: false,
    cellAttributes: { class: 'nk-kb-name-cell' },
    typeAttributes: {
      label: { fieldName: 'accountName' },
      variant: 'base',
      name: 'view_record',
    },
  },
  {
    label: 'Published Date',
    fieldName: 'publishedDate',
    type: 'text',
    sortable: true,
  },
  {
    label: 'Language',
    fieldName: 'language',
    type: 'text',
    sortable: true,
  },
  {
    label: 'Article Record Type',
    fieldName: 'articleRecordType',
    type: 'text',
    sortable: true,
  },
];

const KB_COLUMNS = [
  {
    label: 'Knowledge Block Name',
    fieldName: 'accountName',
    type: 'button',
    sortable: true,
    initialWidth: 400,
    wrapText: false,
    cellAttributes: { class: 'nk-kb-name-cell' },
    typeAttributes: {
      label: { fieldName: 'accountName' },
      variant: 'base',
      name: 'view_record',
    },
  },
  {
    label: 'Published Date',
    fieldName: 'publishedDate',
    type: 'text',
    sortable: true,
  },
  {
    label: 'Language',
    fieldName: 'language',
    type: 'text',
    sortable: true,
  },
  {
    label: 'Number of Articles Used',
    fieldName: 'articlesUsed',
    type: 'text',
    sortable: true,
  },
  {
    label: 'Published Status',
    fieldName: 'publishedStatus',
    type: 'text',
    sortable: true,
  },
  {
    label: 'Current Version',
    fieldName: 'currentVersion',
    type: 'text',
    sortable: true,
  },
];

const ARTICLE_NAMES = [
  'How to Enroll in the 401(k) Plan?',
  'Parental Leave Policy — US Employees',
  'Employee Relocation Policy — EMEA Region',
  'How to Update Your Direct Deposit Info?',
  'Benefits Enrollment Deadline and Eligibility',
  'Onboarding Checklist for New Hires',
  'Global Travel Policy — Expense Limits',
  'Work Authorization Renewal Checklist',
  'Password and Access Management Policy',
  'How to Submit an HR Service Request?',
  'Employee Assistance Program (EAP) Overview',
  'Tax Equalization Policy for Expatriates',
  'Workplace Safety and Incident Reporting',
  'Data Retention and Deletion Standards',
  'Tuition Reimbursement Program Guide',
  'How to Request Software Access or License?',
];

const RECORD_TYPES = [
  'FAQ (Unified Knowledge)',
  'Google Drive',
  'Sharepoint',
  'FAQ (Unified Knowledge)',
  'Confluence',
  'Sharepoint',
  'Google Drive',
  'Confluence',
  'FAQ (Unified Knowledge)',
  'Sharepoint',
  'Google Drive',
  'Confluence',
  'FAQ (Unified Knowledge)',
  'Sharepoint',
  'Google Drive',
  'FAQ (Unified Knowledge)',
];

const KB_NAMES = [
  'Work Visa Sponsorship Process',
  'H-1B Transfer and Extension Guide',
  'I-9 Employment Eligibility Verification',
  'Green Card Sponsorship Eligibility',
  'Global Mobility Relocation Policy',
  'International Employee Onboarding Compliance',
  'Dependent Visa Application Support',
  'Work Authorization Renewal Checklist',
  'Cross-Border Employment Tax Obligations',
  'Permanent Residency Pathway Guide',
  'L-1 Intracompany Transfer Policy',
  'OPT and STEM Extension Guidelines',
  'Immigration Case Management Process',
  'PERM Labor Certification Process',
  'Immigration Document Retention Policy',
  'Emergency Immigration Support Services',
];

const KB_ARTICLES_USED = [18, 11, 7, 24, 9, 14, 6, 16, 8, 21, 13, 5, 10, 19, 4, 3];
const KB_PUBLISHED_STATUS = ['Published', 'Published', 'Published', 'Draft', 'Published', 'Published', 'Published', 'Published', 'Draft', 'Published', 'Published', 'Draft', 'Published', 'Published', 'Published', 'Draft'];
const KB_CURRENT_VERSION = ['4', '2', '3', '1', '5', '2', '1', '3', '1', '4', '2', '1', '3', '2', '2', '1'];

export default class KnowledgeDataTable extends LightningElement {
  static renderMode = 'light';

  @api createdBlocks = [];
  @api isKbCreationFlow = false;
  @api savedItems = [];

  sortedBy;
  sortDirection = 'asc';

  get columns() {
    return this.isKbCreationFlow ? KB_COLUMNS : COLUMNS;
  }

  get data() {
    const saved = this.savedItems || [];

    if (this.isKbCreationFlow) {
      const savedKbRows = saved.map((item) => ({
        id: item.id,
        accountName: item.title,
        accountNameUrl: '#',
        publishedDate: item.date,
        language: 'English',
        articlesUsed: '0',
        publishedStatus: 'Draft',
        currentVersion: '1',
      }));

      const existingKbRows = KB_NAMES.map((name, index) => ({
        id: `kb-${index + 1}`,
        accountName: name,
        accountNameUrl: '#',
        publishedDate: '6/8/2023, 6:28 AM',
        language: 'English',
        articlesUsed: String(KB_ARTICLES_USED[index]),
        publishedStatus: KB_PUBLISHED_STATUS[index],
        currentVersion: KB_CURRENT_VERSION[index],
      }));

      return [...savedKbRows, ...existingKbRows];
    }

    const savedArticleRows = saved.map((item) => ({
      id: item.id,
      accountName: item.title,
      accountNameUrl: '#',
      publishedDate: item.date,
      language: 'English',
      articleRecordType: item.recordType || 'FAQ',
    }));

    const knowledgeBlockRows = (this.createdBlocks || []).map((block) => ({
      id: block.id,
      accountName: block.blockTitle,
      accountNameUrl: '#',
      publishedDate: '3/14/2026, 9:00 AM',
      language: 'English',
      articleRecordType: 'Knowledge Block',
    }));

    const existingRows = ARTICLE_NAMES.map((name, index) => ({
      id: String(index + 1),
      accountName: name,
      accountNameUrl: '#',
      publishedDate: '6/8/2023, 6:28 AM',
      language: 'English',
      articleRecordType: RECORD_TYPES[index],
    }));

    return [...savedArticleRows, ...knowledgeBlockRows, ...existingRows];
  }

  handleSort(event) {
    const { fieldName: sortedBy, sortDirection } = event.detail;
    this.sortedBy = sortedBy;
    this.sortDirection = sortDirection;
  }

  handleRowAction(event) {
    const actionName = event.detail.action.name;
    if (actionName === 'view_record') {
      const row = event.detail.row;
      // Same `viewrecord` event for both flows (article list + KB list);
      // host decides what to do with it (open a workspace tab in the
      // Knowledge Base case).
      this.dispatchEvent(
        new CustomEvent('viewrecord', {
          bubbles: true,
          composed: true,
          detail: {
            id: row.id,
            title: row.accountName,
            date: row.publishedDate,
            language: row.language,
            articleRecordType: row.articleRecordType,
            articlesUsed: row.articlesUsed,
            publishedStatus: row.publishedStatus,
            currentVersion: row.currentVersion,
            isKnowledgeBlock: !!this.isKbCreationFlow,
          },
        })
      );
    }
  }
}
