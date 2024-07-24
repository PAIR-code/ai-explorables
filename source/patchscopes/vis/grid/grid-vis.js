/**
 * @license SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Visualize results of patching as an explorable grid.
 */

import {ExperimentData} from '../../lib/experiment-data.js';
import {loadProgressUntil} from '../../lib/load-progress-until.js';

/**
 * CSS class to assign to container for styling.
 */
const GRID_VIS_CLASS = 'grid-vis';

/**
 * Grid visualization.
 *
 */
class GridVis {
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
     * Max generation length. Supplied in metadata of fetched JSON.
     * @type {number}
     * @see setupData()
     */
    this.maxGenLen = undefined;

    /**
     * Name of model from which data came. Supplied in metadata of fetched JSON.
     * @type {string}
     * @see setupData()
     */
    this.modelName = undefined;

    /**
     * Number of layers of the model. Supplied in metadata of fetched JSON.
     * @type {number}
     * @see setupData()
     */
    this.numLayers = undefined;

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
     * Two-dimensional grid for rendering the interactive table. Indexed first
     * by target layer, then source layer.
     * @type {Object[][]}
     * @see setupData()
     */
    this.targetLayersGrid = undefined;

    /**
     * Source layer selected for investigation.
     * @type {number}
     * @see setupVis()
     */
    this.selectedSourceLayer = undefined;

    /**
     * Target layer selected for investigation.
     * @type {number}
     * @see setupVis()
     */
    this.selectedTargetLayer = undefined;

    /**
     * Selected token id.
     * @type {number}
     * @see setupVis()
     */
    this.selectedTokenId = undefined;

    /**
     * Source layer being hovered.
     * @type {number}
     * @see setupVis()
     */
    this.hoveredSourceLayer = undefined;

    /**
     * Target layer being hovered.
     * @type {number}
     * @see setupVis()
     */
    this.hoveredTargetLayer = undefined;

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
     * D3 selection housing the injected `<table>` element for visualizing.
     * @type {d3.Selection}
     * @see setupVis()
     */
    this.tableSel = undefined;

    /**
     * D3 selection housing the target prompt.
     * @type {d3.Selection}
     * @see setupVis()
     */
    this.targetPromptSel = undefined;

    /**
     * D3 selection housing the output showing generated tokens.
     * @type {d3.Selection}
     * @see setupVis()
     */
    this.generatedTokensSel = undefined;
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
    containerElem.classList.add(GRID_VIS_CLASS);

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
    this.maxGenLen = flatExperiment['max_gen_len'];
    this.modelName = flatExperiment['model'];
    this.numLayers = flatExperiment['num_layers'];
    this.sourceTokens = flatExperiment['prompt_source_ids'].map((id) => ({id}));
    this.targetTokens = flatExperiment['prompt_target_ids'].map((id) => ({id}));

