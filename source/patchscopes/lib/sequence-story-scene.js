/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview A story scene that nests other story scenes.
 */

import {NestingStoryScene} from './nesting-story-scene.js';
import {StoryScene} from './story-scene.js';

/**
 * A `StoryScene` composed of a nested sequence of sub scenes.
 */
export class SequenceStoryScene extends NestingStoryScene {
  /**
   * @param {StoryScene[]} storyScenes Sequence of story scenes.
   */
  constructor(storyScenes) {
    const offsetStoryScenes = [];

    let offsetScrollHeight = 0;
    for (const storyScene of storyScenes) {
      offsetStoryScenes.push({offsetScrollHeight, storyScene});
      offsetScrollHeight += storyScene.getScrollHeight();
    }

    super(offsetStoryScenes);
  }
}
