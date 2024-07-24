/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Forms part of an intra-network connection.
 */

import {NetworkColumnConfig} from '../config/network-column-config.js';
import {NetworkRowConfig} from '../config/network-row-config.js';
import {NetworkIndexRenderable} from './network-index-renderable.js';

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
export const INTRA_NETWORK_CURVE_CONTROL_POINT_ALPHA = 0.75;

/**
 * Directional connector between two nodes.
 */
export class ConnectionPart extends NetworkIndexRenderable {
  /**
   * @param {object} params Object containing constructor parameters.
   * @param {NetworkRowConfig} params.rowConfig Row holding connection part.
   * @param {NetworkColumnConfig} params.leftColumnConfig
   */
  constructor(params) {
    const {rowConfig, leftColumnConfig} = params;

    if (!(rowConfig instanceof NetworkRowConfig)) {
      throw new Error('rowConfig missing or malformed');
    }

    if (!(leftColumnConfig instanceof NetworkColumnConfig)) {
      throw new Error('leftColumnConfig missing or malformed');
    }

    super(params);

    /**
     * Config for the row that contains this connection part.
     * @type {NetworkRowConfig}
     */
    this.rowConfig = rowConfig;

    /**
     * Left-hand side column config for this connection part. That column
     * config's `nextNetworkColumnConfig` property is the other, right-hand side
     * of the connection.
     * @type {NetworkColumnConfig}
     */
    this.leftColumnConfig = leftColumnConfig;

    // Append specific internal attributes. Not all connection parts will have a
    // visible arrow head.
    this.internalAttributes.push(
      // Fill color of the arrow body. Generally this should be none/null, since
      // the curved arrow path is meant to have stroke only.
      'arrow-body-fill-color',

      // Stroke color of the arrow body path.
      'arrow-body-stroke-color',

      // Dasharray of the arrow body path.
      'arrow-body-stroke-dasharray',

      // Linecap of the arrow body path.
      'arrow-body-stroke-linecap',

      // Stroke width of the arrow body path.
      'arrow-body-stroke-width',

      // Fill color of the arrow head. The arrow head itself has no stroke.
      'arrow-head-fill-color',

      // Styles the width of the `<path>` whose `marker-end` contains the arrow
      // head. This allows independent sizing of the arrow head from the
      // arrow-body.
      'arrow-head-stroke-width',

      // Transition timing.
      'arrow-body-fill-transition',
      'arrow-body-stroke-transition',
      'arrow-body-transition',
      'arrow-head-fill-transition',
      'arrow-head-stroke-transition',
      'arrow-head-transition',
      'transition',
    );
  }

  /**
   * Provides a key string for D3 data binding.
   * @return {string} Key for identifying this object in the visualization.
   * @see https://devdocs.io/d3~4/d3-selection#selection_data
   */
  getKey() {
    return [
      super.getKey(),
      this.leftColumnConfig.columnIndex,
      this.rowConfig.rowIndex,
    ].join('-');
  }

  /**
   * Handle entering element.
   * @param {SVGGElement} groupElement Group element for this node.
   */
  enter(groupElement) {
    super.enter(groupElement);

    const groupSel = d3.select(groupElement);

    // Since there may be multiple visualizations on the page, and since
    // `marker-end` requires an id, we ensure our id is unique by including
    // randomness.
    const idPrefix = Math.random().toString(16).substring(2, 8);
    const arrowHeadMarkerId = `id-${idPrefix}-arrow-head-marker`;

    // Append arrow head marker.
    //
    // ```
    //      A -                                      A = 0,0
    //        \\\\\-                                 B = 12,6
    //          \\\\\\\\\-                           C = 0,12
    //            \\\\\\\\\\\\-                      D = 5,6
    //              \\\\\\\\\\\\\\\\\-
    //   -------------\\\---+ \\\\\\\\\\\\\-
    //     path->       D   | R > > > > > > > > B
    //   -------------///---+ /////////////-
    //              /////////////////-
    //            ////////////-                      R = 6,6 (refX, refY)
    //          /////////-
    //        /////-
    //      C -
    // ```
    groupSel
      .append('marker')
      .attr('id', arrowHeadMarkerId)
      .attr('viewBox', '0 0 12 12')
      .attr('refX', '6')
      .attr('refY', '6')
      .attr('markerUnits', 'strokeWidth')
      .attr('markerWidth', '6')
      .attr('markerHeight', '6')
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0,0 L 12,6 L 0,12 L 5,6 z')
      .style('fill', 'var(--_arrow-head-fill-color)')
      .style(
        'transition',
        `fill var(--_arrow-head-fill-transition, var(--_arrow-head-transition, var(--_transition)))`,
      );

    // Append two `<path>` elements for the connection. One for the body (shaft)
    // of the arrow, and the other for the arrow head.
    groupSel
      .append('g')
      .selectAll('path')
      .data(['arrow-body', 'arrow-head'])
      .enter()
      .append('path')
      .attr('data-role', (role) => role);

    groupSel
      .select('[data-role="arrow-body"]')
      .style('fill', 'var(--_arrow-body-fill-color)')
      .style('stroke', 'var(--_arrow-body-stroke-color)')
      .style('stroke-dasharray', 'var(--_arrow-body-stroke-dasharray)')
      .style('stroke-linecap', 'var(--_arrow-body-stroke-linecap)')
      .style('stroke-width', 'var(--_arrow-body-stroke-width)')
      .style(
        'transition',
        [
          'fill var(--_arrow-body-fill-transition, var(--_arrow-body-transition, var(--_transition)))',
          'stroke var(--_arrow-body-stroke-transition, var(--_arrow-body-transition, var(--_transition)))',
          'stroke-dasharray var(--_arrow-body-stroke-transition, var(--_arrow-body-transition, var(--_transition)))',
          'stroke-width var(--_arrow-body-stroke-transition, var(--_arrow-body-transition, var(--_transition)))',
        ].join(','),
      );

    // The arrow head `<path>` is invisible, except for the actual arrow head
    // `<marker>` element set by the `marker-end` attribute. However, the path's
    // `stroke-width` determines how large the arrow head will be. This is why
    // we use two paths rather than just one. Having a separate, invisible path
    // for the arrow head allows us to control the stroke width of the
    // arrow-body from the size of the arrow head.
    groupSel
      .select('[data-role="arrow-head"]')
      .style('marker-end', `url(#${arrowHeadMarkerId})`)
      .style('fill', 'none')
      .style('stroke-width', 'var(--_arrow-head-stroke-width)')
      .style(
        'transition',
        'var(--_arrow-head-stroke-transition, var(--_arrow-head-transition, var(--_transition)))',
      );
  }

  /**
   * Update element. When run, this method updates the arrow-body and arrow-head
   * `<path>` elements under the to have the appropriate kind of curve between
   * nodes.
   *
   * @param {SVGGElement} groupElement Group element for this node.
   */
  update(groupElement) {
    super.update(groupElement);
    d3.select(groupElement)
      .selectAll('path[data-role^="arrow-"]')
      .attr('d', this.getPath());
  }

  /**
   * Compute the straight line across the row from the left column config to its
   * next column config.
   *
   * Diagram from node 1 to node 2:
   *
   * ```
   *   +---+            +---+
   *   | 1 | a ------ b | 2 |
   *   +---+            +---+
   * ```
   *
   * Point descriptions:
   *
   *  - `a` - Start point at edge + right padding of node 1.
   *  - `b` - End point at edge - left padding of node 2.
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

    const bX =
      nextNetworkColumnConfig.left + nextNetworkColumnConfig.marginLeft;

    return `M ${aX},${aY} H ${bX}`;
  }
}
