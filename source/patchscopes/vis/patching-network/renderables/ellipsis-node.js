/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Node of ellipsis to show folded layers/rows.
 */

import {NetworkNode} from './network-node.js';

/**
 * Node representing skipped layers or rows, visualized by an ellipsis.
 */
export class EllipsisNode extends NetworkNode {
  /**
   * @param {object} params Object containing constructor parameters.
   */
  constructor(params) {
    super(params);

    // Append specific internal attributes.
    this.internalAttributes.push(
      'fill-color',
      'radius',
      'stroke-color',
      'stroke-dasharray',
      'stroke-width',
      'transform',
    );
  }

  /**
   * Handle entering element.
   * @param {SVGGElement} groupElement Group element for this node.
   */
  enter(groupElement) {
    super.enter(groupElement);
    d3.select(groupElement)
      .append('g')
      .selectAll('circle')
      .data([-1, 0, 1])
      .enter()
      .append('circle')
      .attr('cx', (x) => 6 * x)
      .attr('r', 2);
  }

  /**
   * Update element.
   * @param {SVGGElement} groupElement Group element for this node.
   */
  update(groupElement) {
    super.update(groupElement);
    d3.select(groupElement)
      .select('g')
      .style('transform', 'var(--_transform)')
      .selectAll('circle')
      .style('fill', 'var(--_fill-color)')
      .style('stroke', 'var(--_stroke-color)')
      .style('stroke-dasharray', 'var(--_stroke-dasharray)')
      .style('stroke-width', 'var(--_stroke-width)');
  }
}
