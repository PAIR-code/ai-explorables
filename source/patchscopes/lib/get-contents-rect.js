/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Determine the bounding rect for an element's descendants.
 */

/**
 * Find all element's leaf descendants and compute the total bounding client
 * rect. Ignores `<title>` elements, which are for accesibility only.
 * @param {Element} elem The element to descend.
 * @returns {DOMRectReadOnly} Read-only DOM rect.
 */
export function getContentsRect(elem) {
  let bottom = -Infinity;
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  const leaves = elem.querySelectorAll(':not(:has(*)):not(title)');
  for (let i = 0; i < leaves.length; i++) {
    const rect = leaves[i].getBoundingClientRect();
    bottom = rect.bottom > bottom ? rect.bottom : bottom;
    left = rect.left < left ? rect.left : left;
    right = rect.right > right ? rect.right : right;
    top = rect.top < top ? rect.top : top;
  }
  return new DOMRectReadOnly(left, top, right - left, bottom - top);
}
