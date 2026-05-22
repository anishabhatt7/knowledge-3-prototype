// src/modules/data/articleState.js
import { analyzeArticle } from './validationRules';
import { suggestMetadata, generateEnrichment } from './simulationEngine';

let currentArticle = null;
let analysisResults = null;
let metadataSuggestions = null;
let enrichmentData = null;

export function setCurrentArticle(article) {
  currentArticle = article;

  // Run analysis automatically
  if (article && article.content) {
    analysisResults = analyzeArticle(article.content);
    metadataSuggestions = suggestMetadata(article.content, article.title);
    enrichmentData = generateEnrichment(
      article.content,
      article.title,
      metadataSuggestions
    );
  }
}

export function getCurrentArticle() {
  return currentArticle;
}

export function getAnalysisResults() {
  return analysisResults;
}

export function getMetadataSuggestions() {
  return metadataSuggestions;
}

export function getEnrichmentData() {
  return enrichmentData;
}

export function updateArticleContent(content) {
  if (currentArticle) {
    currentArticle.content = content;
    // Re-run analysis with updated content
    analysisResults = analyzeArticle(content);
    metadataSuggestions = suggestMetadata(content, currentArticle.title);
    enrichmentData = generateEnrichment(
      content,
      currentArticle.title,
      metadataSuggestions
    );
  }
}

export function updateArticleMetadata(metadata) {
  if (currentArticle) {
    currentArticle.metadata = { ...currentArticle.metadata, ...metadata };
    // Re-run enrichment with updated metadata
    enrichmentData = generateEnrichment(
      currentArticle.content,
      currentArticle.title,
      currentArticle.metadata
    );
  }
}
