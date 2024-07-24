/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Nodes representing input tokens.
 */

import {TokenNode} from './token-node.js';

/**
 * Node representing an input token.
 */
export class InputTokenNode extends TokenNode {
  /**
   * @param {object} params Object containing constructor parameters.
   * @param {string} params.positionIndex Index of the input token.
   */
  constructor(params) {
    if (isNaN(params.positionIndex)) {
      throw new Error('positionIndex missing');
    }

    super(params);

    /**
     * Position index of the token. Note that this MAY match the `rowIndex`, but
     * it will differ if some tokens have been collapsed into row ranges, for
     * example.
     * @type {number}
     */
    this.positionIndex = params.positionIndex;
  }
}
