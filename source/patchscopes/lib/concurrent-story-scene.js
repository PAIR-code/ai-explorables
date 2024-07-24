/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview A story scene that runs sub-stories concurrently.
 */

import {NestingStoryScene} from './nesting-story-scene.js';
import {StoryScene} from './story-scene.js';

/**
 * A `StoryScene` composed of nested scenes all running concurrently.
 */
export class ConcurrentStoryScene extends NestingStoryScene {
  /**
   * @param {StoryScene[]} storyScenes Story scenes to run concurrently.
   */
  constructor(storyScenes) {
    super(
      storyScenes.map((storyScene) => ({offsetScrollHeight: 0, storyScene})),
    );
  }
}
