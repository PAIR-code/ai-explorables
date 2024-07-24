/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Visualize results of patching as a flat, explorable grid.
 */

import {ExperimentData} from '../../lib/experiment-data.js';
import {loadProgressUntil} from '../../lib/load-progress-until.js';

/**
 * CSS class to assign to container for styling.
 */
const TOKENS_VIS_CLASS = 'tokens-vis';

/**
 * Flat grid visualization.
 *
 */
class TokensVis {
  /**
   * @param {Fetcher} fetcher Shared caching Fetcher instance.
   */
  constructor(fetcher) {
    /**
     * Shared cacheing Fetcher instance.
     * @type {Fetcher}
     */
    this.fetcher = fetcher;

    /**
     * Container element into which to render. Supplied to `init()`.
     * @type {Element}
     * @see init()
     */
    this.containerElem = undefined;

    /**
     * Array of objects representing the target prompt.
     * @type {Object[]}
     * @property {number} targetTokens[].id Token id.
     * @property {boolean} targetTokens[].hasExperiments
     * @see setupData()
     */
    this.tokens = undefined;

    /**
     * D3 selection housing the target prompt.
     * @type {d3.Selection}
     * @see setupVis()
     */
    this.tokenSel = undefined;
  }

  /**
   * Perform initialization specific to config.
   *
   * Example configuration JSON:
   *
   * ```
   * {
   *   "jsonDataUrl": "./data/flat_data.json"
   * }
   * ```
   *
   * @param {Element} containerElem Container element into which to render.
   * @param {Object} configJson Configuration JSON object.
   * @param {number} configJson.jsonDataUrl URL to JSON data.
   * @throws {Error} If called more than once.
   * @throws {Error} If JSON data cannot be downloaded.
   */
  async init(containerElem, tokens, highlightLast, target, newLine) {
    // Check for duplicate `init()` invocation.
    if (this.containerElem) {
      throw new Error('init may only be called once');
    }
    this.containerElem = containerElem;

    // Set a CSS class on the container for styling.
    containerElem.classList.add(TOKENS_VIS_CLASS);

    this.tokens = tokens;
    this.highlightLast = highlightLast;
    this.newLine = newLine;
    this.target = target;

    // Once data is loaded and initialized, set up the visual elements.
    this.setupVis(tokens);
  }

  /**
   * Set up the visualization. Expects `setupData()` to have already been called
   * succesfully and ran to completion.
   * @see setupData()
   */
  setupVis() {
    this.tokenSel = d3
      .select(this.containerElem)
      .append('div')
      .attr(
        'class',
        `token-container ${this.highlightLast ? 'highlight ' : ''} ${this.newLine ? 'new-line' : ''}`,
      )
      .selectAll('div')
      .data(this.tokens)
      .enter()
      .append('div')
      .attr('class', `token ${this.target ? 'target' : ''}`)
      .text((d) => d);
  }
}

/**
 * Factory function that returns a callback to register vis.
 * The returned callback function will construct and initialize a `FlatGridVis`.
 * @see FlatGridVis.
 * @param {Fetcher} fetcher Shared fetcher function.
 * @return {Function} Callback function that constructs and init's an instance.
 */
export function tokensVis(fetcher) {
  /**
   * @param {Element} containerElem Container element into which to render.
   * @param {Object} configJson Configuration JSON object.
   * @return {Promise} Async result of calling `GridVis` instance's `init()`.
   */
  return (containerElem, configJson) => {
    const vis = new TokensVis(fetcher);
    return vis.init(
      containerElem,
      configJson.tokens,
      configJson.highlightLast ?? false,
      configJson.target ?? false,
      configJson.newLine ?? false,
    );
  };
}
