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
  tap,
} from "../src/pipelines.js";

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
