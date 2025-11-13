/**
 * Purify-ts Utilities
 *
 * Generic functional composition utilities and helpers for working with purify-ts ADTs.
 * Provides pipeline composition, monadic helpers, safe wrappers, and utility functions.
 *
 * Side note: Could be moved into it's own package outside of headnorth-monorepo.
 */

import type { Either } from "purify-ts";
import { Maybe, Left, Right } from "purify-ts";

/**
 * Pipe function - chains functions left to right
 * f3(f2(f1(x))) === pipe(x, f1, f2, f3)
 *
 * This is a flexible pipe implementation that works with any number of functions.
 * TypeScript will infer types correctly for most use cases.
 */

export function pipe<T>(value: T): T;
// eslint-disable-next-line no-redeclare
export function pipe<T, T2>(value: T, fn1: (x: T) => T2): T2;
// eslint-disable-next-line no-redeclare
export function pipe<T, T2, T3>(
  value: T,
  fn1: (x: T) => T2,
  fn2: (x: T2) => T3,
): T3;
// eslint-disable-next-line no-redeclare
export function pipe<T, T2, T3, T4>(
  value: T,
  fn1: (x: T) => T2,
  fn2: (x: T2) => T3,
  fn3: (x: T3) => T4,
): T4;
// eslint-disable-next-line no-redeclare
export function pipe<T, T2, T3, T4, T5>(
  value: T,
  fn1: (x: T) => T2,
  fn2: (x: T2) => T3,
  fn3: (x: T3) => T4,
  fn4: (x: T4) => T5,
): T5;
// eslint-disable-next-line no-redeclare
export function pipe<T, T2, T3, T4, T5, T6>(
  value: T,
  fn1: (x: T) => T2,
  fn2: (x: T2) => T3,
  fn3: (x: T3) => T4,
  fn4: (x: T4) => T5,
  fn5: (x: T5) => T6,
): T6;
// eslint-disable-next-line no-redeclare
export function pipe<T, T2, T3, T4, T5, T6, T7>(
  value: T,
  fn1: (x: T) => T2,
  fn2: (x: T2) => T3,
  fn3: (x: T3) => T4,
  fn4: (x: T4) => T5,
  fn5: (x: T5) => T6,
  fn6: (x: T6) => T7,
): T7;
// eslint-disable-next-line no-redeclare
export function pipe<T>(
  value: T,
  ...fns: Array<(x: unknown) => unknown>
): unknown {
  return fns.reduce((acc: unknown, fn) => fn(acc), value as unknown);
}

/**
 * Compose functions - chains functions right to left
 * compose(f3, f2, f1)(x) === f3(f2(f1(x)))
 */
export const compose = <T1, T2, T3>(
  fn2: (x: T2) => T3,
  fn1: (x: T1) => T2,
): ((x: T1) => T3) => {
  return (x: T1) => fn2(fn1(x));
};

export const compose3 = <T1, T2, T3, T4>(
  fn3: (x: T3) => T4,
  fn2: (x: T2) => T3,
  fn1: (x: T1) => T2,
): ((x: T1) => T4) => {
  return (x: T1) => fn3(fn2(fn1(x)));
};

export const compose4 = <T1, T2, T3, T4, T5>(
  fn4: (x: T4) => T5,
  fn3: (x: T3) => T4,
  fn2: (x: T2) => T3,
  fn1: (x: T1) => T2,
): ((x: T1) => T5) => {
  return (x: T1) => fn4(fn3(fn2(fn1(x))));
};

/**
 * Map over Maybe - safely transform optional values
 */
export const mapMaybe = <T, U>(
  fn: (x: T) => U,
): ((maybe: Maybe<T>) => Maybe<U>) => {
  return (maybe: Maybe<T>) => maybe.map(fn);
};

/**
 * Chain Maybe operations - sequence operations that return Maybe
 */
export const chainMaybe = <T, U>(
  fn: (x: T) => Maybe<U>,
): ((maybe: Maybe<T>) => Maybe<U>) => {
  return (maybe: Maybe<T>) => maybe.chain(fn);
};

/**
 * Map over Either - transform the Right value
 */
export const mapEither = <E, T, U>(
  fn: (x: T) => U,
): ((either: Either<E, T>) => Either<E, U>) => {
  return (either: Either<E, T>) => either.map(fn);
};

/**
 * Chain Either operations - sequence operations that return Either
 */
export const chainEither = <E, T, U>(
  fn: (x: T) => Either<E, U>,
): ((either: Either<E, T>) => Either<E, U>) => {
  return (either: Either<E, T>) => either.chain(fn);
};

/**
 * Filter a value with Maybe predicate
 */
export const filterMaybe = <T>(
  predicate: (x: T) => boolean,
): ((maybe: Maybe<T>) => Maybe<T>) => {
  return (maybe: Maybe<T>) => maybe.filter(predicate);
};

/**
 * Sequence an array of functions - apply all to same input
 * sequence([f, g, h])(x) === [f(x), g(x), h(x)]
 */
export const sequence = <T, U>(fns: readonly ((x: T) => U)[]) => {
  return (value: T): readonly U[] => fns.map((fn) => fn(value));
};

/**
 * Parallel composition - run multiple transformations and combine results
 */
export const parallel = <T, U1, U2>(
  fn1: (x: T) => U1,
  fn2: (x: T) => U2,
): ((x: T) => [U1, U2]) => {
  return (x: T): [U1, U2] => [fn1(x), fn2(x)];
};

export const parallel3 = <T, U1, U2, U3>(
  fn1: (x: T) => U1,
  fn2: (x: T) => U2,
  fn3: (x: T) => U3,
): ((x: T) => [U1, U2, U3]) => {
  return (x: T): [U1, U2, U3] => [fn1(x), fn2(x), fn3(x)];
};

/**
 * Conditional pipeline - apply function based on predicate
 */
export const when = <T>(
  predicate: (x: T) => boolean,
  fn: (x: T) => T,
): ((x: T) => T) => {
  return (x: T) => (predicate(x) ? fn(x) : x);
};

/**
 * Conditional pipeline with Maybe - apply function if Maybe is Just
 */
export const whenMaybe = <T, U>(
  fn: (x: T) => U,
): ((maybe: Maybe<T>) => Maybe<U>) => {
  return (maybe: Maybe<T>) => maybe.map(fn);
};

/**
 * Safe pipeline - handles errors with Either (sync)
 */
export const safe = <T, U>(fn: (x: T) => U): ((x: T) => Either<Error, U>) => {
  return (x: T) => {
    try {
      return Right(fn(x));
    } catch (error) {
      return Left(error instanceof Error ? error : new Error(String(error)));
    }
  };
};

/**
 * Safe async pipeline - handles errors with Either for Promise-returning functions
 * Wraps async functions with try-catch and returns Promise<Either<Error, T>>
 */
export const safeAsync = <T>(
  fn: () => Promise<T>,
): Promise<Either<Error, T>> => {
  return fn()
    .then((value) => Right(value))
    .catch((error) =>
      Left(error instanceof Error ? error : new Error(String(error))),
    );
};

/**
 * Tap - perform side effect without affecting the value
 * Useful for debugging or logging in pipelines
 */
export const tap = <T>(effect: (x: T) => void): ((x: T) => T) => {
  return (x: T) => {
    effect(x);
    return x;
  };
};
