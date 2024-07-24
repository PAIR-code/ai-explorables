/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Node for displayed token.
 */

import {TextNode} from './text-node.js';

/**
 * Padding between bounding box of text and background rect.
 */
const TEXT_PADDING_PX = 3;

/**
 * Text to show for tokens that are literal empty strings `""`.
 */
const EMPTY_TOKEN_REPLACEMENT_TEXT = '';

/**
 * String replacements to perform on tokens that consist of all whitespace.
 */
const WHITESPACE_REPLACEMENT_MAP = {
  ' ': '\\s',
  '\r': '\\r',
  '\n': '\\n',
  '\t': '\\t',
};

/**
 * Node representing an input token or output token.
 */
export class TokenNode extends TextNode {
  /**
   * @param {object} params Object containing constructor parameters.
   */
  constructor(params) {
    super(params);

    // Append text-specific internal attributes.
    this.internalAttributes.push(
      'border-radius',
      'fill-color',
      'stroke-color',
      'stroke-width',
    );
  }

  /**
   * @param {SVGGElement} groupElement Group element into which to render.
   */
  enter(groupElement) {
    super.enter(groupElement);
    d3.select(groupElement)
      .select('g')
      .append('rect')
      .style('fill', 'var(--_fill-color)')
      .style('rx', 'var(--_border-radius)')
      .style('ry', 'var(--_border-radius)')
      .style('stroke', 'var(--_stroke-color)')
      .style('stroke-width', 'var(--_stroke-width)');
  }

  /**
   * @param {SVGGElement} groupElement Group element into which to render.
   */
  update(groupElement) {
    super.update(groupElement);

    const groupSel = d3.select(groupElement).select('g');

    const {height, width, x, y} = groupSel
      .select('text:last-of-type')
      .node()
      .getBBox();

    groupSel
      .select('rect')
      .attr('x', x - TEXT_PADDING_PX)
      .attr('y', y - TEXT_PADDING_PX)
      .attr('width', width + TEXT_PADDING_PX * 2)
      .attr('height', height + TEXT_PADDING_PX * 2);
  }

  /**
   * @returns Text for this input node.
   */
  getText() {
    const {text} = this;

    if (text === undefined) {
      // TODO(jimbo): Replace missing input tokens with curved arrows.
      return '...';
    }

    if (text === '') {
      return EMPTY_TOKEN_REPLACEMENT_TEXT;
    }

    if (!/^\s*$/.test(text)) {
      // Not all whitespace.
      return text;
    }

    let replacedText = text;
    for (const [searchString, replacementString] of Object.entries(
      WHITESPACE_REPLACEMENT_MAP,
    )) {
      replacedText = replacedText.replaceAll(searchString, replacementString);
    }

    // Finally, convert any other exotic whitespace into Unicode escape
    // sequences.
    return replacedText.replace(/\s/g, charToUnicode);
  }
}

function charToUnicode(ch) {
  return `\\u${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
}
