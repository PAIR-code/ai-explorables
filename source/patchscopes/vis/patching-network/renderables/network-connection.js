/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Connections between patching network nodes.
 */

import {NetworkNode} from './network-node.js';
import {Renderable} from './renderable.js';

/**
 * Directional connector between two nodes.
 */
export class NetworkConnection extends Renderable {
  /**
   * @param {object} params Object containing constructor parameters.
   * @param {NetworkNode} params.fromNode Start point of connection.
   * @param {NetworkNode} params.toNode End point of connection.
   */
  constructor(params) {
    const {fromNode, toNode} = params;

    if (!(fromNode instanceof NetworkNode)) {
      throw new Error('fromNode must be a network node');
    }

    if (!(toNode instanceof NetworkNode)) {
      throw new Error('toNode must be a network node');
    }

    super(params);

    /**
     * Start point of this network connection.
     * @type {NetworkNode}
     */
    this.fromNode = fromNode;

    /**
     * End point of this network connection.
     * @type {NetworkNode}
     */
    this.toNode = toNode;

    // Append specific internal attributes.
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

    // Expose `fromNode` and `toNode` var states.
    this.varStates.push(
      ...this.fromNode.varStates.map((varState) => `from-${varState}`),
      ...this.toNode.varStates.map((varState) => `to-${varState}`),
    );
  }

  /**
   * Provides a key string for D3 data binding.
   * @return {string} Key for identifying this object in the visualization.
   * @see https://devdocs.io/d3~4/d3-selection#selection_data
   */
  getKey() {
    return [
      this.getClassName(),
      'from',
      this.fromNode.getKey(),
      'to',
      this.toNode.getKey(),
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
   * Compute the straight line from the end of the `from` node to the start of
   * the `to` node, just outside the padding of each.
   *
   * Diagram from node 1 to node 2:
   *
   * ```
   *   +---+
   *   | 1 | a ,
   *   +---+    \
   *             \
   *              \
   *               \    +---+
   *                ` h | 2 |
   *                    +---+
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
    const {fromNode, toNode} = this;

    const aX =
      fromNode.columnConfig.left +
      fromNode.columnConfig.marginLeft +
      fromNode.columnConfig.paddingLeft +
      fromNode.columnConfig.width +
      fromNode.columnConfig.paddingRight;
    const aY = fromNode.rowConfig.getCenterY();

    const bX = toNode.columnConfig.left + toNode.columnConfig.marginLeft;
    const bY = toNode.rowConfig.getCenterY();

    return `M ${aX},${aY} L ${bX},${bY}`;
  }
}
