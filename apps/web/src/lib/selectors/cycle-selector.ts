/**
 * Cycle Selection Logic
 *
 * Pure business logic for selecting the best cycle based on availability and priority.
 * Extracted from Vuex store to improve separation of concerns.
 */

import type { Cycle } from "@omega/types";

/**
 * Determines the best cycle to select based on availability and priority
 * Priority: active cycles (oldest first) -> future cycles (oldest first) -> closed cycles (oldest first)
 * @param cycles - Array of available cycles
 * @returns Selected cycle or null if no cycles available
 */
export function selectDefaultCycle(cycles: Cycle[]): Cycle | null {
  if (!cycles || !Array.isArray(cycles) || cycles.length === 0) {
    return null;
  }

  // Sort cycles by start date (oldest first)
  const sortedCycles = [...cycles].sort((a, b) => {
    const dateA = new Date(a.start || a.delivery || 0).getTime();
    const dateB = new Date(b.start || b.delivery || 0).getTime();
    return dateA - dateB;
  });

  // 1. Try to find active cycles (oldest first)
  const activeCycles = sortedCycles.filter((cycle) => cycle.state === "active");
  if (activeCycles.length > 0) {
    return activeCycles[0]; // Oldest active cycle
  }

  // 2. Try to find future cycles (oldest first)
  const futureCycles = sortedCycles.filter((cycle) => {
    const cycleDate = new Date(cycle.start || cycle.delivery || 0);
    const now = new Date();
    return (
      cycleDate > now && cycle.state !== "closed" && cycle.state !== "completed"
    );
  });
  if (futureCycles.length > 0) {
    return futureCycles[0]; // Oldest future cycle
  }

  // 3. Fall back to closed cycles (oldest first)
  const closedCycles = sortedCycles.filter(
    (cycle) => cycle.state === "closed" || cycle.state === "completed",
  );
  if (closedCycles.length > 0) {
    return closedCycles[0]; // Oldest closed cycle
  }

  // 4. Last resort: return the first cycle (oldest by our sort)
  return sortedCycles[0];
}
