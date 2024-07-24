/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Nodes representing hidden state vectors.
 */

import {NetworkNode} from './network-node.js';
const CORNER_RADIUS = '8'; //For compatibility with svg attributes

/**
 * Node representing a hidden state vector, visualized as a circle.
 */

export class HiddenStateVectorNode extends NetworkNode {
  /**
   * @param {object} params Object containing constructor parameters.
   * @param {number} params.layerIndex Index of layer for which this is output.
   */
  constructor(params) {
    const {layerIndex} = params;

    if (isNaN(layerIndex)) {
      throw new Error('layerIndex missing');
    }

    super(params);

    /**
     * Index of the layer for which this is the output.
     * @type {number}
     */
    this.layerIndex = layerIndex;

    // Append specific internal attributes.
    this.internalAttributes.push(
      'fill-color',
      'fill-transition',
      'corner-radius-x',
      'corner-radius-y',
      'shape-transition',
      'stroke-color',
      'stroke-dasharray',
      'stroke-width',
      'stroke-transition',
      'transition',
    );
  }

  /**
   * Provides a key string for D3 data binding.
   * @return {string} Key for identifying this object in the visualization.
   * @see https://devdocs.io/d3~4/d3-selection#selection_data
   */
  getKey() {
    return `${super.getKey()}-${this.layerIndex}`;
  }

  /**
   * Handle entering element.
   * @param {SVGGElement} groupElement Group element for this node.
   */
  enter(groupElement) {
    super.enter(groupElement);
    d3.select(groupElement).append('rect');
  }

  /**
   * Update element.
   * @param {SVGGElement} groupElement Group element for this node.
   */
  update(groupElement) {
    super.update(groupElement);
    d3.select(groupElement)
      .select('rect')
      .attr('x', -this.columnConfig.width * 0.5)
      .attr('y', -this.rowConfig.height * 0.5)
      .attr('rx', CORNER_RADIUS)
      .attr('ry', CORNER_RADIUS)
      .attr('width', this.columnConfig.width)
      .attr('height', this.rowConfig.height)
      .style('fill', 'var(--_fill-color, transparent)')
      .style('stroke', 'var(--_stroke-color, transparent)')
      .style('stroke-dasharray', 'var(--_stroke-dasharray)')
      .style('stroke-width', 'var(--_stroke-width)');
    // TODO(jimbo): Perform transitions, but only after next frame.
    // .style(
    //   'transition',
    //   [
    //     'fill var(--_fill-transition, var(--_transition))',
    //     'rx var(--_shape-transition, var(--_transition))',
    //     'ry var(--_shape-transition, var(--_transition))',
    //     'stroke var(--_stroke-transition, var(--_transition))',
    //     'stroke-dasharray var(--_stroke-transition, var(--_transition))',
    //     'stroke-width var(--_stroke-transition, var(--_transition))',
    //   ].join(', '),
    // );
  }
}
