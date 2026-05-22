import { LightningElement, track } from 'lwc';
import { SAMPLE_ARTICLES } from 'data/sampleArticles';
import { setCurrentArticle } from 'data/articleState';

export default class KnowledgeArticle extends LightningElement {
  @track activeModal = null; // null | 'analyze' | 'metadata' | 'enrich' | 'dashboard'

  connectedCallback() {
    // Default to first sample article (Configure SSO - the poor quality one)
    setCurrentArticle(SAMPLE_ARTICLES[0]);
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
}
