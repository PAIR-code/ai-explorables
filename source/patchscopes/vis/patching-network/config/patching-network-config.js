/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Configuration for a patching transformer network.
 */

import {NetworkConfig} from './network-config.js';

/**
 * A patching network diagram consists of one or more tranformer network
 * diagrams, stacked top to bottom. Typically, this will include two networks:
 * the source and the target.
 *
 * Here's an example:
 *
 * ```
 *                  l= 00  01  02  03  04  05        39
 *    "<s>":i=00 ⇨ ▶ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ... ⇨ ◯ ⇨ ◁ ⟶ ___
 *    "Jur":i=01 ⇨ ▶ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ... ⇨ ◯ ⇨ ◁ ⟶ ___
 *    "ass":i=02 ⇨ ▶ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ... ⇨ ◯ ⇨ ◁ ⟶ ___
 *     "ic":i=03 ⇨ ▶ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ... ⇨ ◯ ⇨ ◁ ⟶ ___
 *   "Park":i=04 ⇨ ▶ ⇨ ◯ ⇨ ◉ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ... ⇨ ◯ ⇨ ◁ ⟶ ___
 *   -----------------------\-----------------------------------------
 *    "<s>":i=00 ⇨ ▶ ⇨ ◯ ⇨ ◯|⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ... ⇨ ◯ ⇨ ◁ ⟶ ___
 *     "Sy":i=01 ⇨ ▶ ⇨ ◯ ⇨ ◯|⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ... ⇨ ◯ ⇨ ◁ ⟶ ___
 *    "ria":i=02 ⇨ ▶ ⇨ ◯ ⇨ Ø ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ... ⇨ ◯ ⇨ ◁ ⟶ ___
 *      ":":i=03 ⇨ ▶ ⇨ ◯ ⇨|◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ... ⇨ ◯ ⇨ ◁ ⟶ ___
 *    [i=04..36] ⇨ ▶ ⇨ ◯ ⇨\◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ... ⇨ ◯ ⇨ ◁ ⟶ ___
 *      "X":i=37 ⇨ ▶ ⇨ ◯ ⇨ ◉ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ... ⇨ ◯ ⇨ ◀ ⟶ "Ge"
 *      ...:i=38 ⇨ ▶ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ... ⇨ ◯ ⇨ ◀ ⟶ "un"
 *      ...:i=38 ⇨ ▶ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ... ⇨ ◯ ⇨ ◀ ⟶ "he"
 *      ...:i=39 ⇨ ▶ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ◯ ⇨ ... ⇨ ◯ ⇨ ◀ ⟶ ":"
 * ```
 *
 */
export class PatchingNetworkConfig {
  constructor() {
    /**
     * Array of network configurations.
     * @type {NetworkConfig[]}
     */
    this.networkConfigs = [];

    /**
     * Margin below the patching network in pixels.
     * @type {number}
     */
    this.marginBottom = 0;

    /**
     * Margin above the patching network in pixels.
     * @type {number}
     */
    this.marginTop = 0;
  }

  /**
   * @param {NetworkConfig} networkConfig The network config to append.
   */
  appendNetworkConfig(networkConfig) {
    const previousNetworkConfig =
      this.networkConfigs[this.networkConfigs.length - 1];
    if (previousNetworkConfig) {
      networkConfig.top = previousNetworkConfig.getTotalHeight();
    }
    this.networkConfigs.push(networkConfig);
  }
}
