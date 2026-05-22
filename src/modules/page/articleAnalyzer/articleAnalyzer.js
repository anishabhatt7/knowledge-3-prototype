import { LightningElement, track } from 'lwc';
import { SAMPLE_ARTICLES } from 'data/sampleArticles';
import { setCurrentArticle, getAnalysisResults } from 'data/articleState';
import { getScoreColor, getScoreLabel } from 'data/validationRules';
import { calculateMetadataCompleteness } from 'data/metadataVocabulary';

export default class ArticleAnalyzer extends LightningElement {
  @track articleContent = '';
  @track currentArticle = null;
  @track showResults = false;

  get sampleArticleOptions() {
    return SAMPLE_ARTICLES.map(article => ({
      label: article.title,
      value: String(article.id)
    }));
  }

  get isAnalyzeDisabled() {
    return !this.articleContent || this.articleContent.trim().length === 0;
  }

  handleSampleArticleSelect(event) {
    const articleId = parseInt(event.detail.value, 10);
    const article = SAMPLE_ARTICLES.find(a => a.id === articleId);

    if (article) {
      this.currentArticle = article;
      this.articleContent = article.content;
    }
  }

  handleContentChange(event) {
    this.articleContent = event.detail.value;
  }

  handleAnalyze() {
    if (!this.currentArticle) {
      this.currentArticle = {
        id: Date.now(),
        title: 'Custom Article',
        content: this.articleContent,
        metadata: {}
      };
    } else {
      this.currentArticle.content = this.articleContent;
    }

    setCurrentArticle(this.currentArticle);
    this.showResults = true;
  }

  get analysisResults() {
    return getAnalysisResults();
  }

  get scoreDisplay() {
    return `${this.analysisResults?.score || 0}/100`;
  }

  get scoreLabel() {
    return getScoreLabel(this.analysisResults?.score || 0);
  }

  get scoreStatus() {
    return getScoreColor(this.analysisResults?.score || 0);
  }

  get metadataDisplay() {
    const percent = calculateMetadataCompleteness(this.currentArticle?.metadata || {});
    return `${percent}%`;
  }

  get metadataSubtitle() {
    const percent = calculateMetadataCompleteness(this.currentArticle?.metadata || {});
    return percent >= 80 ? 'Complete' : 'Incomplete';
  }

  get metadataStatus() {
    const percent = calculateMetadataCompleteness(this.currentArticle?.metadata || {});
    if (percent >= 80) return 'success';
    if (percent >= 50) return 'warning';
    return 'error';
  }

  get violationCount() {
    return this.analysisResults?.violations?.length || 0;
  }

  get violationSubtitle() {
    const count = this.violationCount;
    if (count === 0) return 'None found';
    if (count === 1) return '1 issue';
    return `${count} issues`;
  }

  get violationStatus() {
    const count = this.violationCount;
    if (count === 0) return 'success';
    if (count <= 2) return 'warning';
    return 'error';
  }

  get violations() {
    return this.analysisResults?.violations || [];
  }

  handleFixInAuthor() {
    this.dispatchEvent(new CustomEvent('navigate', {
      detail: { tab: 'guidedAuthor' },
      bubbles: true,
      composed: true
    }));
  }

  handleAddMetadata() {
    this.dispatchEvent(new CustomEvent('navigate', {
      detail: { tab: 'metadataSuggester' },
      bubbles: true,
      composed: true
    }));
  }

  handleViewDashboard() {
    this.dispatchEvent(new CustomEvent('navigate', {
      detail: { tab: 'healthDashboard' },
      bubbles: true,
      composed: true
    }));
  }
}
