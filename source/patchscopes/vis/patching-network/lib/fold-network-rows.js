/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Utility function for folding network rows.
 */

import {findInRanges} from '../../../lib/find-in-ranges.js';
import {fold} from '../../../lib/fold.js';

/**
 * Given an array of unfolded `networkRows`, fold together any that are not in the `keptPositionIndices` list.
 *
 * Example unfolded `networkRows` to begin:
 *
 * ```
 * [
 *   {inputToken: "A", positionIndex: 0},
 *   {inputToken: "B", positionIndex: 1},
 *   {inputToken: "C", positionIndex: 2},
 *   {inputToken: "D", positionIndex: 3},
 *   {inputToken: "E", positionIndex: 4},
 * ]
 * ```
 *
 * Example call of `foldNetworkRows()` function:
 *
 * ```
 * foldNetworkRows(networkRows, [0, 4]);
 * ```
 *
 * Expected result:
 *
 * ```
 * [
 *   {inputToken: "A", positionIndex: 0},
 *   {
 *     positionIndexRange: [1, 3],
 *     foldedRows: [
 *       {inputToken: "B", positionIndex: 1},
 *       {inputToken: "C", positionIndex: 2},
 *       {inputToken: "D", positionIndex: 3},
 *     ],
 *   },
 *   {inputToken: "E", positionIndex: 4},
 * ]
 * ```
 * @param {object[]} networkRows Unfolded network rows.
 * @param {number[]} keptPositionIndices List of index ranges to keep unfolded.
 */
export function foldNetworkRows(networkRows, keptPositionIndices) {
  if (!networkRows.length) {
    throw new Error('no rows to fold');
  }

  const lastRow = networkRows[networkRows.length - 1];
  const lastPositionIndex = lastRow.positionIndex;
  const basis = lastPositionIndex + 1;

  const testFn = (networkRow) =>
    findInRanges(keptPositionIndices, networkRow.positionIndex, basis);

  const replaceFn = (networkRows, startIndex, endIndex) => ({
    positionIndexRange: [
      networkRows[startIndex].positionIndex,
      networkRows[endIndex].positionIndex,
    ],
    foldedRows: networkRows.slice(startIndex, endIndex + 1),
  });

  fold(networkRows, testFn, replaceFn);
}
