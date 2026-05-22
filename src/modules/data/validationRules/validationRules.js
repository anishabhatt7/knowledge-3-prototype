// src/modules/data/validationRules.js

export function analyzeArticle(content) {
  const sections = extractSections(content);
  const violations = [];
  let score = 100;

  // Check 1: Answer-first structure
  sections.forEach(section => {
    if (section.level === 2) { // Only check H2 sections
      const firstSentences = section.content.split('.').slice(0, 2).join('.');
      if (!hasDirectAnswer(firstSentences, section.heading)) {
        violations.push({
          type: 'answer-first',
          section: section.heading,
          severity: 'error',
          message: `No answer-first structure in "${section.heading}" section`,
          suggestion: 'First 2 sentences should state the direct answer'
        });
        score -= 15;
      }
    }
  });

  // Check 2: Section length (target <250 words)
  sections.forEach(section => {
    const wordCount = section.content.split(/\s+/).length;
    if (wordCount > 250) {
      violations.push({
        type: 'section-length',
        section: section.heading,
        severity: 'error',
        message: `Section "${section.heading}" exceeds 250 words`,
        detail: `Current: ${wordCount} words | Target: <250 words`,
        suggestion: 'Break this section into smaller subsections or remove unnecessary detail'
      });
      score -= 10;
    }
  });

  // Check 3: Preamble detection
  const firstParagraph = extractFirstParagraph(content);
  if (hasPreamble(firstParagraph)) {
    const wordCount = firstParagraph.split(/\s+/).length;
    violations.push({
      type: 'preamble',
      severity: 'warning',
      message: `Preamble detected: first ${wordCount} words are introductory`,
      suggestion: 'Move answer before context/background'
    });
    score -= 10;
  }

  // Check 4: Vague headings
  sections.forEach(section => {
    if (isVagueHeading(section.heading)) {
      violations.push({
        type: 'vague-heading',
        section: section.heading,
        severity: 'warning',
        message: `Vague heading: "${section.heading}"`,
        suggestion: 'Use specific heading like "How to Configure SSO" or "SSO Prerequisites"'
      });
      score -= 5;
    }
  });

  return {
    score: Math.max(0, score),
    violations,
    sections
  };
}

function extractSections(content) {
  const lines = content.split('\n');
  const sections = [];
  let currentSection = null;

  lines.forEach(line => {
    const h1Match = line.match(/^# (.+)$/);
    const h2Match = line.match(/^## (.+)$/);
    const h3Match = line.match(/^### (.+)$/);

    if (h1Match || h2Match || h3Match) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        heading: (h1Match || h2Match || h3Match)[1],
        level: h1Match ? 1 : (h2Match ? 2 : 3),
        content: ''
      };
    } else if (currentSection) {
      currentSection.content += line + '\n';
    }
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

function hasDirectAnswer(text, heading) {
  // Check if first sentences contain action verbs or direct statements
  const actionPatterns = [
    /^(to |the |click |open |select |navigate |go to |set |configure |enable )/i,
    /^\d+\./,  // Starts with numbered step
    /is a|are the|means|refers to/i  // Definition patterns
  ];

  // Preamble patterns to avoid
  const preamblePatterns = [
    /^(this article|this section|this guide|in this|before we)/i,
    /^(understanding|introduction|overview)/i
  ];

  const hasPreamble = preamblePatterns.some(pattern => pattern.test(text));
  const hasAction = actionPatterns.some(pattern => pattern.test(text));

  return hasAction && !hasPreamble;
}

function extractFirstParagraph(content) {
  const paragraphs = content.split(/\n\n+/);
  // Skip title lines that start with #
  for (let para of paragraphs) {
    if (!para.trim().startsWith('#')) {
      return para.trim();
    }
  }
  return '';
}

function hasPreamble(text) {
  const preambleIndicators = [
    /this article provides/i,
    /this guide will/i,
    /in this article/i,
    /before we begin/i,
    /it's important to understand/i,
    /let's explore/i,
    /this section covers/i
  ];

  return preambleIndicators.some(pattern => pattern.test(text)) || text.split(/\s+/).length > 100;
}

function isVagueHeading(heading) {
  const vagueTerms = [
    'overview',
    'introduction',
    'details',
    'information',
    'general',
    'background',
    'about',
    'summary'
  ];

  const lowerHeading = heading.toLowerCase();
  return vagueTerms.some(term => lowerHeading === term || lowerHeading.includes(term)) || heading.split(/\s+/).length < 3;
}

export function getScoreColor(score) {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'error';
}

export function getScoreLabel(score) {
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Needs Improvement';
  return 'Poor';
}
