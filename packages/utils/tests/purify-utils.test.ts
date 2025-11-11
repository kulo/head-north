/**
 * Tests for Functional Composition Pipelines
 *
 * Tests for functional composition utilities.
 */

import { describe, it, expect } from "vitest";
import { Maybe, Either, Left, Right } from "purify-ts";
import {
  pipe,
  compose,
  compose3,
  mapMaybe,
  chainMaybe,
  mapEither,
  chainEither,
  filterMaybe,
  sequence,
  parallel,
  parallel3,
  when,
  safe,
  safeAsync,
  tap,
  retryWithBackoff,
} from "../src/purify-utils.js";

describe("pipe", () => {
  it("should chain functions left to right", () => {
    const addOne = (x: number) => x + 1;
    const multiplyByTwo = (x: number) => x * 2;
    const subtractThree = (x: number) => x - 3;

    const result = pipe(5, addOne, multiplyByTwo, subtractThree);

    // (5 + 1) * 2 - 3 = 9
    expect(result).toBe(9);
  });

  it("should work with string transformations", () => {
    const toUpper = (s: string) => s.toUpperCase();
    const addPrefix = (s: string) => `PREFIX_${s}`;
    const addSuffix = (s: string) => `${s}_SUFFIX`;

    const result = pipe("hello", toUpper, addPrefix, addSuffix);

    expect(result).toBe("PREFIX_HELLO_SUFFIX");
  });

  it("should handle single function", () => {
    const double = (x: number) => x * 2;

    const result = pipe(5, double);

    expect(result).toBe(10);
  });

  it("should handle no functions (identity)", () => {
    const result = pipe(5);

    expect(result).toBe(5);
  });
});

describe("compose", () => {
  it("should chain functions right to left", () => {
    const addOne = (x: number) => x + 1;
    const multiplyByTwo = (x: number) => x * 2;

    const composed = compose(multiplyByTwo, addOne);

    // compose(f2, f1)(x) = f2(f1(x))
    // (x + 1) * 2
    expect(composed(5)).toBe(12);
  });

  it("should work with compose3", () => {
    const addOne = (x: number) => x + 1;
    const multiplyByTwo = (x: number) => x * 2;
    const subtractThree = (x: number) => x - 3;

    const composed = compose3(subtractThree, multiplyByTwo, addOne);

    // subtractThree(multiplyByTwo(addOne(5)))
    // subtractThree(multiplyByTwo(6))
    // subtractThree(12)
    // 9
    expect(composed(5)).toBe(9);
  });
});

describe("mapMaybe", () => {
  it("should transform Maybe values", () => {
    const double = (x: number) => x * 2;
    const doubleMaybe = mapMaybe(double);

    const maybe = Maybe.of(5);
    const result = doubleMaybe(maybe);

    expect(result.extract()).toBe(10);
  });

  it("should handle Nothing", () => {
    const double = (x: number) => x * 2;
    const doubleMaybe = mapMaybe(double);

    const maybe = Maybe.empty();
    const result = doubleMaybe(maybe);

    expect(result.isNothing()).toBe(true);
  });
});

describe("chainMaybe", () => {
  it("should chain Maybe operations", () => {
    const safeDivide = (x: number): Maybe<number> =>
      x !== 0 ? Maybe.of(10 / x) : Maybe.empty();
    const chainDivide = chainMaybe(safeDivide);

    const maybe = Maybe.of(2);
    const result = chainDivide(maybe);

    expect(result.extract()).toBe(5);
  });

  it("should handle Nothing in chain", () => {
    const safeDivide = (x: number): Maybe<number> =>
      x !== 0 ? Maybe.of(10 / x) : Maybe.empty();
    const chainDivide = chainMaybe(safeDivide);

    const maybe = Maybe.empty();
    const result = chainDivide(maybe);

    expect(result.isNothing()).toBe(true);
  });
});

