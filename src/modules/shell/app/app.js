import { LightningElement, track } from 'lwc';

export default class App extends LightningElement {
  @track activeTab = 'articleAnalyzer';

  get isAnalyzerActive() {
    return this.activeTab === 'articleAnalyzer';
  }

  get isAuthorActive() {
    return this.activeTab === 'guidedAuthor';
  }

  get isMetadataActive() {
    return this.activeTab === 'metadataSuggester';
  }

  get isEnrichmentActive() {
    return this.activeTab === 'enrichmentPreview';
  }

  get isDashboardActive() {
    return this.activeTab === 'healthDashboard';
  }

  get analyzerTabClass() {
    return this.isAnalyzerActive ? 'slds-tabs_default__item slds-is-active' : 'slds-tabs_default__item';
  }

  get authorTabClass() {
    return this.isAuthorActive ? 'slds-tabs_default__item slds-is-active' : 'slds-tabs_default__item';
  }

  get metadataTabClass() {
    return this.isMetadataActive ? 'slds-tabs_default__item slds-is-active' : 'slds-tabs_default__item';
  }

  get enrichmentTabClass() {
    return this.isEnrichmentActive ? 'slds-tabs_default__item slds-is-active' : 'slds-tabs_default__item';
  }

  get dashboardTabClass() {
    return this.isDashboardActive ? 'slds-tabs_default__item slds-is-active' : 'slds-tabs_default__item';
  }

  handleTabClick(event) {
    const tabName = event.currentTarget.dataset.tab;
    this.activeTab = tabName;
  }

  handleNavigate(event) {
    const { tab } = event.detail;
    if (tab) {
      this.activeTab = tab;
    }
  }
}
