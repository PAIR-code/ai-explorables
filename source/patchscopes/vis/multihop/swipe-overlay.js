/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Show a dismissable overlay indicating to touch-swipe up.
 */

export class SwipeOverlay {
  constructor() {
    /**
     * Container element into which the swipe overlay has been inserted.
     * Recorded on call to `init()`.
     * @type {Element|undefined}
     * @see init()
     */
    this.containerElem = undefined;

    /**
     * Callback to dismiss the swipe overlay manually. Only created on `init()`.
     * @type {Function|undefined}
     * @see init()
     */
    this.dismiss = undefined;
  }

  /**
   * Create DOM content for the swipe overlay and insert into the specified
   * container element.
   * @param {Element} containerElem Container element into which to insert.
   */
  init(containerElem) {
    if (this.containerElem) {
      throw new Error('SwipeOverlay already initialized');
    }
    this.containerElem = containerElem;

    const doc = containerElem.ownerDocument;
    const swipeOverlayDiv = doc.createElement('div');
    swipeOverlayDiv.classList.add('swipe-overlay');
    containerElem.appendChild(swipeOverlayDiv);

    const arrowUpwardIcon = doc.createElement('span');
    arrowUpwardIcon.classList.add('material-symbols-outlined');
    arrowUpwardIcon.classList.add('arrow-upward');
    arrowUpwardIcon.textContent = 'arrow_upward';
    swipeOverlayDiv.append(arrowUpwardIcon);

    const touchAppIcon = doc.createElement('span');
    touchAppIcon.classList.add('material-symbols-outlined');
    touchAppIcon.classList.add('touch-app');
    touchAppIcon.textContent = 'touch_app';
    swipeOverlayDiv.append(touchAppIcon);

    // Repeated calls to `dismiss()` have no practical effect.
    const dismiss = () => {
      swipeOverlayDiv.classList.add('dismissed');
      swipeOverlayDiv.removeEventListener('touchstart', dismiss);
      doc.defaultView.removeEventListener('wheel', dismiss);
    };

    // The first touch inside the swipe overlay OR any wheel event on the window
    // signal that the overlay should be dismissed.
    swipeOverlayDiv.addEventListener('touchstart', dismiss);
    doc.defaultView.addEventListener('wheel', dismiss);

    // Expose the `dismiss()` method in case creator wants to call it.
    this.dismiss = dismiss;
  }
}
