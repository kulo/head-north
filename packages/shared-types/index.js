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
  },

  // NEW: Cycle/Sprint Types (Cycles replace Sprints in non-Jira code)
  Cycle: {
    id: null,           // Unique identifier
    name: null,         // Display name (e.g., "January-February 2024")
    start: null,        // Start date (ISO string)
    end: null,          // End date (ISO string)
    delivery: null,     // Delivery date (ISO string)
    state: null,        // 'active' | 'closed' | 'future'
    progress: 0,        // Progress percentage (0-100)
    isActive: false,    // Whether this is the currently active cycle
    description: null   // Optional description
  },
  
  // Sprint is an alias for Cycle (for backward compatibility and Jira domain)
  Sprint: {
    // Same structure as Cycle - used only in Jira domain
    id: null,
    name: null,
    start: null,
    end: null,
    delivery: null,
    state: null,
    progress: 0,
    isActive: false,
    description: null
  },
  
  // Cycle Collection
  CycleCollection: {
    active: null,       // Currently active cycle
    ordered: [],        // Array of cycles in chronological order
    byState: {          // Grouped by state
      active: [],
      closed: [],
      future: []
    }
  },
  
  // Unified Data System Types
  Initiative: {
    initiativeId: null,
    initiative: null,
    roadmapItems: []
  },
  
  RoadmapItem: {
    id: null,
    name: null,
    area: null,
    theme: null,
    releaseItems: []
  },
  
  ReleaseItem: {
    id: null,
    summary: null,
    stage: null,
    assignee: null,
    areaIds: [],
    projectId: null,
    ticketId: null,
    status: null,
    teams: []
  },
  
  // Enhanced Unified Data Structure
  UnifiedData: {
    metadata: {
      type: 'roadmap' | 'cycle-overview',
      cycles: null,     // CycleCollection
      stages: [],
      areas: [],
      assignees: [],
      initiatives: []
    },
    data: {
      initiatives: []
    }
  },
  
  // API Response Types
  CycleApiResponse: {
    success: true,
    data: null,         // Cycle or CycleCollection
    error: null,
    message: null
  },
  
  UnifiedApiResponse: {
    success: true,
    data: null,         // UnifiedData
    error: null,
    message: null
  }
};
