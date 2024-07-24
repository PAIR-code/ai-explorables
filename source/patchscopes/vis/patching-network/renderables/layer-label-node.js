/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Node for labeling a network layer.
 */

import {NetworkNode} from './network-node.js';

/**
 * Node that labels a network layer.
 */
export class LayerLabelNode extends NetworkNode {
  /**
   * @param {object} params Object containing constructor parameters.
   * @param {number} params.layerIndex Index of the layer.
   */
  constructor(params) {
    super(params);

    /**
     * Layer index of the node.
     * @type {number}
     */
    this.layerIndex = params.layerIndex;

    // Append text-specific internal attributes.
    this.internalAttributes.push(
      'dominant-baseline',
      'font-family',
      'font-size',
      'font-style',
      'text-anchor',
      'text-color',
    );
  }

  /**
   * @param {SVGGElement} groupElement Group element into which to render.
   */
  update(groupElement) {
    super.update(groupElement);

    // The parent class's `update()` method will move the group element to the
    // center point of this row and column. However, this layer label should be
    // at the top of the row, so on update we move it.
    const x = this.columnConfig.getCenterX();
    const y = this.rowConfig.top;
    d3.select(groupElement).attr('transform', `translate(${x},${y})`);

    // Key function for D3 data binding.
    const keyFn = (elementOrNumber) => {
      if (typeof elementOrNumber === 'number') {
        return elementOrNumber;
      }
      if (elementOrNumber instanceof Element) {
        const key = elementOrNumber.getAttribute('data-text');
        if (key === null) {
          throw new Error('data-text attribute missing');
        }
        return key;
      }
      throw new Error('argument was neither TextNode nor Element');
    };

    // IMPLEMENTATION NOTE: The rationale for binding the text in this way is so
    // that if text changes, a new element is created an the old one removed.
    // This way, if desired, text can fade in/out on change, rather than
    // snapping to the new text.
    const textUpdateSel = d3
      .select(groupElement)
      .selectAll('text')
      .data([this.layerIndex], keyFn);

    const textEnterSel = textUpdateSel
      .enter()
      .append('text')
      .classed('visible', true)
      .attr('x', '-0.25em')
      .attr('data-text', (layerIndex) => layerIndex)
      .style('dominant-baseline', 'var(--_dominant-baseline)')
      .style('fill', 'var(--_text-color)')
      .style('font-family', 'var(--_font-family)')
      .style('font-size', 'var(--_font-size)')
      .style('text-anchor', 'var(--_text-anchor)');

    textEnterSel.append('tspan').text('\u2113');
    textEnterSel
      .append('tspan')
      .attr('dy', '-0.3em')
      .style('baseline-shift', 'super')
      .style('font-size', 'small')
      .text((layerIndex) => layerIndex);

    textEnterSel.selectAll('tspan');

    // TODO(jimbo): Make transition duration configurable.
    textUpdateSel
      .exit()
      .classed('visible', false)
      .attr('x', 3)
      .attr('y', 3)
      .transition()
      .remove();
  }
}
