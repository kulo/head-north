import type { OmegaConfig } from "@omega/config";
import type {
  Person,
  Area,
  Team,
  Initiative,
  RoadmapItem,
  ReleaseItem,
} from "@omega/types";
import type { JiraIssue } from "../types/jira-types";
import type { JiraSprint } from "../types/api-response-types";
import { logger } from "@omega/utils";

export default class FakeDataGenerator {
  private omegaConfig: OmegaConfig;
  private assignees: Person[];
  private areas: Area[];
  private initiatives: Initiative[];
  private roadmapItems: Record<string, RoadmapItem>;
  private sprints: JiraSprint[];

  constructor(omegaConfig: OmegaConfig) {
    this.omegaConfig = omegaConfig;
    this.assignees = [
      { displayName: "All Assignees", accountId: "all" },
      { displayName: "John Doe", accountId: "john.doe" },
      { displayName: "Jane Smith", accountId: "jane.smith" },
      { displayName: "Bob Johnson", accountId: "bob.johnson" },
      { displayName: "Alice Brown", accountId: "alice.brown" },
      { displayName: "Charlie Wilson", accountId: "charlie.wilson" },
      { displayName: "David Lee", accountId: "david.lee" },
      { displayName: "Emma Davis", accountId: "emma.davis" },
    ];

    // Get areas and initiatives from omega config
    const areasConfig = this.omegaConfig.getAreas();
    this.areas = Object.entries(areasConfig).map(([id, name]) => ({
      id,
      name,
      teams: this._generateTeamsForArea(id, name),
    }));

    const initiativesConfig = this.omegaConfig.getInitiatives();
    this.initiatives = Object.entries(initiativesConfig).map(([id, name]) => ({
      id,
      name,
      initiativeId: id,
      initiative: name,
      progress: 0,
      progressWithInProgress: 0,
      progressByReleaseItems: 0,
      weeks: 0,
      weeksDone: 0,
      weeksInProgress: 0,
      weeksNotToDo: 0,
      weeksCancelled: 0,
      weeksPostponed: 0,
      weeksTodo: 0,
      releaseItemsCount: 0,
      releaseItemsDoneCount: 0,
      percentageNotToDo: 0,
      startMonth: "",
      endMonth: "",
      daysFromStartOfCycle: 0,
      daysInCycle: 0,
      currentDayPercentage: 0,
    }));

    // Generate roadmap items dynamically based on areas and initiatives from config
    this.roadmapItems = this._generateRoadmapItems();

    // Generate sprints following Shape-up methodology (2-month cycles)
    this.sprints = this._generateSprints();
  }

  async getSprintsData(): Promise<{ sprints: JiraSprint[] }> {
    return { sprints: this.sprints };
  }

  async getIssuesForSprint(
    sprintId: string | number,
    extraFields: string[] = [],
  ): Promise<JiraIssue[]> {
    const issues: JiraIssue[] = [];
    const roadmapItemKeys = Object.keys(this.roadmapItems);
    const statuses = ["To Do", "In Progress", "Done", "Review"];
    const issueTypes = ["Story", "Task", "Bug", "Epic", "Release Item"];
    const stages = ["s0", "s1", "s2", "s3", "s3+"]; // Stage progression order

    // Get the current sprint data
    const currentSprint = this.sprints.find(
      (sprint) => sprint.id.toString() === sprintId.toString(),
    );

    // Generate issues for each roadmap item, but only include release items for this specific sprint
    roadmapItemKeys.forEach((roadmapItemKey, roadmapItemIndex) => {
      const roadmapItem = this.roadmapItems[roadmapItemKey];

      if (!roadmapItem) return; // Skip if roadmap item doesn't exist

      // Get the release items for this roadmap item from the grouped data
      const releaseItemsForRoadmapItem =
        this._getReleaseItemsForRoadmapItem(roadmapItemKey);

      // Filter release items that belong to this sprint
      const releaseItemsInThisSprint = releaseItemsForRoadmapItem.filter(
        (item) =>
          item.sprint && item.sprint.id.toString() === sprintId.toString(),
      );

      // Generate issues for release items in this sprint (at most 1 per roadmap item)
      releaseItemsInThisSprint.forEach((releaseItem, i) => {
        const assignee =
          this.assignees[
            Math.floor(Math.random() * (this.assignees.length - 1)) + 1
          ]; // Skip 'All Assignees'
        const issueType = "Release Item";
        const issueIndex =
          roadmapItemIndex * 100 + parseInt(sprintId.toString()) * 10 + i; // Ensure unique IDs

        if (!assignee) return; // Skip if no assignee

        issues.push({
          id: `issue-${issueIndex}`,
          key: `ISSUE-${issueIndex}`,
          fields: {
            summary: releaseItem.summary || "", // Use the release item's summary with stage
            status: {
              id: this._getStatusId(releaseItem.status),
              name: releaseItem.status,
            },
            assignee: assignee,
            effort: Math.floor(Math.random() * 8) + 1,
            externalRoadmap: "Yes", // This needs to be 'Yes' for isExternal to return true
            labels: roadmapItem.labels, // Use the roadmap item's labels which now include proper prefixes
            parent: { key: roadmapItemKey },
            issuetype: { name: issueType },
            area: roadmapItem.area,
            initiativeId: roadmapItem.initiativeId || "",
            url: `https://example.com/browse/ISSUE-${issueIndex}`,
            // Add sprint information for proper status resolution
            sprint: currentSprint
              ? {
                  id: currentSprint.id,
                  name: currentSprint.name,
                  startDate: currentSprint.startDate,
                  endDate: currentSprint.endDate,
                  state: currentSprint.state,
                }
              : null,
            // Add additional fields for release items
            teams: [assignee.accountId],
            areaIds: [roadmapItem.area],
          },
        });
      });
    });

    return issues;
  }

