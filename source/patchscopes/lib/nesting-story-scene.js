/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview A story scene that nests other story scenes.
 */

import {StoryScene} from './story-scene.js';

/**
 * Base class for `SequenceStoryScene` and `ConcurrentStoryScene` objects which
 * deal with sequences of scenes and concurrently running scenes respectively.
 */
export class NestingStoryScene extends StoryScene {
  /**
   * Takes an array of objects each with an `offsetScrollHeight` and a
   * `storyScene`. This object's `scrollHeight` will be the maximum height of
   * any such object computed by adding the `offsetScrollHeight` to the
   * `storyScene`'s `getScrollHeight()` result.
   * @param {Array<{offsetScrollHeight: number; storyScene: StoryScene}>} offestStoryScenes
   */
  constructor(offsetStoryScenes) {
    if (!offsetStoryScenes || !offsetStoryScenes.length) {
      throw new Error('offsetStoryScenes missing');
    }

    let maxHeight = undefined;
    for (let i = 0; i < offsetStoryScenes.length; i++) {
      const {storyScene, offsetScrollHeight} = offsetStoryScenes[i];
      const height = offsetScrollHeight + storyScene.getScrollHeight();
      if (maxHeight === undefined || height > maxHeight) {
        maxHeight = height;
      }
    }

    super(maxHeight);

    /**
     * Sequences of story scenes with their offset scroll heights.
     * @type {Array<{offsetScrollHeight: number; storyScene: StoryScene}>}
     */
    this.offsetStoryScenes = offsetStoryScenes;
  }

  /**
   * Calls `scroll()` method of each contributing story scene. The `offsetTop`
   * value passed to each incorporates the offset scroll height of preceding
   * story scenes.
   * @param {number} offsetTop Current scrolly offset top position.
   */
  scroll(offsetTop) {
    for (const {offsetScrollHeight, storyScene} of this.offsetStoryScenes) {
      storyScene.scroll(offsetTop - offsetScrollHeight);
    }
  }
}
