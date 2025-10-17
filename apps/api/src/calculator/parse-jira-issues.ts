import _ from "lodash";
import { ReleaseItemParser } from "./release-item-parser";
import { RoadmapItemParser } from "./roadmap-item-parser";
import { translateLabel } from "./parse-common";
import type { OmegaConfig } from "@omega/config";
import type { JiraIssue, JiraSprint, JiraRoadmapItemsData } from "../types";
import type { RoadmapItem, ReleaseItem } from "@omega/types";

class IssueParser {
  private issues: JiraIssue[];
  private roadmapItems: JiraRoadmapItemsData;
  private omegaConfig: OmegaConfig;
  private _releaseItemParser: ReleaseItemParser;
  private _roadmapItemParser: RoadmapItemParser;

  constructor(
    issues: JiraIssue[],
    roadmapItems: JiraRoadmapItemsData,
    sprint: JiraSprint,
    omegaConfig: OmegaConfig,
  ) {
    this.issues = issues;
    this.roadmapItems = roadmapItems;
    this.omegaConfig = omegaConfig;
    this._releaseItemParser = new ReleaseItemParser(sprint, omegaConfig);
    this._roadmapItemParser = new RoadmapItemParser(
      roadmapItems as unknown as Record<string, RoadmapItem>,
      omegaConfig,
    );
  }

  parse() {
    const releaseItems = this.issues.map((issue) =>
      this._releaseItemParser.parse(issue),
    );

    const roadmapItems = this._groupByRoadmapItems(releaseItems);
    return this._groupByInitiatives(roadmapItems);
  }

  private _groupByRoadmapItems(parsed: unknown[]) {
    const grouped = _.groupBy(parsed, (releaseItem) => {
      const item = releaseItem as { projectId?: string };
      return item.projectId;
    });

    return Object.values(grouped).map((roadmapItemGroup) => {
      const firstItem = roadmapItemGroup[0] as { projectId?: string };
      const projectId = firstItem.projectId;
      const releaseItems = roadmapItemGroup.map((releaseItem) =>
        _.omit(releaseItem as Record<string, unknown>, ["projectId"]),
      ) as unknown as ReleaseItem[];
      return this._roadmapItemParser.parse(projectId || "", releaseItems);
    });
  }

  private _groupByInitiatives(roadmapItems: unknown[]) {
    const virtualId = "virtual";
    const virtualLabel = translateLabel("theme", virtualId, this.omegaConfig);
    const virtuals = roadmapItems.filter(
      (roadmapItem) =>
        (roadmapItem as { theme?: string }).theme === virtualLabel,
    );
    const nonVirtuals = roadmapItems.filter(
      (roadmapItem) =>
        (roadmapItem as { theme?: string }).theme !== virtualLabel,
    );

    // Group by initiativeId instead of initiative.name
    const grouped = _.groupBy(
      nonVirtuals,
      (roadmapItem) => (roadmapItem as { initiativeId?: string }).initiativeId,
    );

    const initiatives = Object.entries(grouped).map(([initiativeId, value]) => {
      // Look up the initiative from config
      const initiativesConfig = this.omegaConfig.getInitiatives();
      const initiativeName = initiativesConfig[initiativeId];

      return {
        initiative: { id: initiativeId, name: initiativeName || initiativeId },
        id: initiativeId,
        roadmapItems: value.map((roadmapItem) =>
          _.omit(roadmapItem as Record<string, unknown>, [
            "theme",
            "initiativeId",
          ]),
        ),
      };
    });

    // Add virtual items as a separate initiative
    if (virtuals.length > 0) {
      initiatives.push({
        initiative: { id: virtualId, name: virtualLabel },
        id: virtualId,
        roadmapItems: virtuals.map((roadmapItem) =>
          _.omit(roadmapItem as Record<string, unknown>, ["theme"]),
        ),
      });
    }

    return initiatives;
  }
}

export default (
  issues: JiraIssue[],
  roadmapItems: JiraRoadmapItemsData,
  sprint: JiraSprint,
  omegaConfig: OmegaConfig,
) => {
  return new IssueParser(issues, roadmapItems, sprint, omegaConfig).parse();
};