describe("mapEither", () => {
  it("should transform Either Right values", () => {
    const double = (x: number) => x * 2;
    const doubleEither = mapEither(double);

    const either = Right(5);
    const result = doubleEither(either);

    expect(result.extract()).toBe(10);
  });

  it("should preserve Left values", () => {
    const double = (x: number) => x * 2;
    const doubleEither = mapEither(double);

    const either = Left(new Error("test"));
    const result = doubleEither(either);

    expect(result.isLeft()).toBe(true);
  });
});

describe("chainEither", () => {
  it("should chain Either operations", () => {
    const safeDivide = (x: number) =>
      x !== 0 ? Right(10 / x) : Left(new Error("Division by zero"));
    const chainDivide = chainEither(safeDivide);

    const either = Right(2);
    const result = chainDivide(either);

    expect(result.extract()).toBe(5);
  });

  it("should preserve Left in chain", () => {
    const safeDivide = (x: number) =>
      x !== 0 ? Right(10 / x) : Left(new Error("Division by zero"));
    const chainDivide = chainEither(safeDivide);

    const either = Left(new Error("previous error"));
    const result = chainDivide(either);

    expect(result.isLeft()).toBe(true);
  });
});

describe("filterMaybe", () => {
  it("should filter Maybe values", () => {
    const isEven = (x: number) => x % 2 === 0;
    const filterEven = filterMaybe(isEven);

    const maybe = Maybe.of(4);
    const result = filterEven(maybe);

    expect(result.extract()).toBe(4);
  });

  it("should convert to Nothing when filter fails", () => {
    const isEven = (x: number) => x % 2 === 0;
    const filterEven = filterMaybe(isEven);

    const maybe = Maybe.of(5);
    const result = filterEven(maybe);

    expect(result.isNothing()).toBe(true);
  });
});

describe("sequence", () => {
  it("should apply multiple functions to same input", () => {
    const addOne = (x: number) => x + 1;
    const multiplyByTwo = (x: number) => x * 2;
    const subtractThree = (x: number) => x - 3;

    const sequenced = sequence([addOne, multiplyByTwo, subtractThree]);

    const result = sequenced(5);

    expect(result).toEqual([6, 10, 2]);
  });
});

describe("parallel", () => {
  it("should run multiple transformations in parallel", () => {
    const addOne = (x: number) => x + 1;
    const multiplyByTwo = (x: number) => x * 2;

    const parallelFn = parallel(addOne, multiplyByTwo);

    const result = parallelFn(5);

    expect(result).toEqual([6, 10]);
  });

  it("should work with parallel3", () => {
    const addOne = (x: number) => x + 1;
    const multiplyByTwo = (x: number) => x * 2;
    const subtractThree = (x: number) => x - 3;

    const parallelFn = parallel3(addOne, multiplyByTwo, subtractThree);

    const result = parallelFn(5);

    expect(result).toEqual([6, 10, 2]);
  });
});

describe("when", () => {
  it("should apply function when predicate is true", () => {
    const isPositive = (x: number) => x > 0;
    const double = (x: number) => x * 2;
    const conditionalDouble = when(isPositive, double);

    const result = conditionalDouble(5);

    expect(result).toBe(10);
  });

  it("should not apply function when predicate is false", () => {
    const isPositive = (x: number) => x > 0;
    const double = (x: number) => x * 2;
    const conditionalDouble = when(isPositive, double);

    const result = conditionalDouble(-5);

    expect(result).toBe(-5);
  });
});

describe("safe", () => {
  it("should wrap function in Either for safe execution", () => {
    const divide = (x: number) => 10 / x;
    const safeDivide = safe(divide);

    const result = safeDivide(2);

    expect(result.isRight()).toBe(true);
    expect(result.extract()).toBe(5);
  });

  it("should catch errors and return Left", () => {
    // Create a function that actually throws
    const throwError = (x: number) => {
      if (x === 0) {
        throw new Error("Cannot divide by zero");
      }
      return 10 / x;
    };
    const safeThrow = safe(throwError);

    const result = safeThrow(0);

    expect(result.isLeft()).toBe(true);
    const error = result.extract() as Error;
    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe("Cannot divide by zero");
  });
});

