import _ from "lodash";
import { ReleaseItemParser } from "./release-item-parser";
import { RoadmapItemParser } from "./roadmap-item-parser";
import { translateLabel } from "./parse-common";
import type { OmegaConfig } from "@omega/config";

class IssueParser {
  private issues: any[];
  private roadmapItems: any;
  private omegaConfig: OmegaConfig;
  private _releaseItemParser: ReleaseItemParser;
  private _roadmapItemParser: RoadmapItemParser;

  constructor(
    issues: any[],
    roadmapItems: any,
    sprint: any,
    omegaConfig: OmegaConfig,
  ) {
    this.issues = issues;
    this.roadmapItems = roadmapItems;
    this.omegaConfig = omegaConfig;
    this._releaseItemParser = new ReleaseItemParser(sprint, omegaConfig);
    this._roadmapItemParser = new RoadmapItemParser(roadmapItems, omegaConfig);
  }

  parse() {
    const releaseItems = this.issues.map((issue) =>
      this._releaseItemParser.parse(issue),
    );

    const roadmapItems = this._groupByRoadmapItems(releaseItems);
    return this._groupByInitiatives(roadmapItems);
  }

  private _groupByRoadmapItems(parsed: any[]) {
    const grouped = _.groupBy(parsed, (releaseItem) => releaseItem.projectId);

    return Object.values(grouped).map((roadmapItemGroup) => {
      const projectId = roadmapItemGroup[0].projectId;
      const releaseItems = roadmapItemGroup.map((releaseItem) =>
        _.omit(releaseItem, ["projectId"]),
      ) as any[];
      return this._roadmapItemParser.parse(projectId, releaseItems);
    });
  }

  private _groupByInitiatives(roadmapItems: any[]) {
    const virtualId = "virtual";
    const virtualLabel = translateLabel("theme", virtualId, this.omegaConfig);
    const virtuals = roadmapItems.filter(
      (roadmapItem) => roadmapItem.theme === virtualLabel,
    );
    const nonVirtuals = roadmapItems.filter(
      (roadmapItem) => roadmapItem.theme !== virtualLabel,
    );

    // Group by initiative instead of theme + initiative
    const grouped = _.groupBy(
      nonVirtuals,
      (roadmapItem) => roadmapItem.initiative?.name,
    );

    const initiatives = Object.entries(grouped).map(([initiativeId, value]) => {
      return {
        initiative: _.get(value, "0.initiative"),
        id: initiativeId,
        roadmapItems: value.map((roadmapItem) =>
          _.omit(roadmapItem, ["theme", "initiative", "initiativeId"]),
        ),
      };
    });

    // Add virtual items as a separate initiative
    if (virtuals.length > 0) {
      initiatives.push({
        initiative: virtualLabel,
        id: virtualId,
        roadmapItems: virtuals.map((roadmapItem) =>
          _.omit(roadmapItem, ["theme", "initiative"]),
        ),
      });
    }

    return initiatives;
  }
}

export default (
  issues: any[],
  roadmapItems: any,
  sprint: any,
  omegaConfig: OmegaConfig,
) => {
  return new IssueParser(issues, roadmapItems, sprint, omegaConfig).parse();
};
