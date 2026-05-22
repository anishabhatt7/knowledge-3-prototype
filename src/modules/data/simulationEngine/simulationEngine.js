// src/modules/data/simulationEngine.js

export function suggestMetadata(articleContent, articleTitle) {
  const lowerContent = articleContent.toLowerCase();
  const lowerTitle = articleTitle.toLowerCase();

  // Product detection via keywords
  const products = [];
  if (/(service cloud|case|knowledge|help agent)/i.test(articleContent)) {
    products.push({ value: 'Service Cloud', confidence: 0.92 });
  }
  if (/(sales cloud|opportunity|lead|account)/i.test(articleContent)) {
    products.push({ value: 'Sales Cloud', confidence: 0.88 });
  }
  if (/(flow|automation|process builder)/i.test(articleContent)) {
    products.push({ value: 'Platform', confidence: 0.85 });
  }
  if (/(knowledge article|data categor)/i.test(articleContent)) {
    products.push({ value: 'Knowledge', confidence: 0.80 });
  }

  // Feature area detection
  const featureArea = [];
  if (/(knowledge|article|data categor)/i.test(articleContent)) {
    featureArea.push({ value: 'Knowledge Management', confidence: 0.85 });
  }
  if (/(case|queue|assignment)/i.test(articleContent)) {
    featureArea.push({ value: 'Case Management', confidence: 0.82 });
  }
  if (/(flow|trigger|automation)/i.test(articleContent)) {
    featureArea.push({ value: 'Flows', confidence: 0.88 });
  }
  if (/(api|rest|soap|endpoint)/i.test(articleContent)) {
    featureArea.push({ value: 'API', confidence: 0.90 });
  }

  // Content type inference
  const hasSteps = /^\d+\.\s/m.test(articleContent);
  let contentType = 'Concept';
  let contentTypeConfidence = 0.60;

  if (hasSteps) {
    contentType = 'Procedure';
    contentTypeConfidence = 0.95;
  } else if (/troubleshoot|error|issue|problem|fix/i.test(lowerTitle)) {
    contentType = 'Troubleshooting';
    contentTypeConfidence = 0.85;
  } else if (/reference|field|object|api/i.test(lowerTitle)) {
    contentType = 'Reference';
    contentTypeConfidence = 0.78;
  } else if (/what is|understanding|overview|concept/i.test(lowerContent)) {
    contentType = 'Concept';
    contentTypeConfidence = 0.75;
  }

  // Audience inference
  let audience = 'End User';
  let audienceConfidence = 0.50;

  if (/(setup|configure|permission|manage|admin)/i.test(lowerTitle)) {
    audience = 'Admin';
    audienceConfidence = 0.88;
  } else if (/(api|code|develop|class|method|trigger|apex)/i.test(lowerContent)) {
    audience = 'Developer';
    audienceConfidence = 0.82;
  } else if (/(architect|design|pattern|scale)/i.test(lowerContent)) {
    audience = 'Architect';
    audienceConfidence = 0.75;
  }

  // Use case detection
  const useCase = [];
  if (/(setup|install|enable)/i.test(lowerContent)) {
    useCase.push({ value: 'Setup', confidence: 0.82 });
  }
  if (/(configure|setting|option)/i.test(lowerContent)) {
    useCase.push({ value: 'Configuration', confidence: 0.78 });
  }
  if (/(troubleshoot|error|issue|problem)/i.test(lowerContent)) {
    useCase.push({ value: 'Troubleshooting', confidence: 0.85 });
  }
  if (/(best practice|recommend|tip)/i.test(lowerContent)) {
    useCase.push({ value: 'Best Practices', confidence: 0.80 });
  }

  // Complexity inference
  let complexity = 'Intermediate';
  let complexityConfidence = 0.70;

  const wordCount = articleContent.split(/\s+/).length;
  const hasCode = /```|`[^`]+`/.test(articleContent);
  const stepCount = (articleContent.match(/^\d+\./gm) || []).length;

  if (wordCount < 300 && stepCount < 5 && !hasCode) {
    complexity = 'Beginner';
    complexityConfidence = 0.75;
  } else if (wordCount > 800 || hasCode || stepCount > 10) {
    complexity = 'Advanced';
    complexityConfidence = 0.72;
  }

  // Release version (lower confidence - requires real context)
  const releaseVersion = 'Spring26';
  const releaseConfidence = 0.70;

  return {
    products,
    featureArea,
    primaryAudience: { value: audience, confidence: audienceConfidence },
    contentType: { value: contentType, confidence: contentTypeConfidence },
    releaseVersions: [{ value: releaseVersion, confidence: releaseConfidence }],
    useCase,
    complexity: { value: complexity, confidence: complexityConfidence },
    confidenceLevel: { value: 'In Review', confidence: 1.0 }
  };
}

export function generateEnrichment(articleContent, articleTitle, metadata) {
  return {
    abstract: generateAbstract(articleContent, articleTitle, metadata.contentType?.value),
    faqs: generateFAQs(articleContent, articleTitle, metadata.contentType?.value),
    entities: extractEntities(articleContent)
  };
}

function generateAbstract(content, title, contentType) {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const firstMeaningfulSentence = sentences.find(s => !s.match(/^#|this article|this guide/i)) || sentences[0];

  // Extract key topics from headings
  const headings = content.match(/^#{2,3} (.+)$/gm) || [];
  const topics = headings
    .map(h => h.replace(/^#{2,3} /, '').toLowerCase())
    .filter(h => !/(overview|introduction|detail)/i.test(h))
    .slice(0, 3)
    .join(', ');

  return `This article answers: ${title}. It covers: ${topics || 'configuration steps, prerequisites, and expected results'}.`;
}

function generateFAQs(content, title, contentType) {
  const faqs = [];
  const lowerTitle = title.toLowerCase();

  if (contentType === 'Procedure') {
    faqs.push(`How do I ${lowerTitle}?`);
    faqs.push(`What are the prerequisites for ${lowerTitle}?`);
    faqs.push(`What are the steps to ${lowerTitle}?`);
  } else if (contentType === 'Concept') {
    faqs.push(`What is ${title}?`);
    faqs.push(`How does ${title} work?`);
    faqs.push(`When should I use ${title}?`);
  } else if (contentType === 'Troubleshooting') {
    faqs.push(`Why am I seeing this error?`);
    faqs.push(`How do I fix ${lowerTitle}?`);
    faqs.push(`What causes ${lowerTitle}?`);
  } else {
    faqs.push(`What is ${title}?`);
    faqs.push(`How do I use ${title}?`);
  }

  // Add context-specific questions
  if (/permission|access|security/i.test(content)) {
    faqs.push('What permissions do I need?');
  }
  if (/setting|configuration/i.test(content)) {
    faqs.push('Where are the settings located?');
  }
  if (/result|expect|outcome/i.test(content)) {
    faqs.push('What should I expect after completing this?');
  }

  return faqs.slice(0, 5); // Max 5 questions
}

function extractEntities(content) {
  const entities = {
    products: [],
    features: [],
    uiElements: [],
    apiNames: []
  };

  // Product patterns
  const productPatterns = {
    'Service Cloud': /service cloud/gi,
    'Sales Cloud': /sales cloud/gi,
    'Knowledge': /\bknowledge\b/gi,
    'Einstein': /\beinstein\b/gi,
    'Platform': /\bplatform\b/gi
  };

  Object.entries(productPatterns).forEach(([product, pattern]) => {
    if (pattern.test(content) && !entities.products.includes(product)) {
      entities.products.push(product);
    }
  });

  // Feature patterns
  const featurePatterns = {
    'Help Agent': /help agent/gi,
    'Knowledge Integration': /knowledge integration/gi,
    'Case Management': /case (management|assignment)/gi,
    'Flow Builder': /flow builder/gi
  };

  Object.entries(featurePatterns).forEach(([feature, pattern]) => {
    if (pattern.test(content) && !entities.features.includes(feature)) {
      entities.features.push(feature);
    }
  });

  // UI element patterns (buttons, pages, toggles)
  const uiPatterns = [
    /click\s+["']?([A-Z][^"'.,\n]+)["']?/gi,
    /toggle\s+["']?([A-Z][^"'.,\n]+)["']?/gi,
    /open\s+["']?([A-Z][^"'.,\n]+)["']?/gi,
    /["']?([A-Z][^"'.,\n]+)["']?\s+(page|panel|button|toggle|settings)/gi
  ];

  uiPatterns.forEach(pattern => {
    const matches = [...content.matchAll(pattern)];
    matches.forEach(match => {
      const element = match[1].trim();
      if (element.length > 3 && element.length < 50 && !entities.uiElements.includes(element)) {
        entities.uiElements.push(element);
      }
    });
  });

  // API name patterns (e.g., __c, __mdt)
  const apiPattern = /\b([A-Z][A-Za-z0-9_]+__[cmrts])\b/g;
  const apiMatches = [...content.matchAll(apiPattern)];
  entities.apiNames = [...new Set(apiMatches.map(m => m[1]))];

  return entities;
}

export function calculatePriority(ragScore, metadataPercent) {
  // Priority = (100 - RAG score) × (100 - metadata %) × 0.01
  return Math.round((100 - ragScore) * (100 - metadataPercent) * 0.01);
}

export function getPriorityStatus(priority) {
  if (priority >= 70) return 'high';
  if (priority >= 40) return 'medium';
  return 'low';
}
