'use strict';

import { logger } from '@omega-one/shared-utils';

// Mock JIRA data for development when real JIRA API is not available
const mockJiraData = {
  projects: {
    'CAT-123': {
      summary: 'Customer Analytics Tool',
      labels: ['analytics', 'customer'],
      externalRoadmap: 'CAT Roadmap',
      externalRoadmapDescription: 'Customer analytics and insights platform'
    },
    'CAST-456': {
      summary: 'Customer Analytics Service Tool',
      labels: ['analytics', 'service'],
      externalRoadmap: 'CAST Roadmap',
      externalRoadmapDescription: 'Customer analytics service platform'
    }
  },
  issues: [
    {
      key: 'CAT-123-1',
      fields: {
        summary: 'Implement user dashboard',
        effort: 5,
        status: { name: 'In Progress' },
        labels: ['frontend', 'dashboard'],
        assignee: {
          accountId: 'user1',
          displayName: 'John Doe'
        },
        reporter: {
          accountId: 'user2',
          displayName: 'Jane Smith'
        },
        sprint: { id: 1, name: 'Sprint 1' },
        closedSprints: []
      }
    },
    {
      key: 'CAT-123-2',
      fields: {
        summary: 'Add data visualization',
        effort: 8,
        status: { name: 'Done' },
        labels: ['frontend', 'visualization'],
        assignee: {
          accountId: 'user3',
          displayName: 'Bob Johnson'
        },
        reporter: {
          accountId: 'user2',
          displayName: 'Jane Smith'
        },
        sprint: { id: 1, name: 'Sprint 1' },
        closedSprints: []
      }
    },
    {
      key: 'CAST-456-1',
      fields: {
        summary: 'API integration',
        effort: 13,
        status: { name: 'To Do' },
        labels: ['backend', 'api'],
        assignee: {
          accountId: 'user4',
          displayName: 'Alice Brown'
        },
        reporter: {
          accountId: 'user5',
          displayName: 'Charlie Wilson'
        },
        sprint: { id: 1, name: 'Sprint 1' },
        closedSprints: []
      }
    }
  ],
  sprint: {
    id: 1,
    name: 'Sprint 1',
    start: '2025-09-01',
    end: '2025-09-15',
    delivery: '2025-09-15',
    state: 'active'
  },
  sprints: [
    {
      id: 1,
      name: 'Sprint 1',
      start: '2025-09-01',
      end: '2025-09-15',
      delivery: '2025-09-15',
      state: 'active'
    },
    {
      id: 2,
      name: 'Sprint 2',
      start: '2025-09-16',
      end: '2025-09-30',
      delivery: '2025-09-30',
      state: 'future'
    }
  ],
  assignees: [
    { accountId: 'user1', displayName: 'John Doe' },
    { accountId: 'user2', displayName: 'Jane Smith' },
    { accountId: 'user3', displayName: 'Bob Johnson' },
    { accountId: 'user4', displayName: 'Alice Brown' },
    { accountId: 'user5', displayName: 'Charlie Wilson' }
  ]
};

module.exports = async (sprintId) => {
  logger.service.info('Using mock JIRA data for development');
  return mockJiraData;
};
