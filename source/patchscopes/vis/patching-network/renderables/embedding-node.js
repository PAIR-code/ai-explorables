/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Nodes representing token/position embedding procedure.
 */

import {NetworkNode} from './network-node.js';

/**
 * Node representing the token/row embedding, visualized as a trapezoid.
 */

/**
 * `d` attribute for a path drawing a trapezoid.
 *
 * ```
 *     (-4,-5)  +---------+ (4,-5)
 *             /           \
 *            /      +      \
 *           /               \
 *   (-7,5) +-----------------+ (7,5)
 * ```
 *
 * TODO(jimbo): Instead of hard-coding, base size on column and row cofigs.
 */
const TRAPEZOID_PATH_D = `M -4,-5 H 4 L 7,5 H -7 z`;

export class EmbeddingNode extends NetworkNode {
  /**
   * @param {object} params Object containing constructor parameters.
   */
  constructor(params) {
    super(params);

    // Append text-specific internal attributes.
    this.internalAttributes.push(
      'fill-color',
      'fill-transition',
      'stroke-color',
      'stroke-dasharray',
      'stroke-transition',
      'stroke-width',
      'transform',
      'transform-transition',
      'transition',
    );
  }

  /**
   * @param {SVGGElement} groupElement Group element for node.
   */
  enter(groupElement) {
    super.enter(groupElement);
    d3.select(groupElement)
      .append('g')
      .style('transform', 'var(--_transform)')
      .style('transition', 'var(--_transform-transition, var(--_transition))')
      .append('path')
      .attr('d', TRAPEZOID_PATH_D)
      .style('fill', 'var(--_fill-color)')
      .style('stroke', 'var(--_stroke-color)')
      .style('stroke-dasharray', 'var(--_stroke-dasharray)')
      .style('stroke-width', 'var(--_stroke-width)');
    // TODO(jimbo): Perform transitions, but only after next frame.
    //.style(
    //  'transition',
    //  [
    //    'fill var(--_fill-transition, var(--_transition))',
    //    'stroke var(--_stroke-transition, var(--_transition))',
    //    'stroke-dasharray var(--_stroke-transition, var(--_transition))',
    //    'stroke-width var(--_stroke-transition, var(--_transition))',
    //  ].join(', '),
    //);
  }
}
