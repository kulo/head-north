// Fake Data Adapter for fast development without JIRA dependency
// Generates realistic Head North domain data directly based on config
// Uses Either for functional error handling

import type { Either } from "@headnorth/utils";
import { safeAsync } from "@headnorth/utils";
import type { HeadNorthConfig } from "@headnorth/config";
import type {
  RawCycleData,
  Cycle,
  RoadmapItem,
  ReleaseItem,
  Person,
  Area,
  Team,
  Initiative,
  ISODateString,
} from "@headnorth/types";
import type { JiraAdapter } from "./jira-adapter.interface";

export class FakeDataAdapter implements JiraAdapter {
  private assignees: Person[];
  private areas: Area[];
  private initiatives: Initiative[];
  private roadmapItems: Record<string, RoadmapItem>;
  private sprints: Cycle[];

  constructor(private config: HeadNorthConfig) {
    // Initialize assignees (same as old generator)
    this.assignees = [
      { id: "all", name: "All Assignees" },
      { id: "john.doe", name: "John Doe" },
      { id: "jane.smith", name: "Jane Smith" },
      { id: "bob.johnson", name: "Bob Johnson" },
      { id: "alice.brown", name: "Alice Brown" },
      { id: "charlie.wilson", name: "Charlie Wilson" },
      { id: "david.lee", name: "David Lee" },
      { id: "emma.davis", name: "Emma Davis" },
    ];

    // Initialize areas from config
    const areasConfig = this.config.getAreas();
    this.areas = Object.entries(areasConfig).map(([id, name]) => ({
      id,
      name,
      teams: this.generateTeamsForArea(id, name),
    }));

    // Initialize initiatives from config
    const initiativesConfig = this.config.getInitiatives();
    this.initiatives = Object.entries(initiativesConfig).map(([id, name]) => ({
      id,
      name,
    }));

    // Generate roadmap items dynamically based on areas and initiatives from config
    this.roadmapItems = this.generateRoadmapItems();

    // Generate sprints following Shape-up methodology (2-month cycles)
    this.sprints = this.generateSprints();
  }

  async fetchCycleData(): Promise<Either<Error, RawCycleData>> {
    return safeAsync(async () => {
      // Generate release items based on roadmap items and sprints
      const releaseItems = this.generateReleaseItems();
      const areas = this.generateAreas();
      const initiatives = this.generateInitiatives();
      const teams = this.generateTeams();
      const assignees = this.generateAssignees();
      const stages = this.config.getStages();

      return {
        cycles: this.sprints,
        roadmapItems: Object.values(this.roadmapItems),
        releaseItems,
        areas,
        initiatives,
        assignees,
        stages,
        teams,
      } as RawCycleData;
    });
  }

