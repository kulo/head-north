declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "@/filters/area-filter" {
  export function filterByArea(items: any[], area: string): any[];
}

declare module "@/filters/initiatives-filter" {
  export function filterByInitiatives(
    items: any[],
    initiatives: string[],
  ): any[];
}

declare module "@/filters/stages-filter" {
  export function filterByStages(items: any[], stages: string[]): any[];
}

declare module "@/filters/assignee-filter" {
  export function filterByAssignees(items: any[], assignees: string[]): any[];
}

declare module "@/filters/cycle-filter" {
  export function filterByCycle(items: any[], cycle: string): any[];
}

declare module "@/lib/transformers/data-transformations" {
  export function transformForCycleOverview(data: any): any;
  export function transformForRoadmap(data: any): any;
  export function calculateCycleProgress(cycle: any): any;
  export function calculateCycleData(data: any): any;
}
