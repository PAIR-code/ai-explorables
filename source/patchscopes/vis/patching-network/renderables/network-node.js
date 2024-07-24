/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Node types in a patching network.
 */

import {NetworkColumnConfig} from '../config/network-column-config.js';
import {NetworkRowConfig} from '../config/network-row-config.js';
import {NetworkIndexRenderable} from './network-index-renderable.js';

/**
 * Base class for all network nodes such as hidden state vector dots,
 * embedding/unembedding trapezoids and input/output tokens.
 */
export class NetworkNode extends NetworkIndexRenderable {
  /**
   * @param {object} params Object containing constructor parameters.
   * @param {NetworkColumnConfig} params.columnConfig Column config for cell.
   * @param {NetworkRowConfig} params.rowConfig Row config for this node's cell.
   */
  constructor(params) {
    const {columnConfig, rowConfig} = params;

    if (!columnConfig) {
      throw new Error('column config missing');
    }

    if (!rowConfig) {
      throw new Error('row config missing');
    }

    super(params);

    /**
     * Configuration for this network column.
     * @type {NetworkColumnConfig}
     */
    this.columnConfig = columnConfig;

    /**
     * Configuration for this network row.
     * @type {NetworkRowConfig}
     */
    this.rowConfig = rowConfig;
  }

  /**
   * Provides a key string for D3 data binding. Should be overridden as needed
   * in specific child classes.
   * @return {string} Key for identifying this object in the visualization.
   * @see https://devdocs.io/d3~4/d3-selection#selection_data
   */
  getKey() {
    return [
      super.getKey(),
      this.columnConfig.columnIndex,
      this.rowConfig.rowIndex,
    ].join('-');
  }

  /**
   * Transform the group element to the row/column config location. Child class
   * implementations should call this via `super.update()`.
   * @param {SVGGElement} groupElement Group element for this node.
   */
  update(groupElement) {
    super.update(groupElement);
    const x = this.columnConfig.getCenterX();
    const y = this.rowConfig.getCenterY();
    d3.select(groupElement).attr('transform', `translate(${x},${y})`);
  }
}
