import { LightningElement, track } from 'lwc';
import { SAMPLE_ARTICLES } from 'data/sampleArticles';
import { setCurrentArticle, getCurrentArticle, getAnalysisResults, updateArticleContent } from 'data/articleState';
import { getScoreColor, getScoreLabel } from 'data/validationRules';

export default class GuidedAuthor extends LightningElement {
  @track articleContent = '';
  @track currentArticle = null;
  @track analysisData = null;
  debounceTimer = null;

  connectedCallback() {
    // Load any article that was set in state from another tab
    const stateArticle = getCurrentArticle();
    if (stateArticle) {
      this.currentArticle = stateArticle;
      this.articleContent = stateArticle.content || '';
      this.analysisData = getAnalysisResults();
    }
  }

  get sampleArticleOptions() {
    return SAMPLE_ARTICLES.map(article => ({
      label: article.title,
      value: String(article.id)
    }));
  }

  get hasContent() {
    return this.articleContent && this.articleContent.trim().length > 0;
  }

  handleSampleArticleSelect(event) {
    const articleId = parseInt(event.detail.value, 10);
    const article = SAMPLE_ARTICLES.find(a => a.id === articleId);

    if (article) {
      this.currentArticle = article;
      this.articleContent = article.content;
      setCurrentArticle(article);
      this.analysisData = getAnalysisResults();
    }
  }

  handleContentChange(event) {
    this.articleContent = event.detail.value;

    // Debounce analysis updates
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.runAnalysis();
    }, 500);
  }

  runAnalysis() {
    if (!this.currentArticle) {
      this.currentArticle = {
        id: Date.now(),
        title: 'Custom Article',
        content: this.articleContent,
        metadata: {}
      };
      setCurrentArticle(this.currentArticle);
    } else {
      updateArticleContent(this.articleContent);
    }
    this.analysisData = getAnalysisResults();
  }

  get scoreDisplay() {
    return `${this.analysisData?.score || 0}/100`;
  }

  get scoreLabel() {
    return getScoreLabel(this.analysisData?.score || 0);
  }

  get scoreStatus() {
    return getScoreColor(this.analysisData?.score || 0);
  }

  get violations() {
    return this.analysisData?.violations || [];
  }

  get hasViolations() {
    return this.violations && this.violations.length > 0;
  }

  get structureChecks() {
    if (!this.hasContent || !this.analysisData) {
      return [];
    }

    const violations = this.violations;
    const hasAnswerFirstViolation = violations.some(v => v.type === 'answer-first');
    const hasSectionLengthViolation = violations.some(v => v.type === 'section-length');
    const hasPreambleViolation = violations.some(v => v.type === 'preamble');
    const hasVagueHeadingViolation = violations.some(v => v.type === 'vague-heading');

    return [
      {
        name: 'answer-first',
        label: hasAnswerFirstViolation ? 'Answer-first: Issues found' : 'Answer-first: Pass',
        iconName: hasAnswerFirstViolation ? 'utility:warning' : 'utility:success',
        variant: hasAnswerFirstViolation ? 'warning' : 'success'
      },
      {
        name: 'section-length',
        label: hasSectionLengthViolation ? 'Section length: Too long' : 'Section length: Pass',
        iconName: hasSectionLengthViolation ? 'utility:warning' : 'utility:success',
        variant: hasSectionLengthViolation ? 'warning' : 'success'
      },
      {
        name: 'preamble',
        label: hasPreambleViolation ? 'Preamble detected' : 'No preamble: Pass',
        iconName: hasPreambleViolation ? 'utility:warning' : 'utility:success',
        variant: hasPreambleViolation ? 'warning' : 'success'
      },
      {
        name: 'headings',
        label: hasVagueHeadingViolation ? 'Vague headings found' : 'Specific headings: Pass',
        iconName: hasVagueHeadingViolation ? 'utility:warning' : 'utility:success',
        variant: hasVagueHeadingViolation ? 'warning' : 'success'
      }
    ];
  }

  get writingTips() {
    const content = this.articleContent || '';
    const tips = [];

    if (!content || content.length < 50) {
      tips.push('Start with a verb-first title for procedures (e.g., "Configure SSO")');
      tips.push('Open each section with the direct answer in 1-2 sentences');
      tips.push('Use specific headings like "How to Configure SSO" not "Overview"');
    } else {
      // Contextual tips based on what's in the content
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
    }

    return tips.slice(0, 4);
  }

  handleAddMetadata() {
    this.dispatchEvent(new CustomEvent('navigate', {
      detail: { tab: 'metadataSuggester' },
      bubbles: true,
      composed: true
    }));
  }

  handleViewEnrichment() {
    this.dispatchEvent(new CustomEvent('navigate', {
      detail: { tab: 'enrichmentPreview' },
      bubbles: true,
      composed: true
    }));
  }
}
