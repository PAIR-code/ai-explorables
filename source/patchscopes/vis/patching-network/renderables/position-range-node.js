/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Nodes representing elided ranges of input tokens.
 */

import {EllipsisNode} from './ellipsis-node.js';

/**
 * Node representing a range of input tokens.
 */
export class PositionRangeNode extends EllipsisNode {
  /**
   * @param {object} params Object containing constructor parameters.
   * @param {string} params.positionIndexRange Two-element array of indices.
   */
  constructor(params) {
    if (
      !Array.isArray(params.positionIndexRange) ||
      params.positionIndexRange.length !== 2 ||
      isNaN(params.positionIndexRange[0]) ||
      isNaN(params.positionIndexRange[1])
    ) {
      throw new Error('positionIndexRange missing or malformed');
    }

    super(params);

    /**
     * Position index of the first token of the range.
     * @type {[number, number]}
     */
    this.positionIndexRange = params.positionIndexRange;
  }
}