  /**
   * Generate sprints following Shape-up methodology (2-month cycles)
   * Creates: 1 past sprint, 1 active sprint, 2 future sprints
   */
  private generateSprints(): Cycle[] {
    const now = new Date();
    const sprints: Cycle[] = [];

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
      let state: "active" | "closed" | "future";
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
        state,
        start: this.formatDate(startDate),
        end: this.formatDate(endDate),
        delivery: this.formatDate(endDate),
      });
    }

    return sprints;
  }

  /**
   * Generate roadmap items dynamically based on areas and initiatives from config
   */
  private generateRoadmapItems(): Record<string, RoadmapItem> {
    const roadmapItems: Record<string, RoadmapItem> = {};

    // Get teams and themes from Head North config
    const teams = this.config.getTeams();
    const themes = this.config.getThemes();
    const teamKeys = Object.keys(teams);
    const themeKeys = Object.keys(themes);

    let roadmapItemCounter = 1;

    // Generate roadmap items for each initiative (1-5 items per initiative)
    this.initiatives.forEach((initiative, _initiativeIndex) => {
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
          area: area.id,
          initiativeId: initiative.id,
          isExternal: true,
          url: `https://example.com/browse/${roadmapItemKey}`,
          validations: [],
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
        area: area.id,
        initiativeId: null, // No initiative assigned
        isExternal: true,
        url: `https://example.com/browse/${roadmapItemKey}`,
        validations: [],
      };

      roadmapItemCounter++;
    }

    return roadmapItems;
  }

  /**
   * Generate release items based on roadmap items and sprints
   */
  private generateReleaseItems(): ReleaseItem[] {
    const allReleaseItems: ReleaseItem[] = [];

    // Create 1-3 release items for each roadmap item, distributed across different cycles
    Object.keys(this.roadmapItems).forEach((roadmapItemKey) => {
      const releaseItems = this.getReleaseItemsForRoadmapItem(roadmapItemKey);

      // Assign each release item to a random sprint (cycle)
      releaseItems.forEach((item) => {
        const sprint =
          this.sprints.length > 0
            ? this.sprints[Math.floor(Math.random() * this.sprints.length)]
            : null;

        allReleaseItems.push({
          ...item,
          roadmapItemId: roadmapItemKey,
          cycleId: sprint?.id || null,
          ...(sprint && { cycle: { id: sprint.id, name: sprint.name } }),
        });
      });
    });

    return allReleaseItems;
  }

  /**
   * Get release items for a specific roadmap item
   */
  private getReleaseItemsForRoadmapItem(roadmapItemKey: string): ReleaseItem[] {
    const stages = ["s0", "s1", "s2", "s3", "s3+"]; // Stage progression order
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

      releaseItems.push({
        id: `${roadmapItemKey}-RELEASE-${i + 1}`,
        ticketId: `${roadmapItemKey}-RELEASE-${i + 1}`,
        effort: Math.floor(Math.random() * 8) + 1,
        name: `${roadmapItem.summary} - Release Item ${i + 1} - (${releaseStage})`,
        areaIds: [
          typeof roadmapItem.area === "string"
            ? roadmapItem.area
            : roadmapItem.area?.id || "",
        ],
        teams: [assignee.id],
        status: status,
        url: `https://example.com/browse/${roadmapItemKey}-RELEASE-${i + 1}`,
        isExternal: true,
        stage: releaseStage,
        assignee: assignee,
        validations: [],
        roadmapItemId: roadmapItemKey,
        created: this.getRandomDate(),
        updated: this.getRandomDate(),
      });
    }

    return releaseItems;
  }

  private generateAreas(): Record<string, Area> {
    const areas = this.config.getAreas();
    const teams = this.config.getTeams();

    const result: Record<string, Area> = {};

    Object.entries(areas).forEach(([areaId, areaName]) => {
      const areaTeams = Object.entries(teams)
        .filter(([teamId]) => teamId.startsWith(areaId))
        .map(([teamId, teamName]) => ({ id: teamId, name: teamName }));

      result[areaId] = {
        id: areaId,
        name: areaName,
        teams: areaTeams,
      };
    });

    return result;
  }

  private generateInitiatives(): Initiative[] {
    const initiatives = this.config.getInitiatives();

    return Object.entries(initiatives).map(([id, name]) => ({
      id,
      name,
    }));
  }

  private generateTeams(): Team[] {
    const teams = this.config.getTeams();

    return Object.entries(teams).map(([id, name]) => ({
      id,
      name,
    }));
  }

  private generateAssignees(): Person[] {
    return this.assignees;
  }

  /**
   * Generate teams for a specific area
   */
  private generateTeamsForArea(areaId: string, areaName: string): Team[] {
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

  private getRandomAssignee(): Person {
    const assignees = this.generateAssignees();
    return (
      assignees[Math.floor(Math.random() * assignees.length)] || {
        id: "unknown",
        name: "Unknown User",
      }
    );
  }

  private formatDate(date: Date): ISODateString {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}` as ISODateString;
  }

  private getRandomDate(): string {
    const now = new Date();
    const randomDays = Math.floor(Math.random() * 90) - 45; // -45 to +45 days
    const date = new Date(now);
    date.setDate(date.getDate() + randomDays);
    return date.toISOString();
  }
}
