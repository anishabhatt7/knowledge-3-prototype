import { LightningElement, track } from 'lwc';
import { SAMPLE_ARTICLES } from 'data/sampleArticles';
import {
  setCurrentArticle,
  getCurrentArticle,
  getAnalysisResults,
  getEnrichmentData
} from 'data/articleState';

export default class KnowledgeArticle extends LightningElement {
  @track activeModal = null; // null | 'analyze' | 'metadata' | 'enrich' | 'dashboard'

  // Currently displayed article (drives main page rendering)
  @track currentArticle = SAMPLE_ARTICLES[0];

  // Active main tab
  @track activeMainTab = 'details';

  // Edit modal state
  @track isEditModalOpen = false;
  @track editTitle = '';
  @track editSummary = '';
  @track editDetails = '';
  @track editInternalComments = '';
  @track editAnalysis = null;
  debounceTimer = null;

  // Accepted AI data (refreshed on modal close)
  @track acceptedMetadata = null;
  @track approvedEnrichment = null;

  connectedCallback() {
    // Default to first sample article (Configure SSO - the poor quality one)
    setCurrentArticle(SAMPLE_ARTICLES[0]);
    this.currentArticle = SAMPLE_ARTICLES[0];
    this.editTitle = SAMPLE_ARTICLES[0].title;
    this.editDetails = SAMPLE_ARTICLES[0].content;
    this.refreshFromState();
  }

  get currentArticleTitle() {
    return this.currentArticle?.title || '';
  }

  get contentBlocks() {
    if (!this.currentArticle?.content) return [];
    const lines = this.currentArticle.content.split('\n');
    const blocks = [];
    let currentList = null;
    let currentParagraph = null;

    const flushParagraph = () => {
      if (currentParagraph) {
        blocks.push({ type: 'p', id: `b${blocks.length}`, html: currentParagraph });
        currentParagraph = null;
      }
    };
    const flushList = () => {
      if (currentList) {
        blocks.push({ type: 'ol', id: `b${blocks.length}`, items: currentList });
        currentList = null;
      }
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        flushParagraph();
        flushList();
        continue;
      }
      if (line.startsWith('# ')) {
        // Skip H1 - it's the article title shown in header
        continue;
      }
      if (line.startsWith('## ')) {
        flushParagraph();
        flushList();
        blocks.push({ type: 'h3', id: `b${blocks.length}`, text: line.slice(3) });
        continue;
      }
      if (line.startsWith('### ')) {
        flushParagraph();
        flushList();
        blocks.push({ type: 'h4', id: `b${blocks.length}`, text: line.slice(4) });
        continue;
      }
      const numbered = line.match(/^(\d+)\.\s+(.+)$/);
      if (numbered) {
        flushParagraph();
        if (!currentList) currentList = [];
        currentList.push({ id: `i${blocks.length}-${currentList.length}`, text: numbered[2] });
        continue;
      }
      flushList();
      // Bold inline replacement: strip markers; we render plain
      const text = line.replace(/\*\*([^*]+)\*\*/g, '$1');
      if (currentParagraph) {
        currentParagraph += ' ' + text;
      } else {
        currentParagraph = text;
      }
    }
    flushParagraph();
    flushList();