describe("safeAsync", () => {
  it("should wrap async function in Either for safe execution", async () => {
    const asyncFunction = async () => {
      return 42;
    };

    const result = await safeAsync(asyncFunction);

    expect(result.isRight()).toBe(true);
    expect(result.extract()).toBe(42);
  });

  it("should catch errors and return Left", async () => {
    const asyncFunction = async () => {
      throw new Error("Async error");
    };

    const result = await safeAsync(asyncFunction);

    expect(result.isLeft()).toBe(true);
    const error = result.extract() as Error;
    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe("Async error");
  });

  it("should handle promise rejections", async () => {
    const asyncFunction = async () => {
      return Promise.reject(new Error("Promise rejected"));
    };

    const result = await safeAsync(asyncFunction);

    expect(result.isLeft()).toBe(true);
    const error = result.extract() as Error;
    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe("Promise rejected");
  });

  it("should handle non-Error rejections", async () => {
    const asyncFunction = async () => {
      return Promise.reject("String error");
    };

    const result = await safeAsync(asyncFunction);

    expect(result.isLeft()).toBe(true);
    const error = result.extract() as Error;
    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe("String error");
  });
});

describe("tap", () => {
  it("should perform side effect without affecting value", () => {
    let sideEffectValue: number | undefined;
    const log = (x: number) => {
      sideEffectValue = x;
    };
    const tapLog = tap(log);

    const result = tapLog(5);

    expect(result).toBe(5);
    expect(sideEffectValue).toBe(5);
  });

  it("should work in pipelines", () => {
    let tappedValue: number | undefined;
    const log = (x: number) => {
      tappedValue = x;
    };

    const result = pipe(
      5,
      (x) => x + 1,
      tap(log),
      (x) => x * 2,
    );

    expect(result).toBe(12);
    expect(tappedValue).toBe(6);
  });
});

