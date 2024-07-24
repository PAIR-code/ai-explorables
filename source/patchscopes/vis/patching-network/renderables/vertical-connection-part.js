/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Forms the vertical part of an intra-network connection.
 */

import {ConnectionPart} from './connection-part.js';
import {mix} from '../../../lib/mix.js';

/**
 * Part of a connection between nodes.
 */
export class VerticalConnectionPart extends ConnectionPart {
  /**
   * Compute the straight line vertically between columns at their midpoint.
   *
   * Diagram:
   *
   * ```
   *             d
   *   +---+     |     +---+
   *   | 1 | a   |   b | 2 |
   *   +---+     |     +---+
   *             e
   * ```
   *
   * Point descriptions:
   *
   *  - `a` - Exit point of node 1.
   *  - `b` - Entry point of node 2.
   *  - `d` - Top of line, at top of row config.
   *  - `e` - Bottom of line, at bottom of row config.
   *
   * @returns {string} `d` attribute for charachteristic curve specification.
   */
  getPath() {
    const {leftColumnConfig, rowConfig} = this;
    const {nextNetworkColumnConfig} = leftColumnConfig;

    if (!nextNetworkColumnConfig) {
      throw new Error('nextNetworkColumnConfig missing');
    }

    const aX =
      leftColumnConfig.left +
      leftColumnConfig.marginLeft +
      leftColumnConfig.paddingLeft +
      leftColumnConfig.width +
      leftColumnConfig.paddingRight;

    const bX =
      nextNetworkColumnConfig.left + nextNetworkColumnConfig.marginLeft;

    const dX = mix(aX, bX, 0.5);
    const dY = rowConfig.top;

    const eY = dY + rowConfig.getTotalHeight();

    return `M ${dX},${dY} V ${eY}`;
  }
}
