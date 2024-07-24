/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Nodes representing skipped network layers.
 */

import {EllipsisNode} from './ellipsis-node.js';

/**
 * Node representing skipped layers, visualized by an ellipsis.
 */
export class SkippedLayersNode extends EllipsisNode {
  /**
   * @param {object} params Object containing constructor parameters.
   * @param {number} params.startLayerIndex Start of skipped layer index range.
   * @param {number} params.endLayerIndex Start of skipped layer index range.
   */
  constructor(params) {
    const {startLayerIndex, endLayerIndex} = params;

    if (isNaN(startLayerIndex)) {
      throw new Error('startLayerIndex missing');
    }

    if (isNaN(endLayerIndex)) {
      throw new Error('endLayerIndex missing');
    }

    super(params);

    /**
     * Inclusive start of skipped layer range.
     * @type {number}
     */
    this.startLayerIndex = startLayerIndex;

    /**
     * Inclusive end of skipped layer range.
     * @type {number}
     */
    this.endLayerIndex = endLayerIndex;
  }
}
