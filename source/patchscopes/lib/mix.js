/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Standard linear interpolation function.
 */

/**
 * Standard `mix()` function for linearly interpolating numeric values.
 * @see https://registry.khronos.org/OpenGL-Refpages/gl4/html/mix.xhtml
 * @param {number} x1
 * @param {number} x2
 * @param {number} a
 * @returns {number} Linear interpolation of `x1` and `x2` by factor `a`.
 */
export function mix(x1, x2, a) {
  return x1 * (1 - a) + x2 * a;
}
