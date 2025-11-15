// Generic validation rules for Development Cycle & Roadmap Dashboard
// TODO: Customize these validation rules for your company's specific workflow and conventions

import type { ValidationRules } from "./types";
import { createURL } from "./utils";

const validationDictionary: ValidationRules = {
  cycleItem: {
    noProjectId: {
      label: "The `Roadmap Item` is missing from the Cycle Item",
      reference: createURL("https://docs.example.com/cycle-item-conventions"),
    },
    missingAreaLabel: {
      label: "At least one `area:` prefix label is needed on the Cycle Item",
      reference: createURL("https://docs.example.com/labeling-conventions"),
    },
    missingTeamLabel: {
      label: "At least one `team:` prefix label is needed on the Cycle Item",
      reference: createURL("https://docs.example.com/labeling-conventions"),
    },
    missingTeamTranslation: (team: string) => ({
      label: `The team name \`${team}\` is not yet translated`,
      reference: createURL("https://docs.example.com/team-translations"),
    }),
    missingEstimate: {
      label: "The `Story point estimate` is missing from the Cycle Item",
      reference: createURL("https://docs.example.com/estimation-conventions"),
    },
    tooGranularEstimate: {
      label:
        "The `Story point estimate` effort is too small, should be at least 0,5 week",
      reference: createURL("https://docs.example.com/estimation-guidelines"),
    },
    missingStage: {
      label: "The stage is missing from the Cycle Item",
      reference: createURL("https://docs.example.com/stage-requirements"),
    },
    missingAssignee: {
      label: "The assignee is missing from the Cycle Item",
      reference: createURL("https://docs.example.com/assignment-requirements"),
    },
    tooLowStageWithoutProperRoadmapItem: {
      label:
        "It should have its own Roadmap Item, because at least another release stage will be in the future based on its current stage",
      reference: createURL(
        "https://docs.example.com/roadmap-item-requirements",
      ),
    },
  },
  roadmapItem: {
    missingAreaLabel: {
      label: "At least one `area:` prefix label is needed on the Roadmap Item",
      reference: createURL("https://docs.example.com/labeling-conventions"),
    },
    missingThemeLabel: {
      label: "At least one `theme:` prefix label is needed on the Roadmap Item",
      reference: createURL("https://docs.example.com/labeling-conventions"),
    },
    missingObjectiveLabel: {
      label:
        "At least one `objective:` prefix label is needed on the Roadmap Item",
      reference: createURL("https://docs.example.com/labeling-conventions"),
    },
    missingAreaTranslation: (area: string) => ({
      label: `The area name \`${area}\` is not yet translated`,
      reference: createURL("https://docs.example.com/area-translations"),
    }),
    missingThemeTranslation: (theme: string) => ({
      label: `The theme \`${theme}\` is not yet translated`,
      reference: createURL("https://docs.example.com/theme-translations"),
    }),
    missingObjectiveTranslation: (objective: string) => ({
      label: `The objective \`${objective}\` is not yet translated`,
      reference: createURL("https://docs.example.com/objective-translations"),
    }),
    missingExternalRoadmap: {
      label:
        'Please set the "External Roadmap" field in Jira either to "Yes" or "No" in order to indicate whether this roadmap item should be on the public roadmap or not, thanks!',
      reference: createURL(
        "https://docs.example.com/external-roadmap-requirements",
      ),
    },
    iternalWithStagedCycleItem: {
      label:
        "This roadmap item should be either marked as external / public (because at least one of its cycle item has a stage), or either changed its cycle items' stages to internal",
      reference: createURL(
        "https://docs.example.com/external-roadmap-requirements",
      ),
    },
    missingExternalRoadmapDescription: {
      label:
        "The external roadmap description is a required field for external roadmap items",
      reference: createURL(
        "https://docs.example.com/external-roadmap-requirements",
      ),
    },
  },
};

export default validationDictionary;
