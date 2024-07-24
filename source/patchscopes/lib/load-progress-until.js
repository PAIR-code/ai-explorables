/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Utility function to show loading progress.
 */

/**
 * Show a loading progress indicator until the provided promise settles.
 * @param {Element} containerElem HTML Element into which to show loading msg.
 * @param {Promise<unknown>} promise Promise that denotes loading finished.
 */
export async function loadProgressUntil(containerElem, promise) {
  // Create an element to show the loading indicator.
  const {ownerDocument} = containerElem;
  const loadingElem = ownerDocument.createElement('p');
  containerElem.appendChild(loadingElem);

  let loadingRenderHandle = undefined;

  const loadingRenderFn = () => {
    // Since the content may be centered, padding with non-breaking spaces
    // prevents too much jitter.
    const dotsAndNbsp = '.'
      .repeat(Math.round(Date.now() / 400) % 4)
      .padEnd(4, '\u00a0');
    loadingElem.textContent = `Loading${dotsAndNbsp}`;
    loadingRenderHandle = requestAnimationFrame(loadingRenderFn);
  };

  loadingRenderFn();

  try {
    await promise;
  } finally {
    // Irrespective of whether the provided promise succeeded or failed, we
    // should cancel the loading animation and clean up.
    cancelAnimationFrame(loadingRenderHandle);
    containerElem.removeChild(loadingElem);
  }
}
