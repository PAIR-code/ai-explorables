import {NetworkNode} from './network-node.js';

/**
 * Node representing the token unembedding, visualized as a reverse trapezoid.
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

export class UnembeddingNode extends NetworkNode {
  /**
   * @param {object} params Object containing constructor parameters.
   * @param {boolean} params.hasOutput Whether this row has output text.
   */
  constructor(params) {
    super(params);

    // Append text-specific internal attributes.
    this.internalAttributes.push(
      'fill-color',
      'stroke-color',
      'stroke-dasharray',
      'stroke-width',
      'transform',
    );

    if (!params.hasOutput) {
      this.varStates.unshift('no-output');
    }
  }

  /**
   * @param {SVGGElement} groupElement Group element for node.
   */
  enter(groupElement) {
    super.enter(groupElement);
    d3.select(groupElement)
      .append('g')
      .append('path')
      .attr('d', TRAPEZOID_PATH_D);
  }

  /**
   * @param {SVGGElement} groupElement Group element for node.
   */
  update(groupElement) {
    super.update(groupElement);
    d3.select(groupElement)
      .select('g')
      .style('transform', 'var(--_transform)')
      .select('path')
      .style('fill', 'var(--_fill-color)')
      .style('stroke', 'var(--_stroke-color)')
      .style('stroke-dasharray', 'var(--_stroke-dasharray)')
      .style('stroke-width', 'var(--_stroke-width)');
  }
}
