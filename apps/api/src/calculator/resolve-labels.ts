import {
  translateLabelWithoutFallback,
  getLabelsWithPrefix,
} from "./parse-common";
import type { OmegaConfig } from "@omega/config";

class LabelResolver {
  private validationDictionary: any;

  constructor(validationDictionary: any) {
    this.validationDictionary = validationDictionary;
  }

  static collectInitiative(project: any, omegaConfig: OmegaConfig) {
    const fallbackInitiative = "uncategorized";
    const initiative = this.parseInitiative(project.labels);

    if (!initiative) {
      const isNonRoadmapTheme =
        this.parseTheme(project.labels) === "non-roadmap";
      const validationDictionary = omegaConfig.getValidationDictionary();
      const validations = isNonRoadmapTheme
        ? []
        : [validationDictionary.roadmapItem.missingInitiativeLabel];
      return { value: fallbackInitiative, id: fallbackInitiative, validations };
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
        validations: [
          omegaConfig
            .getValidationDictionary()
            .roadmapItem.missingInitiativeTranslation(initiative),
        ],
      };
    }

    return { value: translatedInitiative, id: initiative, validations: [] };
  }

  static collectTheme(project: any, omegaConfig: OmegaConfig) {
    const theme = this.parseTheme(project.labels);
    if (!theme) {
      return {
        value: undefined,
        validations: [
          omegaConfig.getValidationDictionary().roadmapItem.missingThemeLabel,
        ],
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
        validations: [
          omegaConfig
            .getValidationDictionary()
            .roadmapItem.missingThemeTranslation(theme),
        ],
      };
    }

    return { value: translatedTheme, validations: [] };
  }

  static collectArea(project: any, omegaConfig: OmegaConfig) {
    const areaIds = this.parseArea(project.labels);
    if (areaIds.length === 0) {
      return {
        value: [],
        validations: [
          omegaConfig.getValidationDictionary().roadmapItem.missingAreaLabel,
        ],
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
          validations: [
            omegaConfig
              .getValidationDictionary()
              .roadmapItem.missingAreaTranslation(area),
          ],
        };
      }

      return { value: translatedArea, validations: [] };
    });

    return {
      value: areas.map((area) => area.value).join(", "),
      validations: areas.map((area) => area.validations).flat(),
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
