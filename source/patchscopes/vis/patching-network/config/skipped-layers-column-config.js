/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Configuration for a column representing skipped network layers.
 */

import {LayerColumnConfig} from './layer-column-config.js';

/**
 * Column config for a column of skipped network layer ellipses.
 */
export class SkippedLayersColumnConfig extends LayerColumnConfig {
  constructor() {
    super();

    /**
     * Inclusive start of skipped layer range.
     * @type {number}
     */
    this.startLayerIndex = 0;

    /**
     * Inclusive end of skipped layer range.
     * @type {number}
     */
    this.endLayerIndex = 0;
  }
}
