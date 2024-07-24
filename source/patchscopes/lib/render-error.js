/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Function to render an error into a contaier element.
 */

/**
 * Given an Error, render a visual representation into the specified container
 * element for debugging.
 * @param {Element} containerElem Container element into which to render.
 * @param {Error} error The error to render.
 * @param {string} source Optional source string that caused the error.
 */
export function renderError(containerElem, error, source) {
  const {ownerDocument} = containerElem;
  const errorContainer = ownerDocument.createElement('div');
  errorContainer.setAttribute('data-role', 'error-container');

  const errorHeader = ownerDocument.createElement('strong');
  errorHeader.textContent = 'ERROR';
  errorContainer.appendChild(errorHeader);

  const errorContent = ownerDocument.createElement('pre');
  errorContent.textContent = error.stack ?? error.message;
  errorContainer.appendChild(errorContent);

  if (source !== undefined) {
    const errorSourceHeader = ownerDocument.createElement('strong');
    errorSourceHeader.textContent = 'Source';
    errorContainer.appendChild(errorSourceHeader);

    const errorSourceContent = ownerDocument.createElement('pre');
    errorSourceContent.textContent = `${source}`;
    errorContainer.appendChild(errorSourceContent);
  }

  containerElem.appendChild(errorContainer);
}
