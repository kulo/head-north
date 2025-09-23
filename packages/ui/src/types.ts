/**
 * UI Component Types
 *
 * Note: UI-specific types have been moved to apps/web/src/types/ui-types.ts
 * This file is kept for backward compatibility but will be removed in future versions.
 */

// Re-export types from web app for backward compatibility
export type {
  BaseComponentProps,
  ButtonProps,
  CardProps,
  FilterItem,
  StageFilter,
  InitiativeFilter,
  AssigneeFilter,
  CycleFilter,
  FilterConfig,
  RoadmapData,
  CycleOverviewData,
  StoreState,
  Filters,
} from "../../../apps/web/src/types/ui-types";
