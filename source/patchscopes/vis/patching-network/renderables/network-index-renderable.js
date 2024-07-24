/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview A Renderable that belongs to a particular network.
 */

import {Renderable} from './renderable.js';

/**
 * Renderable with a `networkIndex`.
 */
export class NetworkIndexRenderable extends Renderable {
  /**
   * @param {object} params Object containing constructor parameters.
   * @param {number} params.networkIndex Index of this network.
   */
  constructor(params) {
    const {networkIndex} = params;

    if (isNaN(networkIndex)) {
      throw new Error('networkIndex is not a number');
    }

    super(params);

    /**
     * Index of the network in which this connection part resides.
     * @type {number}
     */
    this.networkIndex = networkIndex;
  }

  /**
   * Provides a key string for D3 data binding.
   * @return {string} Key for identifying this object in the visualization.
   * @see https://devdocs.io/d3~4/d3-selection#selection_data
   */
  getKey() {
    return `${this.getClassName()}-${this.networkIndex}`;
  }

  /**
   * Update element by setting group's `data-network-index` attribute.
   *
   * @param {SVGGElement} groupElement Group element for this node.
   */
  update(groupElement) {
    super.update(groupElement);
    d3.select(groupElement).attr('data-network-index', this.networkIndex);
  }
}
