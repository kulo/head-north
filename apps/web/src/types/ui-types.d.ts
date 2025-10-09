/**
 * UI Component Types
 *
 * Shared types for UI components
 */
export interface Page {
  id: string;
  name: string;
  path: string;
}
export interface BaseComponentProps {
  id?: string;
  className?: string;
  testId?: string;
}
export interface ButtonProps extends BaseComponentProps {
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}
export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  header?: boolean;
  footer?: boolean;
}
export interface RoadmapData {
  orderedCycles: Cycle[];
  roadmapItems: RoadmapItem[];
  activeCycle: Cycle | null;
  initiatives?: Initiative[];
}
export interface CycleOverviewData {
  cycle: Cycle;
  initiatives: Initiative[];
}
export interface StoreState {
  loading: boolean;
  error: string | null;
  roadmapData: RoadmapData;
  cycles: Cycle[];
  cycleOverviewData: CycleOverviewData | null;
  currentCycleOverviewData: CycleOverviewData | null;
  initiatives: Initiative[];
  assignees: Assignee[];
  areas: Area[];
  stages: Stage[];
  pages: {
    all: Page[];
    current: Page | null;
  };
  selectedInitiatives: Initiative[];
  selectedAssignees: Assignee[];
  selectedArea: string | null;
  selectedCycle: Cycle | null;
  selectedStages: Stage[];
  validationEnabled: boolean;
  validationSummary: Record<string, unknown>[];
}
export interface Filters {
  area?: string;
  initiatives?: Initiative[];
  stages?: Stage[];
  assignees?: Assignee[];
  cycle?: Cycle;
}
import type {
  Cycle,
  RoadmapItem,
  Initiative,
  Assignee,
  Area,
  Stage,
} from "@omega/types";
//# sourceMappingURL=ui-types.d.ts.map
