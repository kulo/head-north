/**
 * Cycle State Utilities
 *
 * Pure utility functions for checking and categorizing cycle states.
 * Uses ts-pattern for exhaustive pattern matching with type safety.
 */

import { match } from "ts-pattern";
import type { CycleState } from "@headnorth/types";

/**
 * Check if cycle state is considered closed/completed using pattern matching
 * @param state - The cycle state to check
 * @returns True if the state is "closed" or "completed"
 */
export const isClosedState = (state: CycleState): boolean =>
  match(state)
    .with("closed", "completed", () => true)
    .otherwise(() => false);

/**
 * Check if cycle state is active using pattern matching
 * @param state - The cycle state to check
 * @returns True if the state is "active"
 */
export const isActiveState = (state: CycleState): boolean =>
  match(state)
    .with("active", () => true)
    .otherwise(() => false);

/**
 * Check if cycle state is future
 * @param state - The cycle state to check
 * @returns True if the state is "future"
 */
export const isFutureState = (state: CycleState): boolean =>
  match(state)
    .with("future", () => true)
    .otherwise(() => false);

/**
 * Check if cycle state represents an active or future cycle
 * Useful for filtering cycles that are not yet closed
 * @param state - The cycle state to check
 * @returns True if the state is "active" or "future"
 */
export const isActiveOrFutureState = (state: CycleState): boolean =>
  match(state)
    .with("active", "future", () => true)
    .otherwise(() => false);
