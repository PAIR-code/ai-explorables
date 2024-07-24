/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Utility function for determining whether a number lies within a
 * configurable array of numeric ranges.
 */

import {applyBasis} from './apply-basis.js';

/**
 * Determines whether a given number is within a configurable array of numbers
 * or ranges of numbers.
 *
 * Examples:
 *
 * ```
 * const haystack = [3, [10, 15]];
 *
 * findInRanges(haystack, 2);   // false.
 * findinranges(haystack, 3);   // true (exact equality).
 * findinranges(haystack, 4);   // false.
 * findinranges(haystack, 9);   // false.
 * findinranges(haystack, 10);  // true (start of range).
 * findinranges(haystack, 11);  // true (within range).
 * findinranges(haystack, 12);  // true (within range).
 * findinranges(haystack, 13);  // true (within range).
 * findinranges(haystack, 14);  // true (within range).
 * findinranges(haystack, 15);  // true (end of range).
 * findinranges(haystack, 16);  // false.
 * findinranges(haystack, 17);  // false.
 * ```
 *
 * Example with basis:
 *
 * ```
 * const haystack = [[2, -1]];
 *
 * // Using basis=5 means -1 is interpreted as 4.
 * findInRanges(haystack, 0, 5);   // false.
 * findInRanges(haystack, 1, 5);   // false.
 * findInRanges(haystack, 2, 5);   // true (start of range).
 * findInRanges(haystack, 3, 5);   // true (within range).
 * findInRanges(haystack, 4, 5);   // true (end of range).
 * findInRanges(haystack, 5, 5);   // false.
 *
 * // Using basis=7 means -1 is interpreted as 6.
 * findInRanges(haystack, 0, 7);   // false.
 * findInRanges(haystack, 1, 7);   // false.
 * findInRanges(haystack, 2, 7);   // true (start of range).
 * findInRanges(haystack, 3, 7);   // true (within range).
 * findInRanges(haystack, 4, 7);   // true (within range).
 * findInRanges(haystack, 5, 7);   // true (within range).
 * findInRanges(haystack, 6, 7);   // true (end of range).
 * findInRanges(haystack, 7, 7);   // false.
 * ```
 *
 * @param {Array<number|number[]>} haystack Array of numbers and ranges to test.
 * @param {number} needle Number to find in the haystack.
 * @param {number|undefined} basis Basis for interpreting negative numbers.
 */
export function findInRanges(haystack, needle, basis = undefined) {
  needle = applyBasis(needle, basis);

  for (const numberOrRange of haystack) {
    if (Array.isArray(numberOrRange)) {
      if (
        needle >= applyBasis(numberOrRange[0], basis) &&
        needle <= applyBasis(numberOrRange[1], basis)
      ) {
        return true;
      }
    } else {
      if (needle === applyBasis(numberOrRange, basis)) {
        return true;
      }
    }
  }
  return false;
}
