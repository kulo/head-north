// Shared types and interfaces for Omega applications
// This will be converted to TypeScript in the next phase

module.exports = {
  // Common API response types
  ApiResponse: {
    success: true,
    data: null,
    error: null,
    message: null
  },
  
  // JIRA related types
  JiraIssue: {
    id: null,
    key: null,
    summary: null,
    status: null,
    assignee: null,
    labels: [],
    components: [],
    fixVersions: [],
    customFields: {}
  },
  
  // Release related types
  Release: {
    id: null,
    name: null,
    status: null,
    startDate: null,
    endDate: null,
    initiatives: [],
    items: []
  },
  
  // Area related types
  Area: {
    id: null,
    name: null,
    description: null,
    initiatives: [],
    progress: 0
  }
};
