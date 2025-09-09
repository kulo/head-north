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
    this.areas = Object.entries(areasConfig).map(([id, name]) => ({ id, name }));

    const initiativesConfig = this.omegaConfig.getInitiatives();
    this.initiatives = Object.entries(initiativesConfig).map(([id, name], index) => ({ 
      id: index + 1, 
      name 
    }));

    // Generate projects dynamically based on areas and initiatives from config
    this.projects = this._generateRoadmapItems();

    // Generate sprints following Shape-up methodology (2-month cycles)
    this.sprints = this._generateSprints();
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
    const roadmapItemKeys = Object.keys(this.projects);
    const statuses = ['To Do', 'In Progress', 'Done', 'Review'];
    const issueTypes = ['Story', 'Task', 'Bug', 'Epic', 'Release Item'];
    const externalStages = ['S1', 'S2', 'S3', 'S3+']; // Valid external release stages

    // Generate issues for each roadmap item to ensure we have release items
    roadmapItemKeys.forEach((roadmapItemKey, roadmapItemIndex) => {
      const roadmapItem = this.projects[roadmapItemKey];
      
      // Generate 2-4 issues per roadmap item
      const numIssues = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < numIssues; i++) {
        const assignee = this.assignees[Math.floor(Math.random() * (this.assignees.length - 1)) + 1]; // Skip 'All Assignees'
        const issueType = issueTypes[Math.floor(Math.random() * issueTypes.length)];
        const issueIndex = roadmapItemIndex * 10 + i; // Ensure unique IDs
        const releaseStage = externalStages[Math.floor(Math.random() * externalStages.length)];

        issues.push({
          id: `issue-${issueIndex}`,
          key: `ISSUE-${issueIndex}`,
          fields: {
            summary: `${roadmapItem.summary} - ${issueType} ${i + 1} - (${releaseStage})`, // Encode release stage in summary
            status: { name: statuses[Math.floor(Math.random() * statuses.length)] },
            assignee: assignee,
            effort: Math.floor(Math.random() * 8) + 1,
            externalRoadmap: 'Yes', // This needs to be 'Yes' for isExternal to return true
            labels: roadmapItem.labels, // Use the roadmap item's labels which now include proper prefixes
            parent: { key: roadmapItemKey },
            issuetype: { name: issueType },
            area: roadmapItem.area,
            initiativeId: roadmapItem.initiativeId,
            url: `https://example.com/browse/ISSUE-${issueIndex}`,
            // Add additional fields for release items
            teams: [assignee.accountId],
            areaIds: [roadmapItem.area]
          }
        });
      }
    });
    
    return issues;
  }

  async getRoadmapItems() {
    return this.projects;
  }

  async getReleaseItemsGroupedByRoadmapItem() {
    const releaseItemsByRoadmapItem = {};
    const externalStages = ['S1', 'S2', 'S3', 'S3+']; // Valid external release stages
    
    // Create multiple release items for each roadmap item with different assignees and areas
    Object.keys(this.projects).forEach(roadmapItemKey => {
      const roadmapItem = this.projects[roadmapItemKey];
      const releaseItems = [];
      
      // Create 3-5 release items per roadmap item
      const numItems = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < numItems; i++) {
        const assignee = this.assignees[Math.floor(Math.random() * (this.assignees.length - 1)) + 1]; // Skip 'All Assignees'
        const statuses = ['To Do', 'In Progress', 'Done', 'Review'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const releaseStage = externalStages[Math.floor(Math.random() * externalStages.length)];
        
        // Create simplified structure (like real Jira API does)
        releaseItems.push({
          id: `${roadmapItemKey}-RELEASE-${i + 1}`,
          summary: `${roadmapItem.summary} - Release Item ${i + 1} - (${releaseStage})`, // Encode release stage in summary
          closedSprints: [],
          parent: roadmapItemKey,
          status: status,
          sprint: null
        });
      }
      
      releaseItemsByRoadmapItem[roadmapItemKey] = releaseItems;
    });
    
    return releaseItemsByRoadmapItem;
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
    
    // Generate roadmap items for each area-initiative combination
    this.areas.forEach((area, areaIndex) => {
      this.initiatives.forEach((initiative, initiativeIndex) => {
        const roadmapItemKey = `ROAD-${roadmapItemCounter}`;
        const summary = `${initiative.name} - ${roadmapItemCounter}`;
        
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
      });
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
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
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
}

export default FakeDataGenerator;
