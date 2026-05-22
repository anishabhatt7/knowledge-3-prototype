// src/modules/data/metadataVocabulary.js

export const METADATA_SCHEMA = {
  products: {
    required: true,
    multiSelect: true,
    options: [
      'Service Cloud',
      'Sales Cloud',
      'Marketing Cloud',
      'Commerce Cloud',
      'Platform',
      'Einstein',
      'Data Cloud',
      'Knowledge'
    ]
  },
  featureArea: {
    required: true,
    multiSelect: true,
    options: [
      'Knowledge Management',
      'Case Management',
      'Flows',
      'Reports',
      'API',
      'Security',
      'Integration',
      'Automation'
    ]
  },
  primaryAudience: {
    required: true,
    multiSelect: false,
    options: ['Admin', 'Developer', 'End User', 'Architect', 'Analyst']
  },
  contentType: {
    required: true,
    multiSelect: false,
    options: ['Procedure', 'Concept', 'Reference', 'Troubleshooting', 'FAQ', 'Release Notes']
  },
  releaseVersions: {
    required: true,
    multiSelect: true,
    options: ['Winter25', 'Spring25', 'Summer25', 'Winter26', 'Spring26', 'Summer26']
  },
  useCase: {
    required: false,
    multiSelect: true,
    options: [
      'Setup',
      'Configuration',
      'Troubleshooting',
      'How-to',
      'Best Practices',
      'API Integration',
      'Conceptual'
    ]
  },
  complexity: {
    required: true,
    multiSelect: false,
    options: ['Beginner', 'Intermediate', 'Advanced']
  },
  confidenceLevel: {
    required: true,
    multiSelect: false,
    options: ['Verified', 'In Review', 'Needs Update'],
    default: 'In Review'
  }
};

export function getFieldLabel(fieldName) {
  const labels = {
    products: 'Product(s)',
    featureArea: 'Feature Area',
    primaryAudience: 'Primary Audience',
    contentType: 'Content Type',
    releaseVersions: 'Release Version(s)',
    useCase: 'Use Case',
    complexity: 'Complexity Level',
    confidenceLevel: 'Confidence Level'
  };
  return labels[fieldName] || fieldName;
}

export function calculateMetadataCompleteness(metadata) {
  let filledCount = 0;
  let totalRequired = 0;

  Object.keys(METADATA_SCHEMA).forEach(field => {
    if (METADATA_SCHEMA[field].required) {
      totalRequired++;
      const value = metadata[field];
      if (value !== null && value !== undefined) {
        if (Array.isArray(value) && value.length > 0) {
          filledCount++;
        } else if (!Array.isArray(value) && value !== '') {
          filledCount++;
        }
      }
    }
  });

  return totalRequired > 0 ? Math.round((filledCount / totalRequired) * 100) : 0;
}