  async getRoadmapItemsData(): Promise<Record<string, RoadmapItem>> {
    return this.roadmapItems;
  }

  async getReleaseItemsData(): Promise<ReleaseItem[]> {
    const allReleaseItems: ReleaseItem[] = [];

    // Create 1-3 release items for each roadmap item, distributed across different cycles
    Object.keys(this.roadmapItems).forEach((roadmapItemKey) => {
      const releaseItems = this._getReleaseItemsForRoadmapItem(roadmapItemKey);
      // Add roadmapItemId foreign key to each release item
      releaseItems.forEach((item) => {
        const { cycle, ...itemWithoutCycle } = item;
        allReleaseItems.push({
          ...itemWithoutCycle,
          roadmapItemId: roadmapItemKey,
          cycleId: item.sprint?.id || null,
          // Don't set cycle here - let collect-cycle-data.ts look it up from the cycles array
        } as ReleaseItem & { roadmapItemId: string; cycleId: number | null });
      });
    });

    return allReleaseItems;
  }

  /**
   * Get simulated issues for a sprint
   */
  private _getIssuesForSprint(sprintId: number): JiraIssue[] {
    const issues: JiraIssue[] = [];

    // Create some simulated issues for this sprint
    Object.keys(this.roadmapItems).forEach((roadmapItemKey) => {
      const roadmapItem = this.roadmapItems[roadmapItemKey];

      if (!roadmapItem) return; // Skip if roadmap item doesn't exist

      const releaseItems = this._getReleaseItemsForRoadmapItem(roadmapItemKey);

      releaseItems.forEach((item, index) => {
        if (item.sprint?.id.toString() === sprintId.toString()) {
          issues.push({
            id: item.id,
            key: item.id,
            fields: {
              summary: item.summary,
              description: `Description for ${item.summary}`,
              status: { id: this._getStatusId(item.status), name: item.status },
              effort: item.effort || 0,
              assignee: item.assignee || null,
              labels: roadmapItem.labels || [],
              parent: { key: roadmapItemKey },
              externalRoadmap: "Yes",
              issuetype: { name: "Release Item" },
              area: roadmapItem.area,
              initiativeId: roadmapItem.initiativeId || "",
              url: `https://example.com/browse/${item.id}`,
              sprint: item.sprint,
              teams: [item.assignee?.accountId || "unknown"],
              areaIds: [roadmapItem.area],
            },
            parent: roadmapItemKey,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          } as JiraIssue);
        }
      });
    });

    return issues;
  }

  private _getRandomStage(): string {
    const stages = [
      "development",
      "testing",
      "staging",
      "production",
      "review",
      "planning",
    ];
    return stages[Math.floor(Math.random() * stages.length)] || "development";
  }

