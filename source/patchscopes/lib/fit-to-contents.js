/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Fit an SVG element to its root group's contents.
 */

import {getContentsRect} from './get-contents-rect.js';

/**
 * Fit the SVG to the contents of the root group and set the root group's
 * transform to translate it to align with the SVG.
 * @param {SVGSVGElement} svgElement SVG element to fit.
 * @param {object} margin Object specifying margins around the root group.
 * @param {number} margin.bottom Bottom margin in pixels.
 * @param {number} margin.left Left margin in pixels.
 * @param {number} margin.right Right margin in pixels.
 * @param {number} margin.top Top margin in pixels.
 * @param {Element|string} rootGroupElementOrSelector Root or selector for it.
 * @param {Element|string} contentGroupElementOrSelector Optional content
 * element or selector under the root element to use for sizing.
 */
export function fitToContents(
  svgElement,
  margin = {},
  rootGroupElementOrSelector = '[data-role="root"]',
  contentGroupElementOrSelector = undefined,
) {
  const marginBottom = margin.bottom ?? 0;
  const marginLeft = margin.left ?? 0;
  const marginRight = margin.right ?? 0;
  const marginTop = margin.top ?? 0;

  const rootElement =
    rootGroupElementOrSelector instanceof Element
      ? rootGroupElementOrSelector
      : svgElement.querySelector(rootGroupElementOrSelector);
  if (!rootElement) {
    throw new Error('root group element missing');
  }

  const contentElement =
    contentGroupElementOrSelector instanceof Element
      ? contentGroupElementOrSelector
      : typeof contentGroupElementOrSelector === 'string'
        ? rootElement.querySelector(contentGroupElementOrSelector)
        : rootElement;
  if (!contentElement) {
    throw new Error('content element missing');
  }

  // Determine SVG bounding rect.
  const svgRect = svgElement.getBoundingClientRect();

  // Determine content node's bounding rect and its contents bounding rect.
  const contentElementSelfRect = contentElement.getBoundingClientRect();
  const contentElementContentsRect = getContentsRect(contentElement);

  // Compute the current offset left and top values.
  const currentOffsetLeft = +rootElement.getAttribute('data-offset-left');
  const currentOffsetTop = +rootElement.getAttribute('data-offset-top');

  // Compute the left, top, width and height of the root contents, adjusting
  // for the current offset.
  const contentsLeft = contentElementSelfRect.left - currentOffsetLeft;
  const contentsTop = contentElementSelfRect.top - currentOffsetTop;
  const contentsHeight = isFinite(contentElementContentsRect.height)
    ? contentElementContentsRect.height
    : 0;
  const contentsWidth = isFinite(contentElementContentsRect.width)
    ? contentElementContentsRect.width
    : 0;

  // Stretch SVG element to fit contents plus room for margins.
  const fullHeight = contentsHeight + marginBottom + marginTop;
  const fullWidth = contentsWidth + marginLeft + marginRight;
  svgElement.setAttribute('height', fullHeight);
  svgElement.setAttribute('width', fullWidth);

  // Shift root group element to align with SVG, plus margins.
  //
  // Example showing hypothetical top-left corner of SVG at (90,30) and two
  // hypothetical top-left corners of the contents rect at (60,100) and (150,
  // 150).
  //
  // ```
  //   ......................................................................
  //   .
  //   .
  //   .              svg (90, 30)
  //   .                  +----------------------------------------------
  //   .                  | offset: (svg.x - cr.x, svg.y - cr.y)
  //   .                  |
  //   .                  |
  //   .          *       |
  //   .  cr (60, 100)    |
  //   .                  |
  //   .                  |
  //   .                  |                 *
  //   .                  |            cr (150, 150)
  //   .                  |
  // ```
  const offsetLeft = svgRect.left - contentsLeft + marginLeft;
  const offsetTop = svgRect.top - contentsTop + marginTop;
  rootElement.setAttribute('data-offset-left', offsetLeft);
  rootElement.setAttribute('data-offset-top', offsetTop);
  rootElement.setAttribute(
    'transform',
    `translate(${offsetLeft}, ${offsetTop})`,
  );
}
