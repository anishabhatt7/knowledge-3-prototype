import { LightningElement, track } from 'lwc';
import { SAMPLE_ARTICLES } from 'data/sampleArticles';
import { setCurrentArticle, getAnalysisResults } from 'data/articleState';

export default class KnowledgeArticle extends LightningElement {
  @track activeModal = null; // null | 'analyze' | 'metadata' | 'enrich' | 'dashboard'

  // Edit modal state
  @track isEditModalOpen = false;
  @track editTitle = '';
  @track editSummary = '';
  @track editDetails = '';
  @track editInternalComments = '';
  @track editAnalysis = null;
  debounceTimer = null;

  connectedCallback() {
    // Default to first sample article (Configure SSO - the poor quality one)
    setCurrentArticle(SAMPLE_ARTICLES[0]);
    this.editTitle = SAMPLE_ARTICLES[0].title;
    this.editDetails = SAMPLE_ARTICLES[0].content;
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
    this.activeModal = 'dashboard';
  }

  handleCloseModal() {
    this.activeModal = null;
  }

  // Handle navigate events from child components - switch to the requested modal
  handleNavigate(event) {
    const { tab } = event.detail;
    const tabToModal = {
      articleAnalyzer: 'analyze',
      metadataSuggester: 'metadata',
      enrichmentPreview: 'enrich',
      healthDashboard: 'dashboard',
      guidedAuthor: null // Guided author closes modals - it's the Edit modal handled separately
    };
    this.activeModal =
      tabToModal[tab] !== undefined ? tabToModal[tab] : this.activeModal;
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
}