  /**
   * Get release items for a specific roadmap item
   * @param roadmapItemKey - The roadmap item key
   * @returns Array of release items for the roadmap item
   * @private
   */
  private _getReleaseItemsForRoadmapItem(
    roadmapItemKey: string,
  ): ReleaseItem[] {
    const stages = ["s0", "s1", "s2", "s3", "s3+"]; // Stage progression order
    const sprints = this.sprints || [];
    const roadmapItem = this.roadmapItems[roadmapItemKey];
    const releaseItems: ReleaseItem[] = [];

    if (!roadmapItem) return releaseItems;

    // Generate 1-3 release items per roadmap item
    const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items

    // Select random stages in progression order (s0 → s1 → s2 → s3 → s3+)
    const selectedStages = stages.slice(0, numItems);

    for (let i = 0; i < numItems; i++) {
      const assignee =
        this.assignees[
          Math.floor(Math.random() * (this.assignees.length - 1)) + 1
        ]; // Skip 'All Assignees'
      const statuses = ["To Do", "In Progress", "Done", "Review"];
      const status =
        statuses[Math.floor(Math.random() * statuses.length)] || "To Do";
      const releaseStage = selectedStages[i] || "s0";

      if (!assignee) continue; // Skip if no assignee

      // Assign to a random sprint (cycle) - each roadmap item gets different cycles
      const sprint =
        sprints.length > 0
          ? sprints[Math.floor(Math.random() * sprints.length)]
          : null;

      releaseItems.push({
        id: `${roadmapItemKey}-RELEASE-${i + 1}`,
        ticketId: `${roadmapItemKey}-RELEASE-${i + 1}`,
        effort: Math.floor(Math.random() * 8) + 1,
        projectId: roadmapItemKey,
        name: `${roadmapItem.summary} - Release Item ${i + 1} - (${releaseStage})`,
        areaIds: [
          typeof roadmapItem.area === "string"
            ? roadmapItem.area
            : roadmapItem.area?.id || "",
        ],
        teams: [assignee.accountId],
        status: status,
        url: `https://example.com/browse/${roadmapItemKey}-RELEASE-${i + 1}`,
        isExternal: true,
        stage: releaseStage,
        assignee: assignee,
        validations: [],
        isPartOfReleaseNarrative: false,
        isReleaseAtRisk: false,
        summary: `${roadmapItem.summary} - Release Item ${i + 1} - (${releaseStage})`,
        closedSprints: [],
        parent: roadmapItemKey,
        sprint: sprint
          ? {
              id: sprint.id.toString(),
              name: sprint.name,
            }
          : null,
      });
    }

    return releaseItems;
  }

  /**
   * Get status ID for a given status name
   * @param statusName - The status name
   * @returns The status ID
   * @private
   */
  private _getStatusId(statusName: string): string {
    const statusMap: Record<string, string> = {
      "To Do": "10001",
      "In Progress": "10002",
      Done: "10003",
      Review: "10004",
    };
    return statusMap[statusName] || "10001";
  }

  getAssignees(): Person[] {
    return this.assignees;
  }

  getAreas(): Area[] {
    return this.areas;
  }

  getInitiatives(): Initiative[] {
    return this.initiatives;
  }

