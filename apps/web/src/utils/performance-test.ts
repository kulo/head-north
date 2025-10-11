/**
 * Performance Testing Utility
 *
 * This utility helps compare the performance of Vuex vs Pinia stores
 * by measuring common operations like state updates, computed values, and actions.
 */

import { performance } from "perf_hooks";

export interface PerformanceMetrics {
  operation: string;
  storeType: "vuex" | "pinia";
  duration: number;
  memoryUsage?: number;
  timestamp: number;
}

export class PerformanceTester {
  private metrics: PerformanceMetrics[] = [];

  /**
   * Measure the performance of a store operation
   */
  async measureOperation<T>(
    operation: string,
    storeType: "vuex" | "pinia",
    operationFn: () => T | Promise<T>,
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      const result = await operationFn();
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();

      const metric: PerformanceMetrics = {
        operation,
        storeType,
        duration: endTime - startTime,
        memoryUsage: endMemory - startMemory,
        timestamp: Date.now(),
      };

      this.metrics.push(metric);
      console.log(
        `Performance: ${operation} (${storeType}) took ${metric.duration.toFixed(2)}ms`,
      );

      return result;
    } catch (error) {
      const endTime = performance.now();
      const metric: PerformanceMetrics = {
        operation,
        storeType,
        duration: endTime - startTime,
        timestamp: Date.now(),
      };

      this.metrics.push(metric);
      console.error(
        `Performance: ${operation} (${storeType}) failed after ${metric.duration.toFixed(2)}ms`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get memory usage (if available)
   */
  private getMemoryUsage(): number {
    if (typeof process !== "undefined" && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  /**
   * Get performance metrics for a specific operation
   */
  getMetricsForOperation(operation: string): PerformanceMetrics[] {
    return this.metrics.filter((m) => m.operation === operation);
  }

  /**
   * Get performance metrics for a specific store type
   */
  getMetricsForStore(storeType: "vuex" | "pinia"): PerformanceMetrics[] {
    return this.metrics.filter((m) => m.storeType === storeType);
  }

  /**
   * Compare performance between Vuex and Pinia for a specific operation
   */
  comparePerformance(operation: string): {
    vuex: PerformanceMetrics | undefined;
    pinia: PerformanceMetrics | undefined;
    difference: number;
    winner: "vuex" | "pinia" | "tie";
  } {
    const vuexMetrics = this.getMetricsForOperation(operation).filter(
      (m) => m.storeType === "vuex",
    );
    const piniaMetrics = this.getMetricsForOperation(operation).filter(
      (m) => m.storeType === "pinia",
    );

    const vuex = vuexMetrics[vuexMetrics.length - 1]; // Get latest
    const pinia = piniaMetrics[piniaMetrics.length - 1]; // Get latest

    if (!vuex || !pinia) {
      return { vuex, pinia, difference: 0, winner: "tie" };
    }

    const difference = Math.abs(vuex.duration - pinia.duration);
    const winner = vuex.duration < pinia.duration ? "vuex" : "pinia";

    return { vuex, pinia, difference, winner };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Generate a performance report
   */
  generateReport(): string {
    const operations = [...new Set(this.metrics.map((m) => m.operation))];
    let report = "Performance Test Report\n";
    report += "========================\n\n";

    for (const operation of operations) {
      const comparison = this.comparePerformance(operation);
      report += `Operation: ${operation}\n`;
      report += `  Vuex: ${comparison.vuex?.duration.toFixed(2)}ms\n`;
      report += `  Pinia: ${comparison.pinia?.duration.toFixed(2)}ms\n`;
      report += `  Difference: ${comparison.difference.toFixed(2)}ms\n`;
      report += `  Winner: ${comparison.winner}\n\n`;
    }

    return report;
  }
}

/**
 * Global performance tester instance
 */
export const performanceTester = new PerformanceTester();

/**
 * Convenience function to measure store operations
 */
export async function measureStoreOperation<T>(
  operation: string,
  storeType: "vuex" | "pinia",
  operationFn: () => T | Promise<T>,
): Promise<T> {
  return await performanceTester.measureOperation(
    operation,
    storeType,
    operationFn,
  );
}
