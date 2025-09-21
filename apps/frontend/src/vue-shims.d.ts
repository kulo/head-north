declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '@/filters/area-filter.js' {
  export function filterByArea(items: any[], area: string): any[]
}

declare module '@/filters/initiatives-filter.js' {
  export function filterByInitiatives(items: any[], initiatives: string[]): any[]
}

declare module '@/filters/stages-filter.js' {
  export function filterByStages(items: any[], stages: string[]): any[]
}

declare module '@/filters/assignee-filter.js' {
  export function filterByAssignees(items: any[], assignees: string[]): any[]
}

declare module '@/filters/cycle-filter.js' {
  export function filterByCycle(items: any[], cycle: string): any[]
}

declare module '@/lib/transformers/data-transformations.js' {
  export function transformForCycleOverview(data: any): any
  export function transformForRoadmap(data: any): any
  export function calculateCycleProgress(cycle: any): any
  export function calculateCycleData(data: any): any
}
