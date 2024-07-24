/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Test whether a row config matches a layer index.
 */

import {NetworkRowConfig} from '../config/network-row-config.js';

/**
 * @param {NetworkRowConfig} rowConfig
 * @param {number} positionIndex
 * @returns {boolean} Whether the row config matches the position index.
 */
export function rowMatchesPositionIndex(rowConfig, positionIndex) {
  if (rowConfig.positionIndexRange !== undefined) {
    return (
      rowConfig.positionIndexRange[0] <= positionIndex &&
      positionIndex <= rowConfig.positionIndexRange[1]
    );
  }
  return rowConfig.positionIndex === positionIndex;
}
