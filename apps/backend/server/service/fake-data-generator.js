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

    // Get areas and initiatives from omega config
    const areasConfig = this.omegaConfig.getAreas();
    this.areas = Object.entries(areasConfig).map(([id, name]) => ({ 
      id, 
      name,
      teams: this._generateTeamsForArea(id, name)
    }));

    const initiativesConfig = this.omegaConfig.getInitiatives();
    this.initiatives = Object.entries(initiativesConfig).map(([id, name]) => ({ 
      id, 
      name 
    }));

    // Generate roadmap items dynamically based on areas and initiatives from config
    this.roadmapItems = this._generateRoadmapItems();

    // Generate sprints following Shape-up methodology (2-month cycles)
    this.sprints = this._generateSprints();
  }

  async getAllSprints() {
    const sprintsResponse = this.sprints.map(s => ({
      name: s.name,
      end: s.endDate,
      start: s.startDate,
      delivery: s.startDate,
      id: s.id,
      state: s.state
    }));

    return {
      sprints: sprintsResponse
    };
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
    const roadmapItemKeys = Object.keys(this.roadmapItems);
    const statuses = ['To Do', 'In Progress', 'Done', 'Review'];
    const issueTypes = ['Story', 'Task', 'Bug', 'Epic', 'Release Item'];
    const stages = ['s0', 's1', 's2', 's3', 's3+']; // Stage progression order

    // Get the current sprint data
    const currentSprint = this.sprints.find(sprint => sprint.id === parseInt(sprintId));

    // Generate issues for each roadmap item, but only include release items for this specific sprint
    roadmapItemKeys.forEach((roadmapItemKey, roadmapItemIndex) => {
      const roadmapItem = this.roadmapItems[roadmapItemKey];
      
      // Get the release items for this roadmap item from the grouped data
      const releaseItemsForRoadmapItem = this._getReleaseItemsForRoadmapItem(roadmapItemKey);
      
      // Filter release items that belong to this sprint
      const releaseItemsInThisSprint = releaseItemsForRoadmapItem.filter(item => 
        item.sprint && item.sprint.id === parseInt(sprintId)
      );
      
      // Generate issues for release items in this sprint (at most 1 per roadmap item)
      releaseItemsInThisSprint.forEach((releaseItem, i) => {
        const assignee = this.assignees[Math.floor(Math.random() * (this.assignees.length - 1)) + 1]; // Skip 'All Assignees'
        const issueType = 'Release Item';
        const issueIndex = roadmapItemIndex * 100 + parseInt(sprintId) * 10 + i; // Ensure unique IDs

        issues.push({
          id: `issue-${issueIndex}`,
          key: `ISSUE-${issueIndex}`,
          fields: {
            summary: releaseItem.summary, // Use the release item's summary with stage
            status: { 
              id: this._getStatusId(releaseItem.status),
              name: releaseItem.status 
            },
            assignee: assignee,
            effort: Math.floor(Math.random() * 8) + 1,
            externalRoadmap: 'Yes', // This needs to be 'Yes' for isExternal to return true
            labels: roadmapItem.labels, // Use the roadmap item's labels which now include proper prefixes
            parent: { key: roadmapItemKey },
            issuetype: { name: issueType },
            area: roadmapItem.area,
            initiativeId: roadmapItem.initiativeId,
            url: `https://example.com/browse/ISSUE-${issueIndex}`,
            // Add sprint information for proper status resolution
            sprint: currentSprint ? {
              id: currentSprint.id,
              name: currentSprint.name,
              startDate: currentSprint.startDate,
              endDate: currentSprint.endDate
            } : null,
            // Add additional fields for release items
            teams: [assignee.accountId],
            areaIds: [roadmapItem.area]
          }
        });
      });
    });
    
    return issues;
  }

  async getRoadmapItems() {
    return this.roadmapItems;
  }

  async getReleaseItemsGroupedByRoadmapItem() {
    const releaseItemsByRoadmapItem = {};
    
    // Create 1-3 release items for each roadmap item, distributed across different cycles
    Object.keys(this.roadmapItems).forEach(roadmapItemKey => {
      releaseItemsByRoadmapItem[roadmapItemKey] = this._getReleaseItemsForRoadmapItem(roadmapItemKey);
    });
    
    return releaseItemsByRoadmapItem;
  }

  _getRandomStage() {
    const stages = ['development', 'testing', 'staging', 'production', 'review', 'planning'];
    return stages[Math.floor(Math.random() * stages.length)];
  }

  /**
   * Get release items for a specific roadmap item
   * @param {string} roadmapItemKey - The roadmap item key
   * @returns {Array} Array of release items for the roadmap item
   * @private
   */
  _getReleaseItemsForRoadmapItem(roadmapItemKey) {
    const stages = ['s0', 's1', 's2', 's3', 's3+']; // Stage progression order
    const sprints = this.sprints || [];
    const roadmapItem = this.roadmapItems[roadmapItemKey];
    const releaseItems = [];
    
    if (!roadmapItem) return releaseItems;
    
    // Generate 1-3 release items per roadmap item
    const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items
    
    // Select random stages in progression order (s0 → s1 → s2 → s3 → s3+)
    const selectedStages = stages.slice(0, numItems);
    
    for (let i = 0; i < numItems; i++) {
      const assignee = this.assignees[Math.floor(Math.random() * (this.assignees.length - 1)) + 1]; // Skip 'All Assignees'
      const statuses = ['To Do', 'In Progress', 'Done', 'Review'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const releaseStage = selectedStages[i];
      
      // Assign to a random sprint (cycle) - each roadmap item gets different cycles
      const sprint = sprints.length > 0 ? sprints[Math.floor(Math.random() * sprints.length)] : null;
      
      releaseItems.push({
        id: `${roadmapItemKey}-RELEASE-${i + 1}`,
        summary: `${roadmapItem.summary} - Release Item ${i + 1} - (${releaseStage})`, // Encode release stage in summary
        closedSprints: [],
        parent: roadmapItemKey,
        status: status,
        sprint: sprint ? {
          id: sprint.id,
          name: sprint.name,
          startDate: sprint.startDate,
          endDate: sprint.endDate
        } : null
      });
    }
    
    return releaseItems;
  }

  /**
   * Get status ID for a given status name
   * @param {string} statusName - The status name
   * @returns {string} The status ID
   * @private
   */
  _getStatusId(statusName) {
    const statusMap = {
      'To Do': '10001',
      'In Progress': '10002', 
      'Done': '10003',
      'Review': '10004'
    };
    return statusMap[statusName] || '10001';
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

  /**
   * Generate roadmap items dynamically based on areas and initiatives from config
   * @private
   */
  _generateRoadmapItems() {
    const roadmapItems = {};
    
    // Get teams and themes from omega config
    const teams = this.omegaConfig.getTeams();
    const themes = this.omegaConfig.getThemes();
    const teamKeys = Object.keys(teams);
    const themeKeys = Object.keys(themes);
    
    let roadmapItemCounter = 1;
    
    // Generate roadmap items for each initiative (1-5 items per initiative)
    this.initiatives.forEach((initiative, initiativeIndex) => {
      // Generate between 1 and 5 roadmap items per initiative
      const numRoadmapItems = Math.floor(Math.random() * 5) + 1; // 1-5 items
      
      for (let i = 0; i < numRoadmapItems; i++) {
        const roadmapItemKey = `ROAD-${roadmapItemCounter}`;
        const summary = `${initiative.name} - ${roadmapItemCounter}`;
        
        // Pick a random area for this roadmap item
        const area = this.areas[Math.floor(Math.random() * this.areas.length)];
        
        // Pick a team that matches the area
        const areaTeams = teamKeys.filter(teamKey => teamKey.startsWith(area.id));
        const selectedTeam = areaTeams.length > 0 ? areaTeams[Math.floor(Math.random() * areaTeams.length)] : teamKeys[0];
        
        // Pick a theme that matches the initiative
        const selectedTheme = themeKeys[Math.floor(Math.random() * themeKeys.length)];
        
        roadmapItems[roadmapItemKey] = {
          summary,
          labels: [
            area.id, 
            `initiative:${initiative.id}`,
            `area:${area.id}`,
            `team:${selectedTeam}`,
            `theme:${selectedTheme}`
          ],
          externalRoadmap: 'Yes',
          externalRoadmapDescription: `${initiative.name} - roadmap item ${roadmapItemCounter}`,
          area: area.id,
          initiativeId: initiative.id
        };
        
        roadmapItemCounter++;
      }
    });
    
    // Add some roadmap items without initiatives to test UI behavior
    for (let i = 0; i < 3; i++) {
      const roadmapItemKey = `ROAD-${roadmapItemCounter}`;
      const area = this.areas[Math.floor(Math.random() * this.areas.length)];
      const summary = `Unassigned - ${roadmapItemCounter}`;
      
      // Pick a team that matches the area
      const areaTeams = teamKeys.filter(teamKey => teamKey.startsWith(area.id));
      const selectedTeam = areaTeams.length > 0 ? areaTeams[Math.floor(Math.random() * areaTeams.length)] : teamKeys[0];
      
      // Pick a random theme
      const selectedTheme = themeKeys[Math.floor(Math.random() * themeKeys.length)];
      
      roadmapItems[roadmapItemKey] = {
        summary,
        labels: [
          area.id, 
          `area:${area.id}`,
          `team:${selectedTeam}`,
          `theme:${selectedTheme}`
        ],
        externalRoadmap: 'Yes',
        externalRoadmapDescription: `Unassigned roadmap item ${roadmapItemCounter}`,
        area: area.id,
        initiativeId: null // No initiative assigned
      };
      
      roadmapItemCounter++;
    }
    
    return roadmapItems;
  }

  /**
   * Generate sprints following Shape-up methodology (2-month cycles)
   * Creates: 1 past sprint, 1 active sprint, 2 future sprints
   * @private
   */
  _generateSprints() {
    const now = new Date();
    const sprints = [];
    
    // Get current month and year
    const currentMonth = now.getMonth(); // 0-based (0 = January)
    const currentYear = now.getFullYear();
    
    // Calculate the current 2-month cycle
    // Shape-up cycles: Jan-Feb, Mar-Apr, May-Jun, Jul-Aug, Sep-Oct, Nov-Dec
    const cycleStartMonth = Math.floor(currentMonth / 2) * 2; // 0, 2, 4, 6, 8, 10
    
    // Generate 4 sprints: 1 past, 1 active, 2 future
    for (let i = -1; i <= 2; i++) {
      // Calculate the sprint's start month and year
      const sprintStartMonth = (cycleStartMonth + i * 2) % 12;
      const sprintYear = currentYear + Math.floor((cycleStartMonth + i * 2) / 12);
      
      // Calculate the sprint's end month and year (second month of the cycle)
      const sprintEndMonth = (sprintStartMonth + 1) % 12;
      const sprintEndYear = sprintStartMonth === 11 ? sprintYear + 1 : sprintYear;
      
      // Create start date (1st of first month)
      const startDate = new Date(sprintYear, sprintStartMonth, 1);
      
      // Create end date (last day of second month)
      const endDate = new Date(sprintEndYear, sprintEndMonth + 1, 0); // Last day of the month
      
      // Determine sprint state based on current date
      let state;
      const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (currentDate < startDate) {
        state = 'future';
      } else if (currentDate >= startDate && currentDate <= endDate) {
        state = 'active';
      } else {
        state = 'closed';
      }
      
      // Create sprint name
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      const startMonthName = monthNames[sprintStartMonth];
      const endMonthName = monthNames[sprintEndMonth];
      const sprintName = `${startMonthName}-${endMonthName} ${sprintYear}`;
      
      sprints.push({
        id: i + 2, // Start from 1, so: 1, 2, 3, 4
        name: sprintName,
        state: state,
        startDate: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
        endDate: endDate.toISOString().split('T')[0] // YYYY-MM-DD format
      });
    }
    
    return sprints;
  }

  /**
   * Generate teams for a specific area
   * @param {string} areaId - The area ID
   * @param {string} areaName - The area name
   * @returns {Array} Array of teams for the area
   * @private
   */
  _generateTeamsForArea(areaId, areaName) {
    const teamTemplates = {
      platform: [
        { id: 'platform-frontend', name: 'Frontend Team', description: 'Frontend development team' },
        { id: 'platform-backend', name: 'Backend Team', description: 'Backend services team' },
        { id: 'platform-devops', name: 'DevOps Team', description: 'Infrastructure and deployment team' }
      ],
      resilience: [
        { id: 'resilience-security', name: 'Security Team', description: 'Security and compliance team' },
        { id: 'resilience-monitoring', name: 'Monitoring Team', description: 'System monitoring and alerting team' }
      ],
      sustainability: [
        { id: 'sustainability-green', name: 'Green Tech Team', description: 'Sustainable technology initiatives' },
        { id: 'sustainability-metrics', name: 'Metrics Team', description: 'Environmental impact measurement team' }
      ]
    };

    return teamTemplates[areaId] || [
      { id: `${areaId}-team1`, name: `${areaName} Team 1`, description: `Primary team for ${areaName}` },
      { id: `${areaId}-team2`, name: `${areaName} Team 2`, description: `Secondary team for ${areaName}` }
    ];
  }

  /**
   * Get enhanced areas with teams
   * @returns {object} Areas object with teams
   */
  getEnhancedAreas() {
    const enhancedAreas = {};
    this.areas.forEach(area => {
      enhancedAreas[area.id] = {
        name: area.name,
        teams: area.teams
      };
    });
    return enhancedAreas;
  }
}

export default FakeDataGenerator;
