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
const FLAT_GRID_VIS_CLASS = 'flat-grid-vis';

/**
 * Flat grid visualization.
 *
 */
class FlatGridVis {
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
     * Relative URL to JSON data. Supplied to `init()` via config.
     * @type {string}
     * @see init()
     */
    this.jsonDataUrl = undefined;

    /**
     * Array of objects representing the source prompt.
     * @type {Object[]}
     * @property {number} sourceTokens[].id Token id.
     * @property {boolean} sourceTokens[].hasExperiments
     * @see setupData()
     */
    this.sourceTokens = undefined;

    /**
     * Array of objects representing the target prompt.
     * @type {Object[]}
     * @property {number} targetTokens[].id Token id.
     * @property {boolean} targetTokens[].hasExperiments
     * @see setupData()
     */
    this.targetTokens = undefined;

    /**
     * Experiment data parsed from fetched response.
     * @type {ExperimentData}
     * @see init()
     */
    this.experimentData = new ExperimentData();

    /**
     * Mapping of selected tokens to color indices for multi-color exploration.
     * @type {Map<number, number>}
     * @see setupVis()
     */
    this.selectedTokenSets = new Map();

    /**
     * Hovered token id.
     * @type {number}
     * @see setupVis()
     */
    this.hoveredTokenId = undefined;

    /**
     * D3 selection housing the source prompt.
     * @type {d3.Selection}
     * @see setupVis()
     */
    this.sourcePromptSel = undefined;

    /**
     * D3 selection housing the target prompt.
     * @type {d3.Selection}
     * @see setupVis()
     */
    this.targetPromptSel = undefined;

    /**
     * D3 selection housing the flat grid of experiment results.
     * @type {d3.Selection}
     * @see setupVis()
     */
    this.flatGridSel = undefined;
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
  async init(containerElem, configJson) {
    // Check for duplicate `init()` invocation.
    if (this.containerElem) {
      throw new Error('init may only be called once');
    }
    this.containerElem = containerElem;

    // Check the config for required fields.
    const {jsonDataUrl} = configJson;
    if (!jsonDataUrl || typeof jsonDataUrl !== 'string') {
      throw new Error('jsonDataUrl field is missing');
    }
    this.jsonDataUrl = jsonDataUrl;

    // Set a CSS class on the container for styling.
    containerElem.classList.add(FLAT_GRID_VIS_CLASS);

    // Loading...
    await loadProgressUntil(
      this.containerElem,
      this.fetcher
        .fetch(jsonDataUrl)
        .then((response) => response.text())
        .then((stringData) => void this.setupData(stringData)),
    );

    // Once data is loaded and initialized, set up the visual elements.
    this.setupVis();
  }

  /**
   * Setup local properties based on fetched flat experiment data.
   * @param {string} stringData String of fetched flat experiment data.
   */
  setupData(stringData) {
    this.experimentData.initFromString(stringData);

    // NOTE: This visualization assumes that the loaded flat experiments all
    // have the same values for these fields, so reading them off the first
    // experiment suffices.
    const flatExperiment = this.experimentData.flatExperiments[0];
    this.sourceTokens = flatExperiment['prompt_source_ids'].map((id) => ({id}));
    this.targetTokens = flatExperiment['prompt_target_ids'].map((id) => ({id}));
  }