  /**
   * Generate roadmap items dynamically based on areas and initiatives from config
   * @private
   */
  private _generateRoadmapItems(): Record<string, RoadmapItem> {
    const roadmapItems: Record<string, RoadmapItem> = {};

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

        if (!area) continue; // Skip if no area

        // Pick a team that matches the area
        const areaTeams = teamKeys.filter((teamKey) =>
          teamKey.startsWith(area.id),
        );
        const selectedTeam =
          areaTeams.length > 0
            ? areaTeams[Math.floor(Math.random() * areaTeams.length)]
            : teamKeys[0];

        // Pick a theme that matches the initiative
        const selectedTheme =
          themeKeys[Math.floor(Math.random() * themeKeys.length)];

        roadmapItems[roadmapItemKey] = {
          id: roadmapItemKey,
          name: summary,
          summary,
          labels: [
            area.id,
            `initiative:${initiative.id}`,
            `area:${area.id}`,
            `team:${selectedTeam}`,
            `theme:${selectedTheme}`,
          ],
          externalRoadmap: "Yes",
          externalRoadmapDescription: `${initiative.name} - roadmap item ${roadmapItemCounter}`,
          area: area.id,
          initiativeId: initiative.id,
          isExternal: true,
          url: `https://example.com/browse/${roadmapItemKey}`,
        };

        roadmapItemCounter++;
      }
    });

    // Add some roadmap items without initiatives to test UI behavior
    for (let i = 0; i < 3; i++) {
      const roadmapItemKey = `ROAD-${roadmapItemCounter}`;
      const area = this.areas[Math.floor(Math.random() * this.areas.length)];
      const summary = `Unassigned - ${roadmapItemCounter}`;

      if (!area) continue; // Skip if no area

      // Pick a team that matches the area
      const areaTeams = teamKeys.filter((teamKey) =>
        teamKey.startsWith(area.id),
      );
      const selectedTeam =
        areaTeams.length > 0
          ? areaTeams[Math.floor(Math.random() * areaTeams.length)]
          : teamKeys[0];

      // Pick a random theme
      const selectedTheme =
        themeKeys[Math.floor(Math.random() * themeKeys.length)];

      roadmapItems[roadmapItemKey] = {
        id: roadmapItemKey,
        name: summary,
        summary,
        labels: [
          area.id,
          `area:${area.id}`,
          `team:${selectedTeam}`,
          `theme:${selectedTheme}`,
        ],
        externalRoadmap: "Yes",
        externalRoadmapDescription: `Unassigned roadmap item ${roadmapItemCounter}`,
        area: area.id,
        initiativeId: null, // No initiative assigned
        isExternal: true,
        url: `https://example.com/browse/${roadmapItemKey}`,
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
  private _generateSprints(): JiraSprint[] {
    const now = new Date();
    const sprints: JiraSprint[] = [];

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
      const sprintYear =
        currentYear + Math.floor((cycleStartMonth + i * 2) / 12);

      // Calculate the sprint's end month and year (second month of the cycle)
      const sprintEndMonth = (sprintStartMonth + 1) % 12;
      const sprintEndYear =
        sprintStartMonth === 11 ? sprintYear + 1 : sprintYear;

      // Create start date (1st of first month)
      const startDate = new Date(sprintYear, sprintStartMonth, 1);

      // Create end date (last day of second month)
      const endDate = new Date(sprintEndYear, sprintEndMonth + 1, 0); // Last day of the month

      // Determine sprint state based on current date
      let state: string;
      const currentDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      if (currentDate < startDate) {
        state = "future";
      } else if (currentDate >= startDate && currentDate <= endDate) {
        state = "active";
      } else {
        state = "closed";
      }

      // Create sprint name
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const startMonthName = monthNames[sprintStartMonth];
      const endMonthName = monthNames[sprintEndMonth];
      const sprintName = `${startMonthName}-${endMonthName} ${sprintYear}`;

      sprints.push({
        id: (i + 2).toString(), // i goes from -1 to 2, so IDs will be 1, 2, 3, 4
        name: sprintName,
        state: state as any,
        startDate: startDate
          .toISOString()
          .split("T")[0] as `${number}-${number}-${number}`, // YYYY-MM-DD format
        endDate: endDate
          .toISOString()
          .split("T")[0] as `${number}-${number}-${number}`, // YYYY-MM-DD format
        originBoardId: 1, // Default board ID for fake data
      });
    }

    return sprints;
  }

  /**
   * Generate teams for a specific area
   * @param areaId - The area ID
   * @param areaName - The area name
   * @returns Array of teams for the area
   * @private
   */
  private _generateTeamsForArea(areaId: string, areaName: string): Team[] {
    const teamTemplates: Record<string, Team[]> = {
      platform: [
        {
          id: "platform-frontend",
          name: "Frontend Team",
        },
        {
          id: "platform-backend",
          name: "Backend Team",
        },
        {
          id: "platform-devops",
          name: "DevOps Team",
        },
      ],
      resilience: [
        {
          id: "resilience-security",
          name: "Security Team",
        },
        {
          id: "resilience-monitoring",
          name: "Monitoring Team",
        },
      ],
      sustainability: [
        {
          id: "sustainability-green",
          name: "Green Tech Team",
        },
        {
          id: "sustainability-metrics",
          name: "Metrics Team",
        },
      ],
    };

    return (
      teamTemplates[areaId] || [
        {
          id: `${areaId}-team1`,
          name: `${areaName} Team 1`,
        },
        {
          id: `${areaId}-team2`,
          name: `${areaName} Team 2`,
        },
      ]
    );
  }

  /**
   * Get enhanced areas with teams
   * @returns Areas object with teams
   */
  getEnhancedAreas(): Record<string, { name: string; teams: Team[] }> {
    const enhancedAreas: Record<string, { name: string; teams: Team[] }> = {};
    this.areas.forEach((area) => {
      enhancedAreas[area.id] = {
        name: area.name,
        teams: area.teams,
      };
    });
    return enhancedAreas;
  }
}
