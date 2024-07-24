/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Nodes representing input re-used from previous output.
 */

import {NetworkNode} from './network-node.js';

/**
 * Node representing an input token taking its value from the previous output.
 */
export class ReusedTokenNode extends NetworkNode {
  /**
   * @param {object} params Object containing constructor parameters.
   */
  constructor(params) {
    super(params);

    // Append specific internal attributes.
    this.internalAttributes.push(
      'fill-color',
      'stroke-color',
      'stroke-dasharray',
      'stroke-width',
    );
  }

  /**
   * Handle entering element.
   * @param {SVGGElement} groupElement Group element for this node.
   */
  enter(groupElement) {
    super.enter(groupElement);
    d3.select(groupElement).append('path');
  }

  /**
   * Update element.
   * @param {SVGGElement} groupElement Group element for this node.
   */
  update(groupElement) {
    super.update(groupElement);
    d3.select(groupElement)
      .select('path')
      .attr('d', this.getPath())
      .style('fill', 'var(--_fill-color, transparent)')
      .style('stroke', 'var(--_stroke-color, transparent)')
      .style('stroke-dasharray', 'var(--_stroke-dasharray)')
      .style('stroke-width', 'var(--_stroke-width)');
  }

  /**
   * Compute the curve showing the token reuse.
   *
   * Diagram:
   *
   * ```
   *    b ,--------- a
   *     /
   *    |
   *     \
   *   c  `--------> d
   * ```
   *
   * @returns {string} `d` attribute for charachteristic curve specification.
   */
  getPath() {
    const {columnConfig, rowConfig} = this;

    const top = -rowConfig.height * 0.5;
    const right = columnConfig.width * 0.5 + columnConfig.paddingRight;

    const aX = right;
    const aY = top;

    const bX = 0;
    const bY = top;

    const rX = rowConfig.height * 0.25;
    const rY = rX;
    const angle = 0;
    const largeArcFlag = 1;
    const sweepFlag = 0; // Counterclockwise.

    const cX = 0;
    const cY = 0;

    const dX = right;
    const dY = 0;

    return [
      `M ${aX},${aY}`,
      `L ${bX},${bY}`,
      `A ${rX} ${rY} ${angle} ${largeArcFlag} ${sweepFlag} ${cX},${cY}`,
      `L ${dX},${dY}`,
    ].join(' ');
  }
}
