// src/modules/data/sampleArticles.js

export const SAMPLE_ARTICLES = [
  {
    id: 1,
    title: 'Configure SSO for Service Cloud',
    content: `# Configure SSO for Service Cloud

## Introduction to SSO Configuration

Single Sign-On (SSO) is an authentication process that allows users to access multiple applications with one set of login credentials. In this comprehensive guide, we will walk you through the various aspects of configuring SSO for your Service Cloud implementation. Before we begin, it's important to understand the underlying architecture and security implications of SSO deployment.

This article provides detailed information about the setup process, configuration options, and best practices for implementing SSO in a Service Cloud environment.

## Configuration Steps

The configuration process involves several detailed steps that must be completed in the correct order to ensure proper functionality.

1. In Setup, search for Help Agent and open Help Agent Settings panel.
2. Under Knowledge Integration section, toggle Enable Knowledge Retrieval to On position.
3. Select the data categories the agent should search from the available list.
4. Click Save button at bottom.
5. Navigate to additional settings if needed.
6. Configure authentication parameters.
7. Set up user mappings.
8. Test the configuration.

## Troubleshooting Steps

If you encounter issues during configuration, there are numerous troubleshooting techniques you can employ. First, verify all prerequisites are met. Then, check system logs for any error messages. Review user permissions carefully. Ensure network connectivity is stable. Validate certificate configurations. Test with a single user before rolling out. Monitor performance metrics. Review security settings. Check firewall rules. Validate DNS settings. Ensure time synchronization. Review audit logs. Test failover scenarios. (312 words in this section)

## Overview

This section provides general information about SSO concepts.`,
    metadata: {
      products: ['Service Cloud'],
      featureArea: [],
      primaryAudience: null,
      contentType: null,
      releaseVersions: [],
      useCase: [],
      complexity: null,
      confidenceLevel: 'In Review'
    },
    expectedScore: 45,
    expectedViolations: 4
  },
  {
    id: 2,
    title: 'Create a Flow in Setup',
    content: `# Create a Flow in Setup

## Open Flow Builder

1. In Setup, search for Flows and click Flow Builder.
2. Click New Flow.
3. Select the flow type: Screen Flow, Record-Triggered Flow, or Scheduled Flow.

**Expected result:** Flow Builder canvas opens with a Start element.

**Before you begin:**
- You need the Manage Flow permission
- Understand basic flow concepts

## Add Flow Elements

1. Drag elements from the left panel onto the canvas.
2. Connect elements by clicking the connector node and dragging to the next element.
3. Configure each element by clicking it and filling in the properties panel.

**Result:** Your flow structure is visible on the canvas with all connections.

## Activate the Flow

1. Click Save and name your flow.
2. Click Activate.
3. Confirm activation in the dialog.

**Expected result:** Flow status changes to Active. Users can now trigger this flow.`,
    metadata: {
      products: ['Platform'],
      featureArea: ['Flows'],
      primaryAudience: 'Admin',
      contentType: 'Procedure',
      releaseVersions: ['Spring26'],
      useCase: ['Setup', 'How-to'],
      complexity: 'Beginner',
      confidenceLevel: 'Verified'
    },
    expectedScore: 85,
    expectedViolations: 0
  },
  {
    id: 3,
    title: 'Troubleshoot Case Assignment Rules',
    content: `# Troubleshoot Case Assignment Rules

## Common Issues

Case assignment rules may fail for several reasons. This section covers the most common problems.

### Rule Not Triggering

Check if the rule is active. Verify criteria match the case fields. Ensure rule order is correct.

**To verify:**
1. Go to Setup > Case Assignment Rules.
2. Check Active checkbox next to your rule.
3. Review rule criteria carefully.

### Wrong User Assigned

1. Review rule entry order - rules execute top to bottom.
2. Check user's active status.
3. Verify queue membership.

**Expected result:** Cases assign to the correct user based on criteria.

## Details

Assignment rules follow a specific evaluation order and the first matching rule wins.`,
    metadata: {
      products: ['Service Cloud'],
      featureArea: ['Case Management'],
      primaryAudience: 'Admin',
      contentType: 'Troubleshooting',
      releaseVersions: ['Spring26'],
      useCase: ['Troubleshooting'],
      complexity: 'Intermediate',
      confidenceLevel: 'Verified'
    },
    expectedScore: 62,
    expectedViolations: 2
  },
  {
    id: 4,
    title: 'Knowledge Article Visibility Settings',
    content: `# Knowledge Article Visibility Settings

## Understanding Article Visibility

Knowledge article visibility in Salesforce is a complex topic that requires careful consideration of your organization's needs and security requirements. Before diving into the configuration details, let's explore the conceptual framework that underlies article visibility controls.

Articles can be visible to different audiences based on data categories, channels, and user permissions.

**Data categories** organize articles into hierarchical groups. Each category can have visibility rules.

**Channels** determine where articles appear: internal app, customer portal, partner portal, or public knowledge base.

**User permissions** control who can view, edit, or publish articles based on their role and profile.

## Configuration

1. Navigate to Setup > Data Categories.
2. Define your category structure.
3. Set category visibility for each user group.
4. Assign categories to articles when publishing.

**Result:** Articles appear only to authorized users in the appropriate channels.`,
    metadata: {
      products: ['Service Cloud', 'Knowledge'],
      featureArea: ['Knowledge Management'],
      primaryAudience: 'Admin',
      contentType: 'Concept',
      releaseVersions: ['Spring26'],
      useCase: ['Conceptual', 'Configuration'],
      complexity: 'Intermediate',
      confidenceLevel: 'Verified'
    },
    expectedScore: 73,
    expectedViolations: 1
  }
];