  /**
   * Set up the visualization. Expects `setupData()` to have already been called
   * succesfully and ran to completion.
   * @see setupData()
   */
  setupVis() {
    const sourcePromptSection = d3
      .select(this.containerElem)
      .append('div')
      .attr('data-role', 'source-prompt-section');
    sourcePromptSection.append('strong').text('Source Prompt');

    this.sourcePromptSel = sourcePromptSection
      .append('p')
      .classed('token-container', true);

    this.sourcePromptSel
      .selectAll('span')
      .data(this.sourceTokens)
      .enter()
      .append('span')
      .attr('data-token-id', ({id}) => id)
      .classed('has-experiments', ({hasExperiments}) => hasExperiments);

    const targetPromptSection = d3
      .select(this.containerElem)
      .append('div')
      .attr('data-role', 'target-prompt-section');
    targetPromptSection.append('strong').text('Target Prompt');

    this.targetPromptSel = targetPromptSection
      .append('p')
      .classed('token-container', true);

    this.targetPromptSel
      .selectAll('span')
      .data(this.targetTokens)
      .enter()
      .append('span')
      .attr('data-token-id', ({id}) => id)
      .classed('has-experiments', ({hasExperiments}) => hasExperiments);

    this.flatGridSel = d3
      .select(this.containerElem)
      .append('div')
      .attr('data-role', 'flat-grid-container');

    const flatGridRowSel = this.flatGridSel
      .selectAll('.flat-grid-row')
      .data(this.experimentData.flatExperiments)
      .enter()
      .append('div')
      .classed('flat-grid-row', true)
      .attr(
        'data-layer-source',
        (flatExperiment) => flatExperiment['layer_source'],
      )
      .attr(
        'data-layer-target',
        (flatExperiment) => flatExperiment['layer_target'],
      );

    const layerMappingSel = flatGridRowSel
      .append('div')
      .classed('layer-mapping', true)
      .attr('title', (flatExperiment) =>
        [
          `layer_source:${flatExperiment['layer_source']}`,
          `layer_target:${flatExperiment['layer_target']}`,
        ].join('\n'),
      );
    layerMappingSel
      .append('span')
      .classed('layer-source', true)
      .text((flatExperiment) =>
        `${flatExperiment['layer_source']}`.padStart(2, '0'),
      );
    layerMappingSel.append('span').text('\u2192');
    layerMappingSel
      .append('span')
      .classed('layer-target', true)
      .text((flatExperiment) =>
        `${flatExperiment['layer_target']}`.padStart(2, '0'),
      );
    layerMappingSel.append('span').text('\u2192');

    const tokenContainersSel = flatGridRowSel
      .append('div')
      .classed('token-cell', true)
      .append('div')
      .classed('token-container', true);

    tokenContainersSel
      .selectAll('[data-token-id]')
      .data((flatExperiment) =>
        flatExperiment['generated_tok_ids'].map((id) => ({id})),
      )
      .enter()
      .append('span')
      .attr('data-token-id', ({id}) => id);

    d3.select(this.containerElem)
      .selectAll('[data-token-id]')
      .attr('title', ({id}) => `id:${id}`)
      .text(({id}) => this.experimentData.vocab.getString(id))
      .on('click', (...args) => this.handleTokenClick(...args))
      .on('mousedown', () => {
        // Prevent selecting text on rapid clicks.
        // @see https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/detail
        if (d3.event.detail > 1) {
          d3.event.preventDefault();
        }
      })
      .on('mouseout', () => {
        this.hoveredTokenId = undefined;
        this.update();
      })
      .on('mouseover', (...args) => this.handleTokenMouseover(...args));

    this.update();
  }

  /**
   * Callback handler invoked when the user clicks on a token.
   * @param {Object} datum Data object bound to the clicked element.
   * @param {number} datum.id Index of the token.
   */
  handleTokenClick(datum) {
    let needsUpdate = false;
    if ('id' in datum) {
      const nextSetNumber = (this.selectedTokenSets.get(datum.id) ?? -1) + 1;
      if (nextSetNumber > 5) {
        this.selectedTokenSets.delete(datum.id);
      } else {
        this.selectedTokenSets.set(datum.id, nextSetNumber);
      }
      needsUpdate = true;
    }
    if (needsUpdate) {
      this.update();
    }
  }

  /**
   * Callback handler invoked when the user hovers a token.
   * @param {Object} datum Data object bound to the hovered element.
   * @param {number} datum.id Index of the token.
   * @param {number} index Index into the elements array of the hovered element.
   * @param {Element[]} elements Array of elements involved in the selection.
   */
  handleTokenMouseover(datum, index, elements) {
    let needsUpdate = false;
    if ('id' in datum) {
      this.hoveredTokenId = datum.id;
      needsUpdate = true;
    }
    if (needsUpdate) {
      this.update();
    }
  }

  /**
   * Update visualization elements in response to user interaction.
   */
  update() {
    d3.select(this.containerElem)
      .selectAll('[data-token-id]')
      .attr('data-selected-token-set', ({id}) => this.selectedTokenSets.get(id))
      .classed('hovered-token', ({id}) => id === this.hoveredTokenId);
  }
}

/**
 * Factory function that returns a callback to register vis.
 * The returned callback function will construct and initialize a `FlatGridVis`.
 * @see FlatGridVis.
 * @param {Fetcher} fetcher Shared fetcher function.
 * @return {Function} Callback function that constructs and init's an instance.
 */
export function flatGridVis(fetcher) {
  /**
   * @param {Element} containerElem Container element into which to render.
   * @param {Object} configJson Configuration JSON object.
   * @return {Promise} Async result of calling `GridVis` instance's `init()`.
   */
  return (containerElem, configJson) => {
    const vis = new FlatGridVis(fetcher);
    return vis.init(containerElem, configJson);
  };
}
