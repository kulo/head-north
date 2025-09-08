class FakeDataGenerator {
  constructor(omegaConfig) {
    this.omegaConfig = omegaConfig;
    this.assignees = [
      { displayName: 'All Assignees', accountId: 'all' },
      { displayName: 'John Doe', accountId: 'john.doe' },
      { displayName: 'Jane Smith', accountId: 'jane.smith' },
      { displayName: 'Bob Johnson', accountId: 'bob.johnson' },
      { displayName: 'Alice Brown', accountId: 'alice.brown' },
      { displayName: 'Charlie Wilson', accountId: 'charlie.wilson' },
      { displayName: 'David Lee', accountId: 'david.lee' },
      { displayName: 'Emma Davis', accountId: 'emma.davis' }
    ];

    this.areas = [
      { id: 'frontend', name: 'Frontend' },
      { id: 'backend', name: 'Backend' },
      { id: 'devops', name: 'DevOps' },
      { id: 'data', name: 'Data Engineering' },
      { id: 'mobile', name: 'Mobile' },
      { id: 'ai', name: 'AI/ML' }
    ];

    this.initiatives = [
      { id: 1, name: 'AI Platform Enhancement' },
      { id: 2, name: 'Customer Data Platform' },
      { id: 3, name: 'Mobile Experience' },
      { id: 4, name: 'Performance Optimization' },
      { id: 5, name: 'Security Hardening' }
    ];

        this.projects = {
          'PROJ1': {
            summary: 'AI Platform Enhancement',
            labels: ['ai', 'platform', 'frontend', 'initiative:ai-platform', 'area:ai'],
            externalRoadmap: 'AI Initiative',
            externalRoadmapDescription: 'Enhance AI capabilities',
            area: 'ai',
            initiativeId: 1
          },
          'PROJ2': {
            summary: 'Customer Data Platform',
            labels: ['data', 'customer', 'backend', 'initiative:data-platform', 'area:data'],
            externalRoadmap: 'Data Initiative',
            externalRoadmapDescription: 'Improve customer data handling',
            area: 'data',
            initiativeId: 2
          },
          'PROJ3': {
            summary: 'Mobile Experience',
            labels: ['mobile', 'ux', 'frontend', 'initiative:mobile-experience', 'area:mobile'],
            externalRoadmap: 'Mobile Initiative',
            externalRoadmapDescription: 'Enhance mobile user experience',
            area: 'mobile',
            initiativeId: 3
          },
          'PROJ4': {
            summary: 'API Performance',
            labels: ['api', 'performance', 'backend', 'initiative:performance', 'area:backend'],
            externalRoadmap: 'Performance Initiative',
            externalRoadmapDescription: 'Optimize API performance',
            area: 'backend',
            initiativeId: 4
          },
          'PROJ5': {
            summary: 'Security Audit',
            labels: ['security', 'audit', 'devops', 'initiative:security', 'area:devops'],
            externalRoadmap: 'Security Initiative',
            externalRoadmapDescription: 'Comprehensive security audit',
            area: 'devops',
            initiativeId: 5
          },
          'PROJ6': {
            summary: 'Frontend Dashboard',
            labels: ['frontend', 'dashboard', 'ui', 'initiative:ai-platform', 'area:frontend'],
            externalRoadmap: 'AI Initiative',
            externalRoadmapDescription: 'AI-powered dashboard',
            area: 'frontend',
            initiativeId: 1
          },
          'PROJ7': {
            summary: 'Data Analytics Engine',
            labels: ['analytics', 'data', 'backend', 'initiative:data-platform', 'area:data'],
            externalRoadmap: 'Data Initiative',
            externalRoadmapDescription: 'Advanced analytics engine',
            area: 'data',
            initiativeId: 2
          },
          'PROJ8': {
            summary: 'Mobile SDK',
            labels: ['mobile', 'sdk', 'backend', 'initiative:mobile-experience', 'area:mobile'],
            externalRoadmap: 'Mobile Initiative',
            externalRoadmapDescription: 'Mobile SDK for developers',
            area: 'mobile',
            initiativeId: 3
          }
        };

    this.sprints = [
      { id: 1, name: 'Sprint 1 - Q1 2024', state: 'active', startDate: '2024-01-01', endDate: '2024-01-15' },
      { id: 2, name: 'Sprint 2 - Q1 2024', state: 'closed', startDate: '2024-01-16', endDate: '2024-01-30' },
      { id: 3, name: 'Sprint 3 - Q1 2024', state: 'future', startDate: '2024-01-31', endDate: '2024-02-14' },
      { id: 4, name: 'Sprint 4 - Q1 2024', state: 'future', startDate: '2024-02-15', endDate: '2024-02-29' }
    ];
  }

  async getSprintById(sprintId) {
    const sprint = sprintId 
      ? this.sprints.find(s => s.id === parseInt(sprintId)) || this.sprints[0]
      : this.sprints[0];
    
    const sprintResponse = {
      name: sprint.name,
      end: sprint.endDate,
      start: sprint.startDate,
      delivery: sprint.startDate,
      id: sprint.id,
      state: sprint.state
    };

    const sprintsResponse = this.sprints.map(s => ({
      name: s.name,
      end: s.endDate,
      start: s.startDate,
      delivery: s.startDate,
      id: s.id,
      state: s.state
    }));

    return { sprint: sprintResponse, sprints: sprintsResponse };
  }

  async getIssuesForSprint(sprintId, extraFields = []) {
    const issues = [];
    const projectKeys = Object.keys(this.projects);
    const statuses = ['To Do', 'In Progress', 'Done', 'Review'];
    const issueTypes = ['Story', 'Task', 'Bug', 'Epic', 'Release Item'];

    for (let i = 0; i < 30; i++) {
      const projectKey = projectKeys[Math.floor(Math.random() * projectKeys.length)];
      const project = this.projects[projectKey];
      const assignee = this.assignees[Math.floor(Math.random() * (this.assignees.length - 1)) + 1]; // Skip 'All Assignees'
      const issueType = issueTypes[Math.floor(Math.random() * issueTypes.length)];

      issues.push({
        id: `issue-${i}`,
        key: `ISSUE-${i}`,
        fields: {
          summary: `${project.summary} - ${issueType} ${i + 1}`,
          status: { name: statuses[Math.floor(Math.random() * statuses.length)] },
          assignee: assignee,
          effort: Math.floor(Math.random() * 8) + 1,
          externalRoadmap: project.externalRoadmap,
          labels: project.labels,
          parent: { key: projectKey },
          issuetype: { name: issueType },
          area: project.area,
          initiativeId: project.initiativeId,
          url: `https://example.com/browse/ISSUE-${i}`,
          // Add additional fields for release items
          teams: [assignee.accountId],
          areaIds: [project.area]
        }
      });
    }
    return issues;
  }

  async getProjects() {
    return this.projects;
  }

  async getFutureIssuesByRoadmapItems() {
    const roadmapItems = {};
    
    // Create multiple release items for each project with different assignees and areas
    Object.keys(this.projects).forEach(projectKey => {
      const project = this.projects[projectKey];
      const releaseItems = [];
      
      // Create 3-5 release items per project
      const numItems = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < numItems; i++) {
        const assignee = this.assignees[Math.floor(Math.random() * (this.assignees.length - 1)) + 1]; // Skip 'All Assignees'
        const statuses = ['To Do', 'In Progress', 'Done', 'Review'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const stages = ['s0', 's1', 's2', 's3', 's3+'];
        const stage = stages[Math.floor(Math.random() * stages.length)];
        
        releaseItems.push({
          id: `${projectKey}-RELEASE-${i + 1}`,
          summary: `${project.summary} - Release Item ${i + 1}`,
          parent: projectKey,
          status: status,
          closedSprints: [],
          sprint: null,
          // Add properties that the roadmap item parser expects
          ticketId: `${projectKey}-RELEASE-${i + 1}`,
          stage: stage,
          isExternal: Math.random() > 0.5,
          validations: [],
          areaIds: [project.area],
          teams: [assignee.accountId],
          effort: Math.floor(Math.random() * 8) + 1,
          assignee: assignee,
          // Add properties needed for the release item parser
          projectId: projectKey,
          isScheduledForFuture: Math.random() > 0.5,
          isInBacklog: Math.random() > 0.5,
          labels: project.labels,
          // Add URL for the roadmap item
          url: `https://example.com/browse/${projectKey}-RELEASE-${i + 1}`
        });
      }
      
      roadmapItems[projectKey] = releaseItems;
    });
    
    return roadmapItems;
  }

  _getRandomStage() {
    const stages = ['development', 'testing', 'staging', 'production', 'review', 'planning'];
    return stages[Math.floor(Math.random() * stages.length)];
  }

  getAssignees() {
    return this.assignees;
  }

  getAreas() {
    return this.areas;
  }

  getInitiatives() {
    return this.initiatives;
  }
}

export default FakeDataGenerator;
