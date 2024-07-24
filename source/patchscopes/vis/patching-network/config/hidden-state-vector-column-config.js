/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Configuration for a column representing hidden state vectors.
 */

import {LayerColumnConfig} from './layer-column-config.js';

/**
 * Column config for a column of hidden state vector circles.
 */
export class HiddenStateVectorColumnConfig extends LayerColumnConfig {
  constructor() {
    super();

    /**
     * Index of the layer for this hidden state.
     * @type {number}
     */
    this.layerIndex = 0;
  }
}
