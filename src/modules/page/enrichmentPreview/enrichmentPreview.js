import { LightningElement, track } from 'lwc';
import { getCurrentArticle, getEnrichmentData } from 'data/articleState';

export default class EnrichmentPreview extends LightningElement {
  @track currentArticle = null;
  @track enrichment = null;
  @track showApprovedMessage = false;

  connectedCallback() {
    this.currentArticle = getCurrentArticle();
    this.enrichment = getEnrichmentData();
  }

  get hasArticle() {
    return !!this.currentArticle && !!this.enrichment;
  }

  get abstract() {
    return this.enrichment?.abstract || '';
  }

  get faqs() {
    return this.enrichment?.faqs || [];
  }

  get entities() {
    return this.enrichment?.entities || { products: [], features: [], uiElements: [], apiNames: [] };
  }

  get products() {
    return this.entities.products;
  }

  get features() {
    return this.entities.features;
  }

  get uiElements() {
    return this.entities.uiElements;
  }

  get apiNames() {
    return this.entities.apiNames;
  }

  get hasProducts() {
    return this.products.length > 0;
  }

  get hasFeatures() {
    return this.features.length > 0;
  }

  get hasUiElements() {
    return this.uiElements.length > 0;
  }

  get hasApiNames() {
    return this.apiNames.length > 0;
  }

  handleApproveAll() {
    this.showApprovedMessage = true;
    setTimeout(() => {
      this.showApprovedMessage = false;
    }, 3000);
  }

  handleViewDashboard() {
    this.dispatchEvent(new CustomEvent('navigate', {
      detail: { tab: 'healthDashboard' },
      bubbles: true,
      composed: true
    }));
  }
}
