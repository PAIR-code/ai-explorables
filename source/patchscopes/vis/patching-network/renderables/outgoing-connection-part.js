/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Forms the outbound part of an intra-network connection.
 */

import {
  ConnectionPart,
  INTRA_NETWORK_CURVE_CONTROL_POINT_ALPHA,
} from './connection-part.js';
import {mix} from '../../../lib/mix.js';

/**
 * Outgoing part of a connection between nodes.
 */
export class OutgoingConnectionPart extends ConnectionPart {
  /**
   * Compute the curved connection part leaving a node and pointing downwards.
   *
   * Diagram:
   *
   * ```
   *   +---+                    +---+
   *   | 1 | a ----,  b       h | 2 |
   *   +---+        \  c        +---+
   *                 \
   *                   d
   * ```
   *
   * Point descriptions:
   *
   *  - `a` - Start of curve at exit point of node 1.
   *  - `b` - Curve's first cubic Bezier control point.
   *  - `c` - Curve's second cubic Bezier control point.
   *  - `d` - End of curve, at the bottom edge of row.
   *  - `h` - Entry point of node 2.
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
    const aY = rowConfig.getCenterY();

    const hX =
      nextNetworkColumnConfig.left + nextNetworkColumnConfig.marginLeft;

    const dX = mix(aX, hX, 0.5);
    const dY = rowConfig.top + rowConfig.getTotalHeight();

    const bX = mix(aX, dX, INTRA_NETWORK_CURVE_CONTROL_POINT_ALPHA);
    const bY = aY;

    const cX = dX;
    const cY = mix(aY, dY, 1 - INTRA_NETWORK_CURVE_CONTROL_POINT_ALPHA);

    return `M ${aX},${aY} C ${bX},${bY} ${cX},${cY} ${dX},${dY}`;
  }
}