describe("retryWithBackoff", () => {
  it("should succeed on first attempt and return Right", async () => {
    let attempts = 0;
    const fn = async (): Promise<Either<Error, number>> => {
      attempts++;
      return Right(42);
    };

    const result = await retryWithBackoff(fn, {
      maxRetries: 3,
      minTimeout: 10,
      factor: 2,
    });

    expect(result.isRight()).toBe(true);
    expect(result.extract()).toBe(42);
    expect(attempts).toBe(1);
  });

  it("should retry on failure and succeed on subsequent attempt", async () => {
    let attempts = 0;
    const fn = async (): Promise<Either<Error, number>> => {
      attempts++;
      if (attempts < 3) {
        return Left(new Error(`Attempt ${attempts} failed`));
      }
      return Right(42);
    };

    const result = await retryWithBackoff(fn, {
      maxRetries: 3,
      minTimeout: 10,
      factor: 2,
    });

    expect(result.isRight()).toBe(true);
    expect(result.extract()).toBe(42);
    expect(attempts).toBe(3);
  });

  it("should return Left when all retries are exhausted", async () => {
    const fn = async (): Promise<Either<Error, number>> => {
      return Left(new Error("Network error"));
    };

    const result = await retryWithBackoff(fn, {
      maxRetries: 2,
      minTimeout: 10,
      factor: 2,
    });

    expect(result.isLeft()).toBe(true);
    const error = result.extract() as Error;
    expect(error.message).toContain("API request failed after 2 attempts");
    expect(error.message).toContain("Attempt 0: Network error");
    expect(error.message).toContain("Attempt 1: Network error");
  });

  it("should accumulate errors from all retry attempts", async () => {
    let attempts = 0;
    const fn = async (): Promise<Either<Error, number>> => {
      attempts++;
      return Left(new Error(`Error on attempt ${attempts}`));
    };

    const result = await retryWithBackoff(fn, {
      maxRetries: 3,
      minTimeout: 10,
      factor: 2,
    });

    expect(result.isLeft()).toBe(true);
    const error = result.extract() as Error;
    expect(error.message).toContain("API request failed after 3 attempts");
    expect(error.message).toContain("Attempt 0: Error on attempt 1");
    expect(error.message).toContain("Attempt 1: Error on attempt 2");
    expect(error.message).toContain("Attempt 2: Error on attempt 3");
  });

  it("should call onRetry callback for each retry attempt", async () => {
    const retryErrors: Error[] = [];
    const retryAttempts: number[] = [];

    const fn = async (): Promise<Either<Error, number>> => {
      return Left(new Error("Transient error"));
    };

    await retryWithBackoff(fn, {
      maxRetries: 2,
      minTimeout: 10,
      factor: 2,
      onRetry: (error, attempt) => {
        retryErrors.push(error);
        retryAttempts.push(attempt);
      },
    });

    expect(retryErrors).toHaveLength(3); // 3 retries (attempts 0, 1, 2)
    expect(retryAttempts).toEqual([0, 1, 2]);
    retryErrors.forEach((error) => {
      expect(error.message).toBe("Transient error");
    });
  });

  it("should not call onRetry when function succeeds immediately", async () => {
    let onRetryCalled = false;

    const fn = async (): Promise<Either<Error, number>> => {
      return Right(42);
    };

    await retryWithBackoff(fn, {
      maxRetries: 3,
      minTimeout: 10,
      factor: 2,
      onRetry: () => {
        onRetryCalled = true;
      },
    });

    expect(onRetryCalled).toBe(false);
  });

  it("should use custom minTimeout and factor for exponential backoff", async () => {
    const startTime = Date.now();
    let attempts = 0;

    const fn = async (): Promise<Either<Error, number>> => {
      attempts++;
      if (attempts < 2) {
        return Left(new Error("Retry needed"));
      }
      return Right(42);
    };

    const result = await retryWithBackoff(fn, {
      maxRetries: 2,
      minTimeout: 50, // Custom timeout
      factor: 2, // Exponential factor
    });

    const elapsed = Date.now() - startTime;

    expect(result.isRight()).toBe(true);
    // Should have waited at least minTimeout (50ms) before retry
    // With some tolerance for test execution time
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });

  it("should handle different error messages across attempts", async () => {
    let attempts = 0;
    const fn = async (): Promise<Either<Error, number>> => {
      attempts++;
      return Left(
        new Error(
          attempts === 1
            ? "Connection timeout"
            : attempts === 2
              ? "Network unreachable"
              : "Server error",
        ),
      );
    };

    const result = await retryWithBackoff(fn, {
      maxRetries: 3,
      minTimeout: 10,
      factor: 2,
    });

    expect(result.isLeft()).toBe(true);
    const error = result.extract() as Error;
    expect(error.message).toContain("Connection timeout");
    expect(error.message).toContain("Network unreachable");
    expect(error.message).toContain("Server error");
  });

  it("should handle zero maxRetries (no retries)", async () => {
    let attempts = 0;
    const fn = async (): Promise<Either<Error, number>> => {
      attempts++;
      return Left(new Error("Error"));
    };

    const result = await retryWithBackoff(fn, {
      maxRetries: 0,
      minTimeout: 10,
      factor: 2,
    });

    expect(result.isLeft()).toBe(true);
    expect(attempts).toBe(1); // Only initial attempt, no retries
  });

  it("should work with default minTimeout and factor", async () => {
    const fn = async (): Promise<Either<Error, string>> => {
      return Right("success");
    };

    const result = await retryWithBackoff(fn, {
      maxRetries: 2,
      // minTimeout and factor use defaults (1000ms and 2)
    });

    expect(result.isRight()).toBe(true);
    expect(result.extract()).toBe("success");
  });

  it("should preserve error type information", async () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = "CustomError";
      }
    }

    const fn = async (): Promise<Either<Error, number>> => {
      return Left(new CustomError("Custom error occurred"));
    };

    const result = await retryWithBackoff(fn, {
      maxRetries: 1,
      minTimeout: 10,
      factor: 2,
    });

    expect(result.isLeft()).toBe(true);
    const error = result.extract() as Error;
    expect(error.message).toContain("Custom error occurred");
  });
});
