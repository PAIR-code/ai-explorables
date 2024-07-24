/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Shallow comparison of two arrays for equality.
 */

/**
 * Shallow compare two arrays for equality.
 * @param {unknown[]} firstArray
 * @param {unknown[]} secondArray
 * @returns Whether the two arrays have equal members.
 */
export function arraysEqual(firstArray, secondArray) {
  if (!Array.isArray(firstArray) || !Array.isArray(secondArray)) {
    throw new Error('arguments must be arrays');
  }
  if (firstArray.length !== secondArray.length) {
    return false;
  }
  for (let i = 0; i < firstArray.length; i++) {
    if (firstArray[i] !== secondArray[i]) {
      return false;
    }
  }
  return true;
}
