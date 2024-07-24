/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Apply basis to number for offset (negative) indexing.
 */

/**
 * Utility function to apply the optional basis to the specified number.
 * @param {number} num
 * @param {number|undefined} basis
 * @returns {number} Result of applying basis to number.
 */
export function applyBasis(num, basis) {
  return num < 0 && basis !== undefined ? num + basis : num;
}
