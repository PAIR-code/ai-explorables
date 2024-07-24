/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Patch connections between networks.
 */

import {mix} from '../../../lib/mix.js';
import {NetworkConnection} from './network-connection.js';

/**
 * Multiplier on the average margin to stretch the patching S curve
 * horizontally. The larger the value, the further the curve will overshoot both
 * parts of the curve.
 */
const PATCH_CURVE_HORIZONTAL_STRETCH_FACTOR = 3;

/**
 * Controls how near to the patched rows' centers the quadratic control points
 * should appear. A value of 0 means that the control points should be on the
 * row center. A value of 1 means the control points should be on the midpoint
 * between the patched rows. A value of 0.5 puts the control points halfway
 * between each row's center Y and the middle Y between the rows.
 */
const PATCH_CURVE_VERTICAL_CONTROL_POINT_ALPHA = 0.1;

/**
 * Directional connector between two nodes.
 */
export class PatchConnection extends NetworkConnection {
  /**
   * Compute the curve for a patch connection between networks.
   *
   * Curve diagram from node 1 to node 2, showing curve points `a`-`h`:
   *
   * ```
   *                +---+
   *                | 1 | a ,
   *                +---+    \
   *                           \
   *                           |  b
   *                          /
   *                       /
   *                   /
   *               /  c
   *            /
   *         /
   *      d |
   *        \
   *          \    +---+
   *           ` e | 2 |
   *               +---+
   *
   * ```
   *
   *  - `a` - Top curve start point at edge + right padding of node 1.
   *  - `b` - Top curve's quadratic Bezier control point.
   *  - `c` - Midpoint between start and end points.
   *  - `d` - Bottom curve's quadratic Bezier control point.
   *  - `e` - End of bottom curve, at left edge of node 2.
   *
   * NOTE: The X coordinates of control points `b` and `d` are stretched
   * horizontally according to the value of the
   * `PATCH_CURVE_HORIZONTAL_STRETCH_FACTOR`.
   *
   * NOTE: The Y coordinates of control points `b` and `d` are placed according
   * to the `PATCH_CURVE_VERTICAL_CONTROL_POINT_ALPHA`;
   *
   * @returns {string} `d` attribute for patch curve specification.
   */
  getPath() {
    const {fromNode, toNode} = this;

    // Number of columns spanned. More columns means wider S curve.
    const columnIndexSpan =
      Math.abs(
        fromNode.columnConfig.columnIndex - toNode.columnConfig.columnIndex,
      ) + 1;

    // Average the right margin of the `from` node and the left margin of the
    // `to` node. This value will be used to create the symmetrical curve.
    const averageMargin = mix(
      fromNode.columnConfig.marginRight,
      toNode.columnConfig.marginLeft,
      0.5,
    );

    // Compute the control point's horizontal distance from the curve start
    // point.
    const controlPointDistance =
      averageMargin * columnIndexSpan * PATCH_CURVE_HORIZONTAL_STRETCH_FACTOR;

    const aX =
      fromNode.columnConfig.left +
      fromNode.columnConfig.marginLeft +
      fromNode.columnConfig.paddingLeft +
      fromNode.columnConfig.width +
      fromNode.columnConfig.paddingRight;
    const aY = fromNode.rowConfig.getCenterY();

    const eX = toNode.columnConfig.left + toNode.columnConfig.marginLeft;
    const eY = toNode.rowConfig.getCenterY();

    const cX = mix(aX, eX, 0.5);
    const cY = mix(aY, eY, 0.5);

    const bX = aX + controlPointDistance;
    const bY = mix(aY, cY, PATCH_CURVE_VERTICAL_CONTROL_POINT_ALPHA);

    const dX = eX - controlPointDistance;
    const dY = mix(cY, eY, 1 - PATCH_CURVE_VERTICAL_CONTROL_POINT_ALPHA);

    return [
      `M ${aX},${aY}`,
      `Q ${bX},${bY} ${cX},${cY}`,
      `Q ${dX},${dY} ${eX},${eY}`,
    ].join(' ');
  }
}
