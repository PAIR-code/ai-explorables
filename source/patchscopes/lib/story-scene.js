/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview A scene that contributes to the patching walkthrough story.
 */

/**
 * A scene contributing to the patching walkthrough. Handles updates based on
 * scroll position.
 */
export class StoryScene {
  /**
   * @param {number|undefined} scrollHeight Height to scroll through this scene.
   * @throws If `scrollHeight` is neither undefined nor a number.
   */
  constructor(scrollHeight) {
    if (scrollHeight !== undefined && typeof scrollHeight !== 'number') {
      throw new Error('scrollHeight is not a number');
    }

    /**
     * Height of the scene in scrolly pixels. That is, the number of pixels the
     * user must scroll to pass by this story scene.
     * @type {number|undefined}
     */
    this.scrollHeight = scrollHeight;

    /**
     * Offset top of the last update. Used to determine when crucial thresholds
     * have been passed, such as entering the scene or leaving. Value updated
     * automatically in `scroll()` method. Subclasses SHOULD NOT modify this
     * member.
     * @type {number|undefined}
     */
    this.previousOffsetTop = undefined;
  }

  /**
   * Returns the scroll height of this scene as specified by the `scrollHeight`
   * member. If `scrollHeight` is not a number, an error is thrown.
   * @returns {number} Scroll height of this scene.
   * @throws If `scrollHeight` is not a number.
   */
  getScrollHeight() {
    if (isNaN(this.scrollHeight)) {
      throw new Error('scrollHeight is not a number');
    }
    return this.scrollHeight;
  }

  /**
   * Invoke lifecycle handlers appropriate for the current state and offset top.
   *
   * Lifecycle order:
   * - `onInit()` - Called when `previousOffsetTop` is undefined.
   * - `onRepeat()` - Called when `offsetTop` equals  `previousOffsetTop`.
   * - `onEnter()` - When `offsetTop` is INSIDE but `previousOffsetTop` wasn't.
   * - `onExit()` - When `offsetTop` is OUTSIDE but `previousOffsetTop` wasn't.
   * - `onScroll()` - Called last, if not preempted.
   *
   * If a lifecycle handler returns `false`, processing will be halted and later
   * lifecycle handlers will NOT be invoked. Handlers may return void/undefined.
   * Whether that is interpreted as `true` or `false` depends on the lifecycle
   * phase. See documentation for specific lifecycle handlers for details.
   * @param {number} offsetTop Current scrolly offset top position.
   * @throws If `offsetTop` is not a number.
   * @see onInit()
   * @see onRepeat()
   * @see onEnter()
   * @see onExit()
   * @see onScroll()
   */
  scroll(offsetTop) {
    if (isNaN(offsetTop)) {
      throw new Error('offsetTop is not a number');
    }

    const scrollHeight = this.getScrollHeight();

    // Note previous offset top value, to be sent to lifecycle handlers.
    const {previousOffsetTop} = this;

    // Record current offset top value since any of the lifecycle handlers may
    // halt processing.
    this.previousOffsetTop = offsetTop;

    if (previousOffsetTop === undefined) {
      const initResult = this.onInit(offsetTop);
      if (initResult === false) {
        // Short-circuit if `onInit()` returned literal `false`.
        return;
      }
    }

    if (offsetTop === previousOffsetTop) {
      const repeatResult = this.onRepeat(offsetTop);
      if (repeatResult !== true) {
        // Short-circuit unless `onRepeat()` returned literal `true`.
        return;
      }
    }

    const wasInside =
      previousOffsetTop !== undefined &&
      previousOffsetTop > 0 &&
      previousOffsetTop < scrollHeight;

    const isInside = offsetTop > 0 && offsetTop < scrollHeight;

    if (!wasInside && isInside) {
      const enterResult = this.onEnter(offsetTop, previousOffsetTop);
      if (enterResult === false) {
        // Short-circuit if `onEnter()` returned literal `false`.
        return;
      }
    }

    if (wasInside && !isInside) {
      const exitResult = this.onExit(offsetTop, previousOffsetTop);
      if (exitResult === false) {
        // Short-circuit if `onExit()` returned literal `false`.
        return;
      }
    }

    this.onScroll(offsetTop, previousOffsetTop);
  }

  /**
   * Called by `scroll()` when `previousOffsetTop` is undefined. Return value
   * indicates whether to continue update processing. A void/undefined return
   * value implies `false` (halt).
   * @param {number} offsetTop Current offset top of this update.
   * @returns {boolean|void} Whether to continue with update (void => `false`).
   */
  onInit(offsetTop) {
    // Default behavior is to do nothing.
  }

  /**
   * Called by `scroll()` when `offsetTop` exactly equals `previousOffsetTop`.
   * Return value indicates whether to continue update processing. A
   * void/undefined return value implies `false` (halt).
   * @param {number} offsetTop Current offset top of this update.
   * @returns {boolean|void} Whether to continue with update (void => `false`).
   */
  onRepeat(offsetTop) {
    // Default behavior is to do nothing.
  }

  /**
   * Called by `scroll()` when `offsetTop` is INSIDE the scroll height of this
   * story scene, and `previousOffsetTop` was OUTSIDE. Return value indicates
   * whether to continue update processing. A void/undefined return value
   * implies `true` (continue).
   *
   * Note that this is called both when entering from above (regular, forward
   * scrolling) and from below (backward scrolling). If distinct behavior is
   * required for these cases, then the subclass override method SHOULD
   * compare `offsetTop` to `previousOffsetTop` to determine the direction.
   * @param {number} offsetTop Current offset top of this update.
   * @param {number} previousOffsetTop Offset top of previous update.
   * @returns {boolean|void} Whether to continue with update (void => `true`).
   */
  onEnter(offsetTop, previousOffsetTop) {
    // Default behavior is to do nothing.
  }

  /**
   * Called by `scroll()` when `offsetTop` is OUTSIDE the scroll height of this
   * story scene, and `previousOffsetTop` was INSIDE. Return value indicates
   * whether to continue update processing. A void/undefined return value
   * implies `true` (continue).
   *
   * Note that this is called both when exiting from above (regular, forward
   * scrolling) and from below (backward scrolling). If distinct behavior is
   * required for these cases, then the subclass override method SHOULD
   * compare `offsetTop` to `previousOffsetTop` to determine the direction.
   * @param {number} offsetTop Current offset top of this update.
   * @param {number} previousOffsetTop Offset top of previous update.
   * @returns {boolean|void} Whether to continue with update (void => `true`).
   */
  onExit(offsetTop, previousOffsetTop) {
    // Default behavior is to do nothing.
  }

  /**
   * Called by `scroll()` as last lifecycle phase.
   * @param {number} offsetTop Current offset top of this update.
   * @param {number} previousOffsetTop Offset top of previous update.
   */
  onScroll(offsetTop, previousOffsetTop) {
    // Default behavior is to do nothing.
  }
}
