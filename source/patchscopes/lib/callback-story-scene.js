/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview A story scene defined by constructor callbacks.
 */

import {StoryScene} from './story-scene.js';

/**
 * A `StoryScene` where the handlers are specified by callback functions in the
 * constructor params.
 */
export class CallbackStoryScene extends StoryScene {
  /**
   * @param {object} params Constructor parameters.
   * @param {number|undefined} params.scrollHeight Height of scroll story.
   * @param {Function|undefined} params.onInit onInit() callback.
   * @param {Function|undefined} params.onRepeat onRepeat() callback.
   * @param {Function|undefined} params.onEnter onEnter() callback.
   * @param {Function|undefined} params.onExit onExit() callback.
   * @param {Function|undefined} params.onScroll onScroll() callback.
   * @throws If `scrollHeight` is neither undefined nor a number.
   */
  constructor(params) {
    const {onInit, onRepeat, onEnter, onExit, onScroll, scrollHeight} = params;

    super(scrollHeight);

    /**
     * Callback function to implement `onInit()`, if any.
     * @type {Function|undefined}
     */
    this.onInitCallbackFn = onInit;

    /**
     * Callback function to implement `onRepeat()`, if any.
     * @type {Function|undefined}
     */
    this.onRepeatCallbackFn = onRepeat;

    /**
     * Callback function to implement `onEnter()`, if any.
     * @type {Function|undefined}
     */
    this.onEnterCallbackFn = onEnter;

    /**
     * Callback function to implement `onExit()`, if any.
     * @type {Function|undefined}
     */
    this.onExitCallbackFn = onExit;

    /**
     * Callback function to implement `onScroll()`, if any.
     * @type {Function|undefined}
     */
    this.onScrollCallbackFn = onScroll;
  }

  /**
   * Called by `scroll()` when `previousOffsetTop` is undefined. Return value
   * indicates whether to continue update processing. A void/undefined return
   * value implies `false` (halt).
   * @param {number} offsetTop Current offset top of this update.
   * @returns {boolean|void} Whether to continue with update (void => `false`).
   */
  onInit(offsetTop) {
    const {onInitCallbackFn} = this;
    if (onInitCallbackFn) {
      return onInitCallbackFn(offsetTop);
    }
  }

  /**
   * Called by `scroll()` when `offsetTop` exactly equals `previousOffsetTop`.
   * Return value indicates whether to continue update processing. A
   * void/undefined return value implies `false` (halt).
   * @param {number} offsetTop Current offset top of this update.
   * @returns {boolean|void} Whether to continue with update (void => `false`).
   */
  onRepeat(offsetTop) {
    const {onRepeatCallbackFn} = this;
    if (onRepeatCallbackFn) {
      return onRepeatCallbackFn(offsetTop);
    }
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
    const {onEnterCallbackFn} = this;
    if (onEnterCallbackFn) {
      return onEnterCallbackFn(offsetTop, previousOffsetTop);
    }
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
    const {onExitCallbackFn} = this;
    if (onExitCallbackFn) {
      return onExitCallbackFn(offsetTop, previousOffsetTop);
    }
  }

  /**
   * Called by `scroll()` after other lifecycle phases..
   * @param {number} offsetTop Current offset top of this update.
   * @param {number} previousOffsetTop Offset top of previous update.
   */
  onScroll(offsetTop, previousOffsetTop) {
    const {onScrollCallbackFn} = this;
    if (onScrollCallbackFn) {
      return onScrollCallbackFn(offsetTop, previousOffsetTop);
    }
  }
}
