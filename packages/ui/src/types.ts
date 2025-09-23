/**
 * UI Component Types
 *
 * Shared types for UI components
 */

import type { Page } from "@omega/types";

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

// ============================================================================
// Filter Types
// ============================================================================

export interface FilterItem {
  id: string;
  name: string;
}

export interface StageFilter extends FilterItem {}
export interface InitiativeFilter extends FilterItem {}
export interface AssigneeFilter extends FilterItem {}
export interface CycleFilter extends FilterItem {}

export interface FilterConfig {
  area?: string;
  initiatives?: InitiativeFilter[];
  stages?: StageFilter[];
  cycle?: string | CycleFilter;
}

// ============================================================================
// Vue Store Types
// ============================================================================

export interface RoadmapData {
  orderedCycles: any[];
  roadmapItems: any[];
  activeCycle: any | null;
  initiatives?: any[];
}

export interface CycleOverviewData {
  cycle: any;
  initiatives: any[];
}

export interface StoreState {
  loading: boolean;
  error: string | null;
  roadmapData: RoadmapData;
  cycles: any[];
  cycleOverviewData: CycleOverviewData | null;
  currentCycleOverviewData: CycleOverviewData | null;
  initiatives: any[];
  assignees: any[];
  areas: any[];
  stages: any[];
  pages: {
    all: Page[];
    current: Page;
  };
  selectedInitiatives: any[];
  selectedAssignees: any[];
  selectedArea: string | null;
  selectedCycle: any | null;
  selectedStages: any[];
  validationEnabled: boolean;
  validationSummary: any[];
}

export interface Filters {
  area?: string;
  initiatives?: any[];
  stages?: any[];
  assignees?: any[];
  cycle?: any;
}
