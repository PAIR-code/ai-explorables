/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Connections between patching network nodes.
 */

import {mix} from '../../../lib/mix.js';
import {NetworkConnection} from './network-connection.js';

/**
 * Determines how tight the characteristic intra-network curve is. A value of 0
 * would make a straight, diagonal line. A value of 1 would be almost almost
 * square (slightly rounded).
 *
 * ```
 *   *---------------------,   1.0
 *     .        @           \
 *       .           @       |
 *         .           @     |
 *           .     0.5   @   |
 *             .             |
 *               .           |
 *                 .       @ |
 *                   .       |
 *                     .     |
 *                 0.0   .   |
 *                         . |
 *                           *
 * ```
 */
const INTRA_NETWORK_CURVE_CONTROL_POINT_ALPHA = 0.75;

/**
 * Directional connector between two nodes.
 */
export class IntraNetworkConnection extends NetworkConnection {
  /**
   * Compute the straight line or characteristic curve for this connection's
   * `<path>` elements.
   *
   * Curve diagram from node 1 to node 2, showing curve points `a`-`h`:
   *
   * ```
   *   +---+
   *   | 1 | a ----,  b
   *   +---+        \  c
   *                 \
   *                  \ d
   *                  |
   *                  |
   *                  |
   *                  |
   *                e  \
   *                    \
   *                  f  \        +---+
   *                   g  `---- h | 2 |
   *                              +---+
   * ```
   *
   * Point descriptions:
   *
   *  - `a` - Top curve start point at edge + right padding of node 1.
   *  - `b` - Top curve's first cubic Bezier control point.
   *  - `c` - Top curve's second cubic Bezier control point.
   *  - `d` - End of top curve, at the bottom edge of node 1's row.
   *  - `e` - Bottom curve's start point, at the top edge of node 2's row.
   *  - `f` - Bottom curve's first cubic Bezier control point.
   *  - `g` - Bottom curve's second cubic Bezier control point.
   *  - `h` - End of bottom curve at edge - left padding of node 2.
   *
   * Note: If node 2's row is the immediate successor to node 1's row, and there
   * is no space between rows, then control points `d` and `e` will be the same.
   *
   * Note: If node 1 and node 2 are on the same row, then the curve will be a
   * straight line from `a` to `h`.
   *
   * @returns {string} `d` attribute for charachteristic curve specification.
   */
  getPath() {
    const {fromNode, toNode} = this;

    const aX =
      fromNode.columnConfig.left +
      fromNode.columnConfig.marginLeft +
      fromNode.columnConfig.paddingLeft +
      fromNode.columnConfig.width +
      fromNode.columnConfig.paddingRight;
    const aY = fromNode.rowConfig.getCenterY();

    const hX = toNode.columnConfig.left + toNode.columnConfig.marginLeft;
    const hY = toNode.rowConfig.getCenterY();

    if (fromNode.rowConfig === toNode.rowConfig) {
      return `M ${aX},${aY} L ${hX},${hY}`;
    }

    const dX = mix(aX, hX, 0.5);
    const dY = fromNode.rowConfig.top + fromNode.rowConfig.getTotalHeight();

    const bX = mix(aX, dX, INTRA_NETWORK_CURVE_CONTROL_POINT_ALPHA);
    const bY = aY;

    const cX = dX;
    const cY = mix(aY, dY, 1 - INTRA_NETWORK_CURVE_CONTROL_POINT_ALPHA);

    const eX = dX;
    const eY = toNode.rowConfig.top;

    const fX = eX;
    const fY = mix(eY, hY, INTRA_NETWORK_CURVE_CONTROL_POINT_ALPHA);

    const gX = mix(eX, hX, 1 - INTRA_NETWORK_CURVE_CONTROL_POINT_ALPHA);
    const gY = hY;

    return [
      `M ${aX},${aY}`,
      `C ${bX},${bY} ${cX},${cY} ${dX},${dY}`,
      `L ${eX},${eY}`,
      `C ${fX},${fY} ${gX},${gY} ${hX},${hY}`,
    ].join(' ');
  }
}
