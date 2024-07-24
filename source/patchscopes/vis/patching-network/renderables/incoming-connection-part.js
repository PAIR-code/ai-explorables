/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Forms the inboind part of an intra-network connection.
 */

import {
  ConnectionPart,
  INTRA_NETWORK_CURVE_CONTROL_POINT_ALPHA,
} from './connection-part.js';
import {mix} from '../../../lib/mix.js';

/**
 * Incoming part of a connection between nodes.
 */
export class IncomingConnectionPart extends ConnectionPart {
  /**
   * Compute the curved connection part entirg a node from above.
   *
   * Diagram:
   *
   * ```
   *                e
   *                 \
   *   +---+       f  \        +---+
   *   | 1 | a       g `---- h | 2 |
   *   +---+                   +---+
   * ```
   *
   * Point descriptions:
   *
   *  - `a` - Exit point of node 1.
   *  - `e` - Curve's start point, at the top edge of row.
   *  - `f` - Curve's first cubic Bezier control point.
   *  - `g` - Curve's second cubic Bezier control point.
   *  - `h` - End of curve at node 2's entry point.
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

    const hX =
      nextNetworkColumnConfig.left + nextNetworkColumnConfig.marginLeft;
    const hY = rowConfig.getCenterY();

    const eX = mix(aX, hX, 0.5);
    const eY = rowConfig.top;

    const fX = eX;
    const fY = mix(eY, hY, INTRA_NETWORK_CURVE_CONTROL_POINT_ALPHA);

    const gX = mix(eX, hX, 1 - INTRA_NETWORK_CURVE_CONTROL_POINT_ALPHA);
    const gY = hY;

    return `M ${eX},${eY} C ${fX},${fY} ${gX},${gY} ${hX},${hY}`;
  }
}
