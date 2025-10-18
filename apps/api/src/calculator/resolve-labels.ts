import {
  translateLabelWithoutFallback,
  getLabelsWithPrefix,
} from "./parse-common";
import type { OmegaConfig } from "@omega/config";
import type { JiraRoadmapItemData } from "../types";

class LabelResolver {

  static collectInitiative(
    project: JiraRoadmapItemData,
    omegaConfig: OmegaConfig,
  ) {
    const fallbackInitiative = "uncategorized";
    const initiative = this.parseInitiative(project.labels);

    if (!initiative) {
      const isNonRoadmapTheme =
        this.parseTheme(project.labels) === "non-roadmap";
      const validationCodes = isNonRoadmapTheme
        ? []
        : ["missingInitiativeLabel"];
      return { value: fallbackInitiative, id: fallbackInitiative, validationCodes };
    }

    const translatedInitiative = translateLabelWithoutFallback(
      "initiative",
      initiative,
      omegaConfig,
    );

    if (!translatedInitiative) {
      return {
        value: initiative,
        id: initiative,
        validationCodes: ["missingInitiativeTranslation"],
        validationParameter: initiative,
      };
    }

    return { value: translatedInitiative, id: initiative, validationCodes: [] };
  }

  static collectTheme(project: JiraRoadmapItemData, omegaConfig: OmegaConfig) {
    const theme = this.parseTheme(project.labels);
    if (!theme) {
      return {
        value: undefined,
        validationCodes: ["missingThemeLabel"],
      };
    }

    const translatedTheme = translateLabelWithoutFallback(
      "theme",
      theme,
      omegaConfig,
    );
    if (!translatedTheme) {
      return {
        value: theme,
        validationCodes: ["missingThemeTranslation"],
        validationParameter: theme,
      };
    }

    return { value: translatedTheme, validationCodes: [] };
  }

  static collectArea(project: JiraRoadmapItemData, omegaConfig: OmegaConfig) {
    const areaIds = this.parseArea(project.labels);
    if (areaIds.length === 0) {
      return {
        value: [],
        validationCodes: ["missingAreaLabel"],
      };
    }

    const areas = areaIds.map((area: string) => {
      const translatedArea = translateLabelWithoutFallback(
        "area",
        area,
        omegaConfig,
      );

      if (!translatedArea) {
        return {
          value: area,
          validationCodes: ["missingAreaTranslation"],
          validationParameter: area,
        };
      }

      return { value: translatedArea, validationCodes: [] };
    });

    const allValidationCodes = areas.map((area) => area.validationCodes).flat();
    const validationParameters = areas
      .filter((area) => area.validationParameter)
      .map((area) => area.validationParameter)
      .filter((param): param is string => param !== undefined);

    return {
      value: areas.map((area) => area.value).join(", "),
      validationCodes: allValidationCodes,
      validationParameters,
    };
  }

  static parseTheme(labels: string[]): string | undefined {
    return getLabelsWithPrefix(labels, "theme").shift();
  }

  static parseInitiative(labels: string[]): string | undefined {
    return getLabelsWithPrefix(labels, "initiative").shift();
  }

  static parseArea(labels: string[]): string[] {
    return getLabelsWithPrefix(labels, "area");
  }
}

export default LabelResolver;
