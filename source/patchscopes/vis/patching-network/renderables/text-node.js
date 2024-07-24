/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Base node for displayed text.
 */

import {NetworkNode} from './network-node.js';

/**
 * Node representing an input token, input token range, output token or other
 * text label.
 */

export class TextNode extends NetworkNode {
  /**
   * @param {object} params Object containing constructor parameters.
   * @param {string} params.text Optional text of the input token.
   */
  constructor(params) {
    super(params);

    /**
     * Text of the node. May be undefined if unknown.
     * @type {string|undefined}
     */
    this.text = params.text;

    // Append text-specific internal attributes.
    this.internalAttributes.push(
      'dominant-baseline',
      'font-family',
      'font-size',
      'font-style',
      'font-weight',
      'text-anchor',
      'text-color',
      'transform',
    );
  }

  /**
   * @param {SVGGElement} groupElement Group element parent of this renderable.
   */
  enter(groupElement) {
    d3.select(groupElement).append('g');
  }

  /**
   * @param {SVGGElement} groupElement Group element into which to render.
   */
  update(groupElement) {
    super.update(groupElement);

    // Key function for D3 data binding.
    const keyFn = (elementOrTextNode) => {
      if (elementOrTextNode instanceof TextNode) {
        return elementOrTextNode.getText();
      }
      if (elementOrTextNode instanceof Element) {
        const key = elementOrTextNode.getAttribute('data-text');
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
      .select('g')
      .style('transform', 'var(--_transform)')
      .selectAll('text')
      .data([this], keyFn);

    textUpdateSel
      .enter()
      .append('text')
      .classed('visible', true)
      .attr('data-text', (textNode) => textNode.getText())
      .style('dominant-baseline', 'var(--_dominant-baseline)')
      .style('fill', 'var(--_text-color)')
      .style('font-family', 'var(--_font-family)')
      .style('font-size', 'var(--_font-size)')
      .style('font-style', 'var(--_font-style)')
      .style('font-weight', 'var(--_font-weight)')
      .style('text-anchor', 'var(--_text-anchor)')
      .text((textNode) => textNode.getText());

    // TODO(jimbo): Make transition duration configurable.
    textUpdateSel
      .exit()
      .classed('visible', false)
      .attr('x', 3)
      .attr('y', 3)
      .transition()
      .remove();
  }

  /**
   * Returns the raw text if any. Should be overridden by child classes.
   * @returns {string|undefined} The text for this node.
   */
  getText() {
    return this.text;
  }
}
