import { LightningElement, track } from 'lwc';
import { getCurrentArticle, getMetadataSuggestions, updateArticleMetadata } from 'data/articleState';
import { METADATA_SCHEMA, calculateMetadataCompleteness, getFieldLabel } from 'data/metadataVocabulary';

export default class MetadataSuggester extends LightningElement {
  @track currentArticle = null;
  @track suggestions = null;
  @track acceptedMetadata = null;
  @track showAcceptedMessage = false;
  @track acceptedMessage = '';

  connectedCallback() {
    this.loadFromState();
  }

  loadFromState() {
    this.currentArticle = getCurrentArticle();
    this.suggestions = getMetadataSuggestions();

    if (this.currentArticle) {
      this.acceptedMetadata = { ...this.currentArticle.metadata };
    }
  }

  get hasArticle() {
    return !!this.currentArticle && !!this.suggestions;
  }

  get articleTitle() {
    return this.currentArticle?.title || 'Untitled';
  }

  get articleSnippet() {
    const content = this.currentArticle?.content || '';
    const cleaned = content.replace(/^#.*$/gm, '').trim();
    return cleaned.substring(0, 200) + (cleaned.length > 200 ? '...' : '');
  }

  get completenessPercent() {
    return calculateMetadataCompleteness(this.acceptedMetadata || {});
  }

  get completenessSummary() {
    const pct = this.completenessPercent;
    if (pct >= 80) return 'Complete - ready to publish';
    if (pct >= 50) return 'Partially complete - review suggestions below';
    return 'Incomplete - accept AI suggestions to fill missing fields';
  }

  get fieldEntries() {
    if (!this.suggestions) return [];

    const entries = [];
    const fieldNames = ['products', 'featureArea', 'primaryAudience', 'contentType', 'releaseVersions', 'useCase', 'complexity', 'confidenceLevel'];

    fieldNames.forEach(name => {
      const schema = METADATA_SCHEMA[name];
      const suggestion = this.suggestions[name];

      if (!schema) return;

      const isMulti = schema.multiSelect;
      let suggestedValues = [];
      let suggestedValue = null;
      let confidence = null;

      if (isMulti && Array.isArray(suggestion)) {
        suggestedValues = suggestion;
        if (suggestion.length > 0) {
          confidence = suggestion[0].confidence;
        }
      } else if (suggestion && typeof suggestion === 'object' && suggestion.value) {
        suggestedValue = suggestion.value;
        confidence = suggestion.confidence;
      }

      entries.push({
        name,
        label: getFieldLabel(name),
        required: schema.required,
        isMulti,
        suggestedValues,
        suggestedValue,
        hasSuggestions: isMulti ? suggestedValues.length > 0 : !!suggestedValue,
        confidence,
        lowConfidence: confidence !== null && confidence < 0.7
      });
    });

    return entries;
  }

  handleAcceptAll() {
    if (!this.suggestions) return;

    const newMetadata = {};
    Object.keys(this.suggestions).forEach(field => {
      const value = this.suggestions[field];
      if (Array.isArray(value)) {
        newMetadata[field] = value.map(v => v.value);
      } else if (value && typeof value === 'object') {
        newMetadata[field] = value.value;
      }
    });

    this.acceptedMetadata = newMetadata;
    updateArticleMetadata(newMetadata);
    this.acceptedMessage = `All metadata suggestions accepted (${this.completenessPercent}% complete)`;
    this.showSuccessMessage();
  }

  handleAcceptHighConfidence() {
    if (!this.suggestions) return;

    const newMetadata = { ...this.acceptedMetadata };
    let acceptedCount = 0;

    Object.keys(this.suggestions).forEach(field => {
      const value = this.suggestions[field];
      if (Array.isArray(value)) {
        const highConf = value.filter(v => v.confidence >= 0.85);
        if (highConf.length > 0) {
          newMetadata[field] = highConf.map(v => v.value);
          acceptedCount++;
        }
      } else if (value && typeof value === 'object' && value.confidence >= 0.85) {
        newMetadata[field] = value.value;
        acceptedCount++;
      }
    });

    this.acceptedMetadata = newMetadata;
    updateArticleMetadata(newMetadata);
    this.acceptedMessage = `${acceptedCount} high-confidence fields accepted (${this.completenessPercent}% complete)`;
    this.showSuccessMessage();
  }

  showSuccessMessage() {
    this.showAcceptedMessage = true;
    setTimeout(() => {
      this.showAcceptedMessage = false;
    }, 3000);
  }

  handleViewEnrichment() {
    this.dispatchEvent(new CustomEvent('navigate', {
      detail: { tab: 'enrichmentPreview' },
      bubbles: true,
      composed: true
    }));
  }
}