export const FIX_QUEUE_DATA = [
  {
    id: 1,
    title: 'Configure SSO for Service Cloud',
    product: 'Service Cloud',
    ragScore: 45,
    metadataPercent: 37,
    priority: 92,
    lastUpdated: '2 days ago',
    status: 'high'
  },
  {
    id: 2,
    title: 'Case Assignment Rules',
    product: 'Service Cloud',
    ragScore: 52,
    metadataPercent: 50,
    priority: 78,
    lastUpdated: '5 days ago',
    status: 'high'
  },
  {
    id: 3,
    title: 'Email-to-Case Settings',
    product: 'Service Cloud',
    ragScore: 62,
    metadataPercent: 45,
    priority: 68,
    lastUpdated: '1 week ago',
    status: 'medium'
  },
  {
    id: 4,
    title: 'Create a Flow in Setup',
    product: 'Platform',
    ragScore: 85,
    metadataPercent: 100,
    priority: 15,
    lastUpdated: '3 days ago',
    status: 'low'
  },
  {
    id: 5,
    title: 'Apex Trigger Best Practices',
    product: 'Platform',
    ragScore: 71,
    metadataPercent: 88,
    priority: 45,
    lastUpdated: '1 week ago',
    status: 'medium'
  },
  {
    id: 6,
    title: 'Troubleshoot Case Assignment',
    product: 'Service Cloud',
    ragScore: 62,
    metadataPercent: 75,
    priority: 38,
    lastUpdated: '4 days ago',
    status: 'low'
  },
  {
    id: 7,
    title: 'Knowledge Visibility Settings',
    product: 'Knowledge',
    ragScore: 73,
    metadataPercent: 88,
    priority: 32,
    lastUpdated: '2 days ago',
    status: 'low'
  },
  {
    id: 8,
    title: 'API Rate Limits',
    product: 'Platform',
    ragScore: 82,
    metadataPercent: 75,
    priority: 28,
    lastUpdated: '2 weeks ago',
    status: 'low'
  },
  {
    id: 9,
    title: 'Permission Sets Overview',
    product: 'Platform',
    ragScore: 58,
    metadataPercent: 62,
    priority: 65,
    lastUpdated: '6 days ago',
    status: 'medium'
  },
  {
    id: 10,
    title: 'Reports and Dashboards',
    product: 'Platform',
    ragScore: 65,
    metadataPercent: 50,
    priority: 60,
    lastUpdated: '1 week ago',
    status: 'medium'
  }
];