    // Create skeleton grid, a two-dimensional array indexed first by target
    // layer, then by source layer. Fill each grid object with the layer numbers
    // and the list of generated tokens.
    this.targetLayersGrid = d3
      .range(this.numLayers)
      .map((targetLayer) =>
        d3
          .range(this.numLayers)
          .map((sourceLayer) => ({sourceLayer, targetLayer})),
      );
    this.experimentData.flatExperiments.forEach((flatExperiment) => {
      const row = this.targetLayersGrid[flatExperiment['layer_target']];
      const cell = row[flatExperiment['layer_source']];
      cell.generatedTokenIds = flatExperiment['generated_tok_ids'];
    });
  }

  /**
   * Set up the visualization. Expects `setupData()` to have already been called
   * succesfully and ran to completion.
   * @see setupData()
   */
  setupVis() {
    // Set initially selected source and target layers.
    this.selectedSourceLayer = d3.min(
      this.experimentData.flatExperiments,
      (flatExperiment) => flatExperiment['layer_source'],
    );

    this.selectedTargetLayer = d3.min(
      this.experimentData.flatExperiments,
      (flatExperiment) => flatExperiment['layer_target'],
    );

    const sourcePromptSection = d3
      .select(this.containerElem)
      .append('div')
      .attr('data-role', 'source-prompt-section');
    sourcePromptSection.append('strong').text('Source Prompt');

    this.sourcePromptSel = sourcePromptSection
      .append('p')
      .classed('token-container', true)
      .on('mouseout', () => {
        this.hoveredTokenId = undefined;
        this.update();
      });

    this.sourcePromptSel
      .selectAll('span')
      .data(this.sourceTokens)
      .enter()
      .append('span')
      .attr('data-token-id', ({id}) => id)
      .classed('has-experiments', ({hasExperiments}) => hasExperiments)
      .text(({id}) => this.experimentData.vocab.getString(id))
      .on('click', (...args) => this.handleTokenClick(...args))
      .on('mouseover', (...args) => this.handleTokenMouseover(...args));

    const targetPromptSection = d3
      .select(this.containerElem)
      .append('div')
      .attr('data-role', 'target-prompt-section');
    targetPromptSection.append('strong').text('Target Prompt');

    this.targetPromptSel = targetPromptSection
      .append('p')
      .classed('token-container', true)
      .on('mouseout', () => {
        this.hoveredTokenId = undefined;
        this.update();
      });

    this.targetPromptSel
      .selectAll('span')
      .data(this.targetTokens)
      .enter()
      .append('span')
      .attr('data-token-id', ({id}) => id)
      .classed('has-experiments', ({hasExperiments}) => hasExperiments)
      .text(({id}) => this.experimentData.vocab.getString(id))
      .on('click', (...args) => this.handleTokenClick(...args))
      .on('mouseover', (...args) => this.handleTokenMouseover(...args));

    const tableContainer = d3
      .select(this.containerElem)
      .append('div')
      .attr('data-role', 'table-container');

    tableContainer
      .append('div')
      .attr('data-role', 'source-layers-label')
      .append('strong')
      .append('span')
      .text('Source Layer');
    tableContainer
      .append('div')
      .attr('data-role', 'target-layers-label')
      .append('strong')
      .append('span')
      .text('Target Layer');

    this.tableSel = tableContainer.append('table').on('mouseout', () => {
      this.hoveredSourceLayer = undefined;
      this.hoveredTargetLayer = undefined;
      this.update();
    });

    const columnLabels = [
      {},
      ...d3.range(this.numLayers).map((sourceLayer) => ({
        sourceLayer,
        text: `${sourceLayer}`.padStart(2, '0'),
      })),
      {},
    ];

    this.tableSel
      .append('thead')
      .append('tr')
      .selectAll('th')
      .data(columnLabels)
      .enter()
      .append('th')
      .text(({text}) => text)
      .on('click', (...args) => this.handleCellClick(...args));

    const tr = this.tableSel
      .append('tbody')
      .selectAll('tr')
      .data(this.targetLayersGrid)
      .enter()
      .append('tr');

    tr.append('th')
      .datum((_, targetLayer) => ({targetLayer}))
      .text(({targetLayer}) => `${targetLayer}`.padStart(2, '0'))
      .on('click', (...args) => this.handleCellClick(...args));

    tr.selectAll('td')
      .data((row) => row)
      .enter()
      .append('td')
      .classed(
        'has-generated-tokens',
        ({generatedTokenIds}) => !!generatedTokenIds,
      )
      .on('click', (...args) => this.handleCellClick(...args))
      .on('mouseover', (...args) => this.handleCellMouseover(...args));

    tr.append('th')
      .datum((_, targetLayer) => ({targetLayer}))
      .text(({targetLayer}) => `${targetLayer}`.padStart(2, '0'))
      .on('click', (...args) => this.handleCellClick(...args));

    this.tableSel
      .append('tfoot')
      .append('tr')
      .selectAll('th')
      .data(columnLabels)
      .enter()
      .append('th')
      .text(({text}) => text)
      .on('click', (...args) => this.handleCellClick(...args));

    const generatedTokensSection = d3
      .select(this.containerElem)
      .append('div')
      .attr('data-role', 'generated-tokens-section');
    generatedTokensSection.append('strong').text('Generated Tokens');

    this.generatedTokensSel = generatedTokensSection
      .append('p')
      .classed('token-container', true)
      .on('mouseout', () => {
        this.hoveredTokenId = undefined;
        this.update();
      });

    this.update();
  }

  /**
   * Callback handler invoked when the user clicks on any cell of the table.
   * @param {Object} datum Data object bound to the clicked element.
   * @param {number} datum.sourceLayer Index of the selected source layer.
   * @param {number} datum.targetLayer Index of the selected source layer.
   */
  handleCellClick(datum) {
    let needsUpdate = false;
    if ('sourceLayer' in datum) {
      this.selectedSourceLayer = datum.sourceLayer;
      needsUpdate = true;
    }
    if ('targetLayer' in datum) {
      this.selectedTargetLayer = datum.targetLayer;
      needsUpdate = true;
    }
    if (needsUpdate) {
      this.update();
    }
  }

  /**
   * Callback handler invoked when the user hovers a table cell.
   * @param {Object} datum Data object bound to the clicked element.
   * @param {number} datum.sourceLayer Index of the selected source layer.
   * @param {number} datum.targetLayer Index of the selected source layer.
   */
  handleCellMouseover(datum) {
    let needsUpdate = false;
    if ('sourceLayer' in datum) {
      this.hoveredSourceLayer = datum.sourceLayer;
      needsUpdate = true;
    }
    if ('targetLayer' in datum) {
      this.hoveredTargetLayer = datum.targetLayer;
      needsUpdate = true;
    }
    if (needsUpdate) {
      this.update();
    }
  }

  /**
   * Callback handler invoked when the user clicks on a token.
   * @param {Object} datum Data object bound to the clicked element.
   * @param {number} datum.id Index of the token.
   */
  handleTokenClick(datum) {
    let needsUpdate = false;
    if ('id' in datum) {
      this.selectedTokenId = datum.id;
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
   */
  handleTokenMouseover(datum) {
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
    this.sourcePromptSel
      .selectAll('span')
      .data(this.sourceTokens)
      .classed('selected-token', ({id}) => id === this.selectedTokenId)
      .classed('hovered-token', ({id}) => id === this.hoveredTokenId);

    this.targetPromptSel
      .selectAll('span')
      .data(this.targetTokens)
      .classed('selected-token', ({id}) => id === this.selectedTokenId)
      .classed('hovered-token', ({id}) => id === this.hoveredTokenId);

    // Highlight selected and hovered columns.
    this.tableSel
      .selectAll('tbody > tr > td')
      .classed(
        'selected-source-layer',
        ({sourceLayer}) => sourceLayer === this.selectedSourceLayer,
      )
      .classed(
        'selected-target-layer',
        ({targetLayer}) => targetLayer === this.selectedTargetLayer,
      )
      .classed(
        'hovered-source-layer',
        ({sourceLayer}) => sourceLayer === this.hoveredSourceLayer,
      )
      .classed(
        'hovered-target-layer',
        ({targetLayer}) => targetLayer === this.hoveredTargetLayer,
      )
      .text(({generatedTokenIds}) =>
        (generatedTokenIds || []).includes(
          this.hoveredTokenId ?? this.selectedTokenId,
        )
          ? '\u25CF'
          : null,
      );

    const generatedTokenIds = (
      this.targetLayersGrid[
        this.hoveredTargetLayer ?? this.selectedTargetLayer
      ][this.hoveredSourceLayer ?? this.selectedSourceLayer]
        .generatedTokenIds || []
    ).map((id) => ({id}));

    const generatedTokensSel = this.generatedTokensSel
      .selectAll('span')
      .data(generatedTokenIds);

    generatedTokensSel
      .enter()
      .append('span')
      .on('click', (...args) => this.handleTokenClick(...args))
      .on('mouseover', (...args) => this.handleTokenMouseover(...args))
      .merge(generatedTokensSel)
      .attr('data-token-id', ({id}) => id)
      .classed('selected-token', ({id}) => id === this.selectedTokenId)
      .classed('hovered-token', ({id}) => id === this.hoveredTokenId)
      .text(({id}) => this.experimentData.vocab.getString(id));
  }
}

/**
 * Factory function that returns a callback to register vis.
 * The returned callback function will construct and initialize a `GridVis`.
 * @see GridVis.
 * @param {Fetcher} fetcher Shared fetcher function.
 * @return {Function} Callback function that constructs and init's a `GridVis`.
 */
export function gridVis(fetcher) {
  /**
   * @param {Element} containerElem Container element into which to render.
   * @param {Object} configJson Configuration JSON object.
   * @return {Promise} Async result of calling `GridVis` instance's `init()`.
   */
  return (containerElem, configJson) => {
    const vis = new GridVis(fetcher);
    return vis.init(containerElem, configJson);
  };
}
