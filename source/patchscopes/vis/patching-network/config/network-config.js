/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Configuration for a transformer network.
 */

import {NetworkColumnConfig} from './network-column-config.js';
import {NetworkRowConfig} from './network-row-config.js';

/**
 * A transformer network diagram shows how token influence flows through the
 * layers from left to right. It also may show auto-regressive influence via
 * arrows between token rowConfigs.
 *
 * Here's an example:
 *
 * ```
 *                  l= 00  01  02  03  04  05        39
 *    "<s>":i=00 ⇨ ▶ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ... ⇨ ◯ ⇨ ◁ ⟶ ___
 *                       ╲   ╲   ╲   ╲   ╲
 *    "Jur":i=01 ⇨ ▶ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ... ⇨ ◯ ⇨ ◁ ⟶ ___
 *                       ╲   ╲   ╲   ╲   ╲
 *    [i=02..03] ⇨ ▶ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ... ⇨ ◯ ⇨ ◁ ⟶ ___
 *                       ╲   ╲   ╲   ╲   ╲
 *   "Park":i=04 ⇨ ▶ ⇨ ◯ ⇨ ◉ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ... ⇨ ◯ ⇨ ◁ ⟶ ___
 * ```
 *
 * To render such a diagram, at minimum we need:
 *
 * - For each row:
 *  - Input side: position index or range, token string (optional)
 *  - Output side: token string (optional)
 * - For each column of hidden state vectors (circles):
 *  - Layer index or range
 * - For whole diagram:
 *  - Whether to show embedding trapezoids
 *  - Whether to show horizontal, layer-to-layer arrows
 *  - Whether to show curved, auto-regression arrows
 *  -
 *
 */
export class NetworkConfig {
  constructor() {
    /**
     * Array of network column configurations.
     * @type {NetworkColumnConfig[]}
     */
    this.columnConfigs = [];

    /**
     * Margin below the network in pixels.
     * @type {number}
     */
    this.marginBottom = 0;

    /**
     * Margin above the network in pixels.
     * @type {number}
     */
    this.marginTop = 0;

    /**
     * Array of network row configurations.
     * @type {NetworkRowConfig[]}
     */
    this.rowConfigs = [];

    /**
     * Top of this network in pixels.
     * @type {number}
     */
    this.top = 0;
  }

  /**
   * @returns An object with the same numeric values.
   */
  clone() {
    const cloneConfig = new (Object.getPrototypeOf(this).constructor)();
    cloneConfig.marginBottom = this.marginBottom;
    cloneConfig.marginTop = this.marginTop;
    cloneConfig.top = this.top;
    return cloneConfig;
  }
  /**
   * @returns Total height of the network in pixels, including margins.
   */
  getTotalHeight() {
    const lastRowConfig = this.rowConfigs[this.rowConfigs.length - 1];
    return (
      this.marginTop +
      lastRowConfig.top +
      lastRowConfig.getTotalHeight() +
      this.marginBottom
    );
  }

  /**
   * Append a network column config.
   * @param {NetworkColumnConfig} networkColumnConfig
   */
  appendColumnConfig(networkColumnConfig) {
    // Setup next/previous links, if any.
    const previousNetworkColumnConfig =
      this.columnConfigs[this.columnConfigs.length - 1];
    if (previousNetworkColumnConfig) {
      networkColumnConfig.left =
        previousNetworkColumnConfig.left +
        previousNetworkColumnConfig.getTotalWidth();
      previousNetworkColumnConfig.nextNetworkColumnConfig = networkColumnConfig;
      networkColumnConfig.previousNetworkColumnConfig =
        previousNetworkColumnConfig;
    }

    networkColumnConfig.columnIndex = this.columnConfigs.length;
    this.columnConfigs.push(networkColumnConfig);
  }

  /**
   * Append a network row config.
   * @param {NetworkRowConfig} networkRowConfig
   */
  appendRowConfig(networkRowConfig) {
    // Setup next/previous links, if any.
    const previousNetworkRowConfig =
      this.rowConfigs[this.rowConfigs.length - 1];
    if (previousNetworkRowConfig) {
      networkRowConfig.top =
        previousNetworkRowConfig.top +
        previousNetworkRowConfig.getTotalHeight();
      previousNetworkRowConfig.nextNetworkRowConfig = networkRowConfig;
      networkRowConfig.previousNetworkRowConfig = previousNetworkRowConfig;
    } else {
      networkRowConfig.top = this.top + this.marginTop;
    }

    networkRowConfig.rowIndex = this.rowConfigs.length;
    this.rowConfigs.push(networkRowConfig);
  }
}