    return blocks.map((b) => ({
      ...b,
      isH3: b.type === 'h3',
      isH4: b.type === 'h4',
      isP: b.type === 'p',
      isOl: b.type === 'ol'
    }));
  }

  // ========== Main Tab Handlers ==========

  handleMainTabClick(event) {
    const tab = event.currentTarget.dataset.tab;
    if (tab) {
      this.activeMainTab = tab;
    }
  }

  get isDetailsTabActive() {
    return this.activeMainTab === 'details';
  }
  get isRelatedTabActive() {
    return this.activeMainTab === 'related';
  }
  get isMetadataTabActive() {
    return this.activeMainTab === 'aiMetadata';
  }
  get isEnrichmentTabActive() {
    return this.activeMainTab === 'aiEnrichment';
  }
  get isVersionTabActive() {
    return this.activeMainTab === 'version';
  }
  get isTranslationsTabActive() {
    return this.activeMainTab === 'translations';
  }
  get isApprovalsTabActive() {
    return this.activeMainTab === 'approvals';
  }

  get detailsTabClass() {
    return this.isDetailsTabActive
      ? 'kb-tabs__item kb-tabs__item--active'
      : 'kb-tabs__item';
  }
  get relatedTabClass() {
    return this.isRelatedTabActive
      ? 'kb-tabs__item kb-tabs__item--active'
      : 'kb-tabs__item';
  }
  get metadataTabClass() {
    return this.isMetadataTabActive
      ? 'kb-tabs__item kb-tabs__item--active'
      : 'kb-tabs__item';
  }
  get enrichmentTabClass() {
    return this.isEnrichmentTabActive
      ? 'kb-tabs__item kb-tabs__item--active'
      : 'kb-tabs__item';
  }
  get versionTabClass() {
    return this.isVersionTabActive
      ? 'kb-tabs__item kb-tabs__item--active'
      : 'kb-tabs__item';
  }
  get translationsTabClass() {
    return this.isTranslationsTabActive
      ? 'kb-tabs__item kb-tabs__item--active'
      : 'kb-tabs__item';
  }
  get approvalsTabClass() {
    return this.isApprovalsTabActive
      ? 'kb-tabs__item kb-tabs__item--active'
      : 'kb-tabs__item';
  }

  refreshFromState() {
    const article = getCurrentArticle();
    if (article && article.metadata) {
      this.acceptedMetadata = article.metadata;
    }
    this.approvedEnrichment = getEnrichmentData();
  }

  get isAnalyzeModalOpen() {
    return this.activeModal === 'analyze';
  }

  get isMetadataModalOpen() {
    return this.activeModal === 'metadata';
  }

  get isEnrichModalOpen() {
    return this.activeModal === 'enrich';
  }

  get isDashboardModalOpen() {
    return this.activeModal === 'dashboard';
  }

  get isAnyModalOpen() {
    return this.activeModal !== null;
  }

  handleAnalyzeClick() {
    this.activeModal = 'analyze';
  }

  handleMetadataClick() {
    this.activeModal = 'metadata';
  }

  handleEnrichClick() {
    this.activeModal = 'enrich';
  }

  handleDashboardClick() {
    // Open dashboard in a new browser window so it appears as a separate full-page view.
    // Filename includes "index" so the vite-plugin-lwc HTML alias regex skips it.
    window.open(
      './dashboard-index.html',
      'kb-dashboard',
      'width=1400,height=900,resizable=yes,scrollbars=yes'
    );
  }

  handleCloseModal() {
    this.activeModal = null;
    this.refreshFromState();
  }

  // Handle navigate events from child components - switch to the requested modal
  handleNavigate(event) {
    const { tab } = event.detail;
    const tabToModal = {
      articleAnalyzer: 'analyze',
      metadataSuggester: 'metadata',
      enrichmentPreview: 'enrich',
      healthDashboard: 'dashboard'
    };

    if (tab === 'guidedAuthor') {
      // Close current modal, open Edit modal with current article pre-loaded
      this.activeModal = null;
      this.handleEditClick();
      return;
    }

    if (tabToModal[tab]) {
      this.activeModal = tabToModal[tab];
    }
  }

  // ========== Edit Modal Handlers ==========

  handleEditClick() {
    const currentArticle = SAMPLE_ARTICLES[0];
    this.editTitle = currentArticle.title;
    this.editDetails = currentArticle.content;
    this.editSummary = '';
    this.editInternalComments = '';
    this.runEditAnalysis();
    this.isEditModalOpen = true;
  }

  handleEditClose() {
    this.isEditModalOpen = false;
  }

  handleEditSave() {
    // For prototype - just close the modal
    this.isEditModalOpen = false;
  }

  handleTitleChange(event) {
    this.editTitle = event.target.value;
    this.scheduleAnalysis();
  }

  handleSummaryChange(event) {
    this.editSummary = event.target.value;
  }

  handleDetailsChange(event) {
    this.editDetails = event.target.value;
    this.scheduleAnalysis();
  }

  handleInternalCommentsChange(event) {
    this.editInternalComments = event.target.value;
  }

  scheduleAnalysis() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.runEditAnalysis();
    }, 500);
  }

  runEditAnalysis() {
    const fullContent = `# ${this.editTitle}\n\n${this.editDetails}`;
    const article = {
      id: 'edit-draft',
      title: this.editTitle,
      content: fullContent,
      metadata: {}
    };
    setCurrentArticle(article);
    this.editAnalysis = getAnalysisResults();
  }

  get editScoreDisplay() {
    return `${this.editAnalysis?.score || 0}/100`;
  }

  get editScoreLabel() {
    const s = this.editAnalysis?.score || 0;
    if (s >= 80) return 'Good';
    if (s >= 60) return 'Needs Improvement';
    return 'Poor';
  }

  get editScoreStatus() {
    const s = this.editAnalysis?.score || 0;
    if (s >= 80) return 'success';
    if (s >= 60) return 'warning';
    return 'error';
  }

  get editRagScoreClass() {
    return `kb-ai-score kb-ai-score--${this.editScoreStatus}`;
  }

  get editViolations() {
    return this.editAnalysis?.violations || [];
  }

  get editHasViolations() {
    return this.editViolations.length > 0;
  }

  get editStructureChecks() {
    if (!this.editAnalysis) return [];

    const violations = this.editViolations;
    const hasAnswerFirst = violations.some((v) => v.type === 'answer-first');
    const hasSectionLength = violations.some(
      (v) => v.type === 'section-length'
    );
    const hasPreamble = violations.some((v) => v.type === 'preamble');
    const hasVagueHeading = violations.some((v) => v.type === 'vague-heading');

    return [
      {
        key: 'answer-first',
        label: hasAnswerFirst
          ? 'Answer-first: Issues found'
          : 'Answer-first: Pass',
        iconName: hasAnswerFirst ? 'utility:warning' : 'utility:success',
        variant: hasAnswerFirst ? 'warning' : 'success'
      },
      {
        key: 'section-length',
        label: hasSectionLength
          ? 'Section length: Too long'
          : 'Section length: Pass',
        iconName: hasSectionLength ? 'utility:warning' : 'utility:success',
        variant: hasSectionLength ? 'warning' : 'success'
      },
      {
        key: 'preamble',
        label: hasPreamble ? 'Preamble detected' : 'No preamble: Pass',
        iconName: hasPreamble ? 'utility:warning' : 'utility:success',
        variant: hasPreamble ? 'warning' : 'success'
      },
      {
        key: 'headings',
        label: hasVagueHeading
          ? 'Vague headings found'
          : 'Specific headings: Pass',
        iconName: hasVagueHeading ? 'utility:warning' : 'utility:success',
        variant: hasVagueHeading ? 'warning' : 'success'
      }
    ];
  }

  get editWritingTips() {
    const content = this.editDetails || '';
    const tips = [];

    if (!/^\d+\./m.test(content)) {
      tips.push('Use numbered steps for procedures');
    }
    if (!/result|outcome|expected/i.test(content)) {
      tips.push('State expected results after each procedure');
    }
    if (!/before you begin|prerequisite/i.test(content)) {
      tips.push('Add a "Before you begin" section for prerequisites');
    }
    tips.push('Keep each section under 250 words for optimal RAG retrieval');
    tips.push('Make headings specific and descriptive');

    return tips.slice(0, 4);
  }

  // ========== AI Metadata / Enrichment Display Getters ==========

  get hasAcceptedMetadata() {
    if (!this.acceptedMetadata) return false;
    return Object.keys(this.acceptedMetadata).some((k) => {
      const v = this.acceptedMetadata[k];
      return Array.isArray(v) ? v.length > 0 : !!v;
    });
  }

  get metadataDisplayRows() {
    if (!this.acceptedMetadata) return [];
    const labels = {
      products: 'Products',
      featureArea: 'Feature Area',
      primaryAudience: 'Primary Audience',
      contentType: 'Content Type',
      releaseVersions: 'Release Versions',
      useCase: 'Use Case',
      complexity: 'Complexity',
      confidenceLevel: 'Confidence Level'
    };

    return Object.keys(labels).map((key) => {
      const value = this.acceptedMetadata[key];
      let displayValue = '—';
      if (Array.isArray(value) && value.length > 0) {
        displayValue = value.join(', ');
      } else if (value && typeof value === 'string') {
        displayValue = value;
      }
      return {
        key,
        label: labels[key],
        value: displayValue,
        hasValue: displayValue !== '—'
      };
    });
  }

  get hasApprovedEnrichment() {
    return !!this.approvedEnrichment;
  }

  get enrichmentSummary() {
    return this.approvedEnrichment?.summary || '';
  }

  get hasEnrichmentSummary() {
    return !!this.approvedEnrichment?.summary;
  }

  get enrichmentAbstract() {
    return this.approvedEnrichment?.abstract || '';
  }

  get enrichmentFaqs() {
    return this.approvedEnrichment?.faqs || [];
  }

  get hasFaqs() {
    return this.enrichmentFaqs.length > 0;
  }

  get enrichmentEntities() {
    return (
      this.approvedEnrichment?.entities || {
        products: [],
        features: [],
        uiElements: [],
        apiNames: []
      }
    );
  }

  get entityProducts() {
    return this.enrichmentEntities.products || [];
  }

  get entityFeatures() {
    return this.enrichmentEntities.features || [];
  }

  get entityUiElements() {
    return this.enrichmentEntities.uiElements || [];
  }

  get entityApiNames() {
    return this.enrichmentEntities.apiNames || [];
  }

  get hasEntityProducts() {
    return this.entityProducts.length > 0;
  }

  get hasEntityFeatures() {
    return this.entityFeatures.length > 0;
  }

  get hasEntityUiElements() {
    return this.entityUiElements.length > 0;
  }

  get hasEntityApiNames() {
    return this.entityApiNames.length > 0;
  }
}
